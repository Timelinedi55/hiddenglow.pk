'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatPrice, getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineTruck, HiOutlinePhone, HiOutlineMail, HiCheck, HiOutlinePrinter, HiOutlineQrcode } from 'react-icons/hi';
import { FaWhatsapp, FaBarcode } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusSteps = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function AdminOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const printReceipt = useCallback((orderData: Order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    const items = orderData.items?.map(
      (item) => `<tr><td style="padding:4px 0;border-bottom:1px dashed #ddd">${item.productName}${item.size ? ` (${item.size})` : ''}${item.color ? ` - ${item.color}` : ''}</td><td style="padding:4px 0;text-align:center;border-bottom:1px dashed #ddd">${item.quantity}</td><td style="padding:4px 0;text-align:right;border-bottom:1px dashed #ddd">Rs. ${(item.price * item.quantity).toLocaleString()}</td></tr>`
    ).join('') || '';
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Order ${orderData.orderNumber}</title><style>body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:10px}h2{text-align:center;margin:0 0 5px}table{width:100%;border-collapse:collapse}.center{text-align:center}.right{text-align:right}.bold{font-weight:bold}.divider{border:none;border-top:1px dashed #000;margin:8px 0}@media print{body{margin:0;padding:5px}}</style></head><body>
    <h2>HIDDEN GLOW</h2><p class="center" style="margin:0 0 5px">Order Receipt</p><hr class="divider"/>
    <p><b>Order:</b> ${orderData.orderNumber}<br/><b>Date:</b> ${new Date(orderData.createdAt).toLocaleDateString('en-PK')}<br/><b>Status:</b> ${orderData.status.toUpperCase()}</p><hr class="divider"/>
    <p><b>${orderData.customerName}</b><br/>${orderData.phone}${orderData.whatsapp ? '<br/>WA: ' + orderData.whatsapp : ''}<br/>${orderData.address}<br/>${orderData.city}</p><hr class="divider"/>
    <table><tr><th style="text-align:left;padding:4px 0">Item</th><th style="text-align:center;padding:4px 0">Qty</th><th style="text-align:right;padding:4px 0">Total</th></tr>${items}</table><hr class="divider"/>
    <table><tr><td>Subtotal</td><td class="right">Rs. ${Number(orderData.subtotal).toLocaleString()}</td></tr><tr><td>Shipping</td><td class="right">${Number(orderData.shippingFee) === 0 ? 'Free' : 'Rs. ' + Number(orderData.shippingFee).toLocaleString()}</td></tr><tr class="bold"><td style="padding-top:5px;border-top:1px solid #000">TOTAL</td><td class="right" style="padding-top:5px;border-top:1px solid #000">Rs. ${Number(orderData.total).toLocaleString()}</td></tr></table>
    <p class="center" style="margin-top:8px"><b>Payment:</b> ${orderData.paymentMethod}</p>${orderData.trackingNumber ? `<p class="center"><b>Tracking:</b> ${orderData.courierName || ''} ${orderData.trackingNumber}</p>` : ''}${orderData.notes ? `<p style="background:#fffde7;padding:4px;border-radius:3px"><b>Note:</b> ${orderData.notes}</p>` : ''}
    <hr class="divider"/><p class="center" style="font-size:10px">Thank you for shopping with Hidden Glow!</p>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script></body></html>`);
    printWindow.document.close();
  }, []);

  useEffect(() => {
    api.get(`/orders/${params.id}`).then((data) => {
      setOrder(data);
      setTrackingNumber(data.trackingNumber || '');
      setCourierName(data.courierName || '');
      setAdminNotes(data.adminNotes || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const updateStatus = async (newStatus: string) => {
    try {
      const updated = await api.put(`/orders/${params.id}/status`, {
        status: newStatus,
        note: statusNote || undefined,
        trackingNumber: trackingNumber || undefined,
        courierName: courierName || undefined,
      });
      setOrder(updated);
      setStatusNote('');
      toast.success(`Order marked as ${newStatus}`);
      // Auto-print on confirm
      if (newStatus === 'confirmed') {
        printReceipt(updated);
      }
    } catch { toast.error('Failed to update status'); }
  };

  const saveTracking = async () => {
    setSaving(true);
    try {
      await api.put(`/orders/${params.id}`, { trackingNumber, courierName, adminNotes });
      toast.success('Order details saved');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const currentStep = order ? statusSteps.indexOf(order.status) : -1;

  if (loading) return <div className="skeleton h-64 rounded-xl" />;
  if (!order) return <div className="text-center py-10"><p>Order not found</p></div>;

  const whatsappNum = (order.whatsapp || order.phone || '').replace(/[^0-9]/g, '');
  const whatsappLink = whatsappNum ? `https://wa.me/92${whatsappNum.startsWith('0') ? whatsappNum.slice(1) : whatsappNum}` : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline mb-1">&larr; Back to Orders</button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-dark">Order {order.orderNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-100'}`}>{order.status}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString('en-PK', { dateStyle: 'long', timeStyle: 'short' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => printReceipt(order)} className="inline-flex items-center gap-2 bg-brand-dark text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark/90">
            <HiOutlinePrinter className="w-4 h-4" /> Print Receipt
          </button>
        </div>
      </div>

      {/* Status Progress Bar */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded">
              <div className="h-full bg-green-500 rounded transition-all duration-500" style={{ width: `${Math.max(0, (currentStep / (statusSteps.length - 1)) * 100)}%` }} />
            </div>
            <div className="flex justify-between relative">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold relative z-10 transition-colors ${
                    i <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i <= currentStep ? <HiCheck className="w-5 h-5" /> : i + 1}
                  </div>
                  <p className={`text-xs mt-2 capitalize ${i <= currentStep ? 'font-semibold text-green-600' : 'text-gray-400'}`}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Order Items ({order.items?.length || 0})</h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.productImage && <img src={getImageUrl(item.productImage)} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-500">{item.size && `Size: ${item.size}`}{item.color && ` | Color: ${item.color}`} &times; {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span>{Number(order.shippingFee) === 0 ? 'Free' : formatPrice(order.shippingFee)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {/* Tracking & Courier */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><HiOutlineTruck className="w-5 h-5" /> Shipping & Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
                <select value={courierName} onChange={(e) => setCourierName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="">Select Courier</option>
                  <option value="TCS">TCS</option>
                  <option value="Leopards">Leopards</option>
                  <option value="M&P">M&P (Muller & Phipps)</option>
                  <option value="PostEx">PostEx</option>
                  <option value="Trax">Trax</option>
                  <option value="Rider">Rider</option>
                  <option value="CallCourier">Call Courier</option>
                  <option value="BlueEx">BlueEx</option>
                  <option value="Swyft">Swyft</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. 12345678"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (internal)</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} placeholder="Internal notes about this order..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <button onClick={saveTracking} disabled={saving} className="bg-brand-dark text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark/90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Update Status</h2>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Note (sent to customer)</label>
              <input type="text" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="e.g. Shipped via TCS, expected delivery in 2-3 days"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div className="flex flex-wrap gap-2">
              {order.status === 'pending' && <button onClick={() => updateStatus('confirmed')} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">Confirm Order</button>}
              {order.status === 'confirmed' && <button onClick={() => updateStatus('shipped')} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600">Mark Shipped</button>}
              {order.status === 'shipped' && <button onClick={() => updateStatus('delivered')} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600">Mark Delivered</button>}
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <button onClick={() => { if (confirm('Are you sure you want to cancel this order?')) updateStatus('cancelled'); }}
                  className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-200">Cancel Order</button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Customer</h2>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-base">{order.customerName}</p>
              <div className="flex items-center gap-2">
                <HiOutlinePhone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${order.phone}`} className="text-brand-primary hover:underline">{order.phone}</a>
              </div>
              {order.whatsapp && (
                <div className="flex items-center gap-2">
                  <FaWhatsapp className="w-4 h-4 text-green-500" />
                  <span>{order.whatsapp}</span>
                  {whatsappLink && (
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                      className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600 flex items-center gap-1">
                      <FaWhatsapp className="w-3 h-3" /> Chat
                    </a>
                  )}
                </div>
              )}
              {order.email && (
                <div className="flex items-center gap-2">
                  <HiOutlineMail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${order.email}`} className="text-brand-primary hover:underline">{order.email}</a>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <p className="text-gray-500 text-xs mb-1">Delivery Address</p>
                <p>{order.address}</p>
                <p className="font-medium">{order.city}</p>
              </div>
              {order.notes && (
                <div className="border-t pt-3">
                  <p className="text-gray-500 text-xs mb-1">Customer Notes</p>
                  <p className="bg-yellow-50 text-yellow-800 p-2 rounded text-xs">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Payment</h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium">{order.paymentMethod}</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status === 'delivered' ? 'Collected' : 'Pending'}</span></p>
            </div>
          </div>

          {/* Order QR Code */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><HiOutlineQrcode className="w-5 h-5" /> Order QR</h2>
            <div className="flex flex-col items-center gap-2">
              <QRCodeSVG value={order.orderNumber} size={120} level="M" />
              <p className="text-xs text-gray-500 font-mono">{order.orderNumber}</p>
              <p className="text-[10px] text-gray-400">Scan to fetch order details</p>
            </div>
          </div>

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Timeline</h2>
              <div className="space-y-0">
                {order.statusHistory.map((h, i) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${i === order.statusHistory!.length - 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {i < order.statusHistory!.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium capitalize">{h.status}</p>
                      {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                      <p className="text-[10px] text-gray-400">{new Date(h.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
