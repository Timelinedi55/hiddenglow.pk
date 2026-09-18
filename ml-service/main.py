import os
from contextlib import asynccontextmanager

import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "hiddenglow_db"),
        charset="utf8mb4",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up DB connection on startup
    try:
        conn = get_db()
        conn.close()
    except Exception:
        pass
    yield


app = FastAPI(title="Hidden Glow ML Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hiddenglow.pk", "http://localhost:3001"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Recommendations ───────────────────────────────────────────────
@app.get("/api/ml/recommendations/{product_id}")
def get_recommendations(product_id: int, limit: int = 6):
    """
    Product recommendations based on co-purchase patterns and category similarity.
    Uses collaborative filtering: "customers who bought X also bought Y".
    Falls back to category-based popularity if insufficient purchase data.
    """
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Co-purchase recommendations: find products bought together with this one
        cursor.execute(
            """
            SELECT oi2.productId, oi2.productName,
                   COUNT(*) as co_purchases,
                   p.price, p.discountPrice, p.slug,
                   (SELECT url FROM product_images WHERE productId = p.id AND isPrimary = 1 LIMIT 1) as image
            FROM order_items oi1
            JOIN order_items oi2 ON oi1.orderId = oi2.orderId AND oi2.productId != %s
            JOIN products p ON p.id = oi2.productId AND p.isActive = 1
            WHERE oi1.productId = %s
            GROUP BY oi2.productId, oi2.productName, p.price, p.discountPrice, p.slug
            ORDER BY co_purchases DESC
            LIMIT %s
            """,
            (product_id, product_id, limit),
        )
        co_purchase = cursor.fetchall()

        if len(co_purchase) >= limit:
            return {"source": "co_purchase", "products": co_purchase}

        # 2. Fall back to category-based popularity
        cursor.execute("SELECT categoryId FROM products WHERE id = %s", (product_id,))
        row = cursor.fetchone()
        if not row:
            return {"source": "none", "products": []}

        category_id = row["categoryId"]
        already_ids = [r["productId"] for r in co_purchase] + [product_id]
        placeholders = ",".join(["%s"] * len(already_ids))

        cursor.execute(
            f"""
            SELECT p.id as productId, p.name as productName,
                   p.price, p.discountPrice, p.slug,
                   COALESCE(sales.total_sold, 0) as popularity,
                   (SELECT url FROM product_images WHERE productId = p.id AND isPrimary = 1 LIMIT 1) as image
            FROM products p
            LEFT JOIN (
                SELECT productId, SUM(quantity) as total_sold
                FROM order_items GROUP BY productId
            ) sales ON sales.productId = p.id
            WHERE p.categoryId = %s AND p.isActive = 1
              AND p.id NOT IN ({placeholders})
            ORDER BY popularity DESC
            LIMIT %s
            """,
            (category_id, *already_ids, limit - len(co_purchase)),
        )
        category_popular = cursor.fetchall()

        return {
            "source": "mixed" if co_purchase else "category_popular",
            "products": co_purchase + category_popular,
        }
    finally:
        cursor.close()
        conn.close()


# ─── Demand Predictions ────────────────────────────────────────────
@app.get("/api/ml/predictions/demand")
def predict_demand(days_ahead: int = 7):
    """
    Predict product demand for the next N days based on recent sales trends.
    Uses simple linear regression on weekly sales data.
    """
    import numpy as np
    from sklearn.linear_model import LinearRegression

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get weekly sales for each product over last 8 weeks
        cursor.execute(
            """
            SELECT oi.productId, oi.productName,
                   YEARWEEK(o.createdAt) as week_num,
                   SUM(oi.quantity) as weekly_qty
            FROM order_items oi
            JOIN orders o ON o.id = oi.orderId
            WHERE o.createdAt >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
              AND o.status NOT IN ('cancelled')
            GROUP BY oi.productId, oi.productName, YEARWEEK(o.createdAt)
            ORDER BY oi.productId, week_num
            """
        )
        rows = cursor.fetchall()

        # Group by product
        product_data: dict = {}
        for row in rows:
            pid = row["productId"]
            if pid not in product_data:
                product_data[pid] = {"name": row["productName"], "weeks": []}
            product_data[pid]["weeks"].append(row["weekly_qty"])

        predictions = []
        for pid, data in product_data.items():
            weeks = data["weeks"]
            if len(weeks) < 2:
                # Not enough data, use average
                avg = sum(weeks) / len(weeks) if weeks else 0
                predicted = round(avg * days_ahead / 7, 1)
            else:
                X = np.arange(len(weeks)).reshape(-1, 1)
                y = np.array(weeks)
                model = LinearRegression().fit(X, y)
                next_week = np.array([[len(weeks)]]).reshape(-1, 1)
                predicted_weekly = max(0, float(model.predict(next_week)[0]))
                predicted = round(predicted_weekly * days_ahead / 7, 1)

            trend = "stable"
            if len(weeks) >= 2:
                recent = sum(weeks[-2:]) / 2
                earlier = sum(weeks[:2]) / 2
                if recent > earlier * 1.2:
                    trend = "rising"
                elif recent < earlier * 0.8:
                    trend = "declining"

            predictions.append(
                {
                    "productId": pid,
                    "productName": data["name"],
                    "predictedDemand": predicted,
                    "trend": trend,
                    "weeklyHistory": weeks,
                }
            )

        predictions.sort(key=lambda x: x["predictedDemand"], reverse=True)
        return {"daysAhead": days_ahead, "predictions": predictions[:20]}
    finally:
        cursor.close()
        conn.close()


# ─── Traffic-Not-Converting Analysis ───────────────────────────────
@app.get("/api/ml/analysis/traffic-dropoff")
def traffic_dropoff_analysis(days: int = 7):
    """
    Analyze why traffic is coming but not converting to orders.
    Checks: high-traffic pages with low/no orders, device breakdown,
    city breakdown, time-of-day patterns, product views vs purchases.
    """
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Products viewed many times but rarely purchased
        # analytics_events stores product info in eventData JSON
        cursor.execute(
            """
            SELECT JSON_UNQUOTE(JSON_EXTRACT(ae.eventData, '$.productId')) as productId,
                   JSON_UNQUOTE(JSON_EXTRACT(ae.eventData, '$.productName')) as productName,
                   COUNT(CASE WHEN ae.eventType = 'view_product' THEN 1 END) as views,
                   COUNT(CASE WHEN ae.eventType = 'add_to_cart' THEN 1 END) as cart_adds,
                   COUNT(CASE WHEN ae.eventType = 'purchase' THEN 1 END) as purchases
            FROM analytics_events ae
            WHERE ae.createdAt >= DATE_SUB(NOW(), INTERVAL %s DAY)
              AND JSON_EXTRACT(ae.eventData, '$.productId') IS NOT NULL
            GROUP BY productId, productName
            HAVING views >= 3
            ORDER BY views DESC
            LIMIT 20
            """,
            (days,),
        )
        product_dropoff = cursor.fetchall()
        for p in product_dropoff:
            p["viewToCartRate"] = (
                round(p["cart_adds"] / p["views"] * 100, 1)
                if p["views"] > 0
                else 0
            )
            p["cartToPurchaseRate"] = (
                round(p["purchases"] / p["cart_adds"] * 100, 1)
                if p["cart_adds"] > 0
                else 0
            )

        # 2. High-traffic pages (by page views) without conversions
        cursor.execute(
            """
            SELECT pv.url as page, COUNT(*) as pageviews,
                   COUNT(DISTINCT pv.visitorId) as unique_visitors
            FROM page_views pv
            WHERE pv.viewedAt >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY pv.url
            ORDER BY pageviews DESC
            LIMIT 15
            """,
            (days,),
        )
        top_pages = cursor.fetchall()

        # 3. Total visitors vs total orders in same period
        cursor.execute(
            """
            SELECT
              (SELECT COUNT(DISTINCT id) FROM visitors
               WHERE firstVisit >= DATE_SUB(NOW(), INTERVAL %s DAY)) as total_visitors,
              (SELECT COUNT(*) FROM orders
               WHERE createdAt >= DATE_SUB(NOW(), INTERVAL %s DAY)
                 AND status != 'cancelled') as total_orders
            """,
            (days, days),
        )
        overview = cursor.fetchone()
        visitors = overview["total_visitors"] or 1
        orders = overview["total_orders"] or 0
        conversion_rate = round(orders / visitors * 100, 2)

        # 4. Conversion by device
        cursor.execute(
            """
            SELECT v.deviceType as device,
                   COUNT(DISTINCT v.id) as visitors,
                   COUNT(DISTINCT o.id) as orders
            FROM visitors v
            LEFT JOIN orders o ON DATE(o.createdAt) = DATE(v.firstVisit)
              AND o.status != 'cancelled'
            WHERE v.firstVisit >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY v.deviceType
            """,
            (days,),
        )
        device_data = cursor.fetchall()

        # 5. Conversion by city
        cursor.execute(
            """
            SELECT city, COUNT(*) as orders, SUM(total) as revenue
            FROM orders
            WHERE createdAt >= DATE_SUB(NOW(), INTERVAL %s DAY)
              AND status != 'cancelled'
            GROUP BY city
            ORDER BY orders DESC
            LIMIT 10
            """,
            (days,),
        )
        city_orders = cursor.fetchall()

        # 6. Peak hours analysis
        cursor.execute(
            """
            SELECT HOUR(viewedAt) as hour,
                   COUNT(*) as visits
            FROM page_views
            WHERE viewedAt >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY HOUR(viewedAt)
            ORDER BY hour
            """,
            (days,),
        )
        visit_hours = cursor.fetchall()

        cursor.execute(
            """
            SELECT HOUR(createdAt) as hour,
                   COUNT(*) as orders
            FROM orders
            WHERE createdAt >= DATE_SUB(NOW(), INTERVAL %s DAY)
              AND status != 'cancelled'
            GROUP BY HOUR(createdAt)
            ORDER BY hour
            """,
            (days,),
        )
        order_hours = cursor.fetchall()
        order_hour_map = {r["hour"]: r["orders"] for r in order_hours}

        hourly_analysis = []
        for vh in visit_hours:
            h = vh["hour"]
            o = order_hour_map.get(h, 0)
            hourly_analysis.append(
                {
                    "hour": h,
                    "visits": vh["visits"],
                    "orders": o,
                    "conversionRate": round(o / vh["visits"] * 100, 2)
                    if vh["visits"] > 0
                    else 0,
                }
            )

        return {
            "period": f"Last {days} days",
            "overview": {
                "totalVisitors": visitors,
                "totalOrders": orders,
                "conversionRate": conversion_rate,
            },
            "productDropoff": product_dropoff,
            "topPages": top_pages,
            "deviceBreakdown": device_data,
            "topCities": city_orders,
            "hourlyAnalysis": hourly_analysis,
            "insights": _generate_insights(
                conversion_rate, product_dropoff, device_data, hourly_analysis
            ),
        }
    finally:
        cursor.close()
        conn.close()


def _generate_insights(
    conversion_rate: float,
    product_dropoff: list,
    device_data: list,
    hourly_analysis: list,
) -> list[str]:
    """Generate actionable insights from the data."""
    insights = []

    if conversion_rate < 1:
        insights.append(
            f"Conversion rate is very low ({conversion_rate}%). "
            "Consider improving product pages, adding trust signals, or simplifying checkout."
        )
    elif conversion_rate < 3:
        insights.append(
            f"Conversion rate ({conversion_rate}%) is below e-commerce average (2-4%). "
            "Room for improvement."
        )

    # Products with high views but low cart rate
    low_cart = [p for p in product_dropoff if p["viewToCartRate"] < 10 and p["views"] >= 10]
    if low_cart:
        names = ", ".join(p["productName"] for p in low_cart[:3])
        insights.append(
            f"Products with high views but low add-to-cart: {names}. "
            "Consider improving product descriptions, images, or pricing."
        )

    # Cart abandonment
    high_abandon = [
        p for p in product_dropoff if p["cart_adds"] > 0 and p["cartToPurchaseRate"] < 20
    ]
    if high_abandon:
        insights.append(
            f"{len(high_abandon)} products have high cart abandonment. "
            "Consider offering free shipping, exit-intent popups, or abandoned cart reminders."
        )

    # Mobile vs desktop
    for d in device_data:
        if d["device"] and "mobile" in d["device"].lower() and d["visitors"] > 0:
            mobile_rate = round(d["orders"] / d["visitors"] * 100, 2) if d["visitors"] else 0
            if mobile_rate < 1:
                insights.append(
                    f"Mobile conversion is very low ({mobile_rate}%). "
                    "Optimize mobile checkout experience."
                )

    # Time-based insights
    if hourly_analysis:
        peak_visit_hour = max(hourly_analysis, key=lambda x: x["visits"])
        peak_order_hour = max(hourly_analysis, key=lambda x: x["orders"])
        if peak_visit_hour["hour"] != peak_order_hour["hour"]:
            insights.append(
                f"Peak traffic is at {peak_visit_hour['hour']}:00 "
                f"but peak orders are at {peak_order_hour['hour']}:00. "
                "Schedule promotions/ads around peak order times."
            )

    return insights


# ─── Customer Behavior Clusters ────────────────────────────────────
@app.get("/api/ml/analysis/customer-segments")
def customer_segments():
    """
    Segment customers based on purchase behavior using K-Means clustering.
    Features: order count, total spend, avg order value, days since last order.
    """
    import numpy as np
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT customerName, phone, city,
                   COUNT(*) as order_count,
                   SUM(total) as total_spend,
                   AVG(total) as avg_order_value,
                   DATEDIFF(NOW(), MAX(createdAt)) as days_since_last,
                   DATEDIFF(NOW(), MIN(createdAt)) as days_since_first
            FROM orders
            WHERE status NOT IN ('cancelled')
            GROUP BY customerName, phone, city
            HAVING order_count >= 1
            """
        )
        customers = cursor.fetchall()

        if len(customers) < 4:
            return {"segments": [], "message": "Not enough customer data for segmentation"}

        # Prepare features
        features = np.array(
            [
                [
                    float(c["order_count"]),
                    float(c["total_spend"]),
                    float(c["avg_order_value"]),
                    float(c["days_since_last"]),
                ]
                for c in customers
            ]
        )

        scaler = StandardScaler()
        scaled = scaler.fit_transform(features)

        n_clusters = min(4, len(customers))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(scaled)

        # Characterize each segment
        segments: dict = {}
        for i, c in enumerate(customers):
            label = int(labels[i])
            if label not in segments:
                segments[label] = {
                    "customers": [],
                    "total_orders": 0,
                    "total_revenue": 0,
                }
            segments[label]["customers"].append(
                {
                    "name": c["customerName"],
                    "phone": c["phone"],
                    "city": c["city"],
                    "orders": c["order_count"],
                    "totalSpend": float(c["total_spend"]),
                    "avgOrderValue": round(float(c["avg_order_value"])),
                    "daysSinceLast": c["days_since_last"],
                }
            )
            segments[label]["total_orders"] += c["order_count"]
            segments[label]["total_revenue"] += float(c["total_spend"])

        # Name segments based on characteristics
        result = []
        for label, seg in segments.items():
            custs = seg["customers"]
            avg_orders = sum(c["orders"] for c in custs) / len(custs)
            avg_spend = seg["total_revenue"] / len(custs)
            avg_recency = sum(c["daysSinceLast"] for c in custs) / len(custs)

            if avg_orders >= 3 and avg_recency < 30:
                segment_name = "VIP / Loyal"
                description = "Frequent buyers, recent activity"
            elif avg_spend > 5000 and avg_recency < 60:
                segment_name = "High Value"
                description = "Big spenders, moderate frequency"
            elif avg_recency > 60:
                segment_name = "At Risk / Dormant"
                description = "Haven't ordered recently"
            else:
                segment_name = "Regular"
                description = "Steady customers"

            result.append(
                {
                    "segment": segment_name,
                    "description": description,
                    "customerCount": len(custs),
                    "avgOrders": round(avg_orders, 1),
                    "avgSpend": round(avg_spend),
                    "avgRecencyDays": round(avg_recency),
                    "totalRevenue": round(seg["total_revenue"]),
                    "customers": sorted(
                        custs, key=lambda x: x["totalSpend"], reverse=True
                    )[:10],
                }
            )

        result.sort(key=lambda x: x["totalRevenue"], reverse=True)
        return {"segments": result}
    finally:
        cursor.close()
        conn.close()


# ─── Trending Products ─────────────────────────────────────────────
@app.get("/api/ml/trending")
def trending_products(days: int = 7, limit: int = 10):
    """
    Identify trending products based on recent sales velocity compared to historical average.
    """
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT oi.productId, oi.productName,
                   SUM(CASE WHEN o.createdAt >= DATE_SUB(NOW(), INTERVAL %s DAY) THEN oi.quantity ELSE 0 END) as recent_sales,
                   SUM(CASE WHEN o.createdAt < DATE_SUB(NOW(), INTERVAL %s DAY)
                        AND o.createdAt >= DATE_SUB(NOW(), INTERVAL %s DAY) THEN oi.quantity ELSE 0 END) as prev_sales,
                   p.price, p.discountPrice, p.slug,
                   (SELECT url FROM product_images WHERE productId = p.id AND isPrimary = 1 LIMIT 1) as image
            FROM order_items oi
            JOIN orders o ON o.id = oi.orderId AND o.status != 'cancelled'
            JOIN products p ON p.id = oi.productId AND p.isActive = 1
            WHERE o.createdAt >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY oi.productId, oi.productName, p.price, p.discountPrice, p.slug
            ORDER BY recent_sales DESC
            LIMIT %s
            """,
            (days, days, days * 2, days * 2, limit),
        )
        products = cursor.fetchall()

        for p in products:
            recent = p["recent_sales"] or 0
            prev = p["prev_sales"] or 0
            if prev > 0:
                p["growthRate"] = round((recent - prev) / prev * 100, 1)
            elif recent > 0:
                p["growthRate"] = 100.0
            else:
                p["growthRate"] = 0

            if p["growthRate"] > 50:
                p["trendLabel"] = "Hot"
            elif p["growthRate"] > 0:
                p["trendLabel"] = "Rising"
            elif p["growthRate"] < -20:
                p["trendLabel"] = "Declining"
            else:
                p["trendLabel"] = "Steady"

        return {"period": f"Last {days} days", "products": products}
    finally:
        cursor.close()
        conn.close()


# ─── Health Check ──────────────────────────────────────────────────
@app.get("/api/ml/health")
def health():
    try:
        conn = get_db()
        conn.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("API_PORT", "4002"))
    reload = os.getenv("UVICORN_RELOAD", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)
