'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiCheck } from 'react-icons/hi';
import PageHero from '@/components/PageHero';

const statusSteps = ['pending', 'confirmed', 'shipped', 'delivered'];
const statusLabels: Record<string, string> = { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' };

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.get(`/orders/track/${orderNumber.trim()}`);
      setOrder(data);
    } catch {
      setOrder(null);
      toast.error('Order not found');
    }
    setLoading(false);
  };

  const currentStep = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div>
      <PageHero
        eyebrow="Order Tracking"
        title="Track Your Order"
        description="Pop in your order number to check where your package is."
        align="center"
      />
      <div className="container-custom py-10 md:py-14">
      <div className="mx-auto max-w-2xl">

        <form onSubmit={handleSearch} className="surface-card mb-10 flex gap-3 p-4 md:p-5">
          <div className="flex-1">
            <label htmlFor="order-number" className="sr-only">Order number</label>
            <input
              id="order-number"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. HG-A1B2C3D4"
              autoComplete="off"
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary px-6 min-w-[44px] min-h-[44px]" aria-label="Search order">
            <HiOutlineSearch size={20} />
          </button>
        </form>

        {loading && <div className="text-center text-gray-500">Searching...</div>}

        {searched && !order && !loading && (
          <div className="surface-card p-6 text-center mb-8">
            <p className="text-gray-600 font-medium mb-2">Order not found</p>
            <p className="text-gray-400 text-sm mb-4">Please check the order number and try again. You can find it in your WhatsApp or email confirmation.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="btn-outline text-sm">Contact Us</Link>
              <Link href="/faq" className="btn-outline text-sm">View FAQ</Link>
            </div>
          </div>
        )}

        {order && !loading && (
          <div className="surface-card p-6">
            <div className="flex justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-bold">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-bold">{formatPrice(order.total)}</p>
              </div>
            </div>

            {/* Status Tracker */}
            <div className="relative mb-8">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }} />
              </div>
              <div className="flex justify-between relative">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex flex-col items-center flex-1 min-w-0">
                    <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm relative z-10 ${
                      i <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {i <= currentStep ? <HiCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : i + 1}
                    </div>
                    <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center ${i <= currentStep ? 'font-semibold text-green-600' : 'text-gray-400'}`}>
                      {statusLabels[step]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-sm text-blue-800 mb-2">Tracking Information</h3>
                <div className="space-y-1 text-sm">
                  {order.courierName && <p><span className="text-blue-600">Courier:</span> {order.courierName}</p>}
                  <p><span className="text-blue-600">Tracking #:</span> {order.trackingNumber}</p>
                </div>
              </div>
            )}

            {/* Status History Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-3">Order Timeline</h3>
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

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span>{order.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span>{order.address}, {order.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span>{order.paymentMethod}</span>
              </div>
            </div>

            <div className="border-t mt-4 pt-4">
              <h3 className="font-semibold mb-3">Items</h3>
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between py-1 text-sm">
                  <span>{item.productName} {item.size && `(${item.size})`} &times; {item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
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
