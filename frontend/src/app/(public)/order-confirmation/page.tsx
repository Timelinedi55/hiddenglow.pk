'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { HiCheckCircle } from 'react-icons/hi';
import PageHero from '@/components/PageHero';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      api.get(`/orders/track/${orderNumber}`).then((data) => {
        setOrder(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="container-custom section-padding text-center">
        <div className="skeleton h-16 w-16 rounded-full mx-auto mb-4" />
        <div className="skeleton h-8 w-64 mx-auto mb-2" />
        <div className="skeleton h-4 w-48 mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <PageHero
        eyebrow="Order Confirmed"
        title="Order Placed Successfully"
        description="We've got your order and will reach out to you soon about delivery."
        align="center"
      />
      <div className="container-custom py-10 md:py-14">
      <div className="max-w-2xl mx-auto text-center">
        <HiCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <p className="text-gray-500 mb-8">Thank you for your order. We&apos;ll process it shortly.</p>

        {order && (
          <div className="surface-card mb-8 p-6 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Order Number</p>
                <p className="font-bold text-lg">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Amount</p>
                <p className="font-bold text-lg">{formatPrice(order.total)}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-medium">Cash on Delivery</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Delivery Address</p>
                <p className="font-medium">{order.address}, {order.city}</p>
              </div>
            </div>

            <div className="border-t mt-4 pt-4">
              <h3 className="font-semibold mb-3">Items Ordered</h3>
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between py-1 text-sm">
                  <span>{item.productName} {item.size && `(${item.size})`} × {item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop" className="btn-primary">Continue Shopping</Link>
          <Link href="/track-order" className="btn-outline">Track Order</Link>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="container-custom section-padding text-center"><p>Loading...</p></div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
