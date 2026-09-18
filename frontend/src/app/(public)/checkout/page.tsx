'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatPrice, CITIES } from '@/lib/utils';
import { trackEvent } from '@/lib/trackEvent';
import toast from 'react-hot-toast';
import MediaImage from '@/components/MediaImage';

import { HiOutlineTruck, HiOutlineShieldCheck, HiOutlineRefresh, HiOutlineLockClosed } from 'react-icons/hi';
import CitySearchSelect from '@/components/CitySearchSelect';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart, hasHydrated } = useCartStore();
  const [loading, setLoading] = useState(false);
  const submittedRef = useRef(false);
  const [form, setForm] = useState({ customerName: '', email: '', phone: '', whatsapp: '', address: '', city: '', notes: '' });

  const subtotal = getTotal();
  const shippingFee = subtotal >= 3000 ? 0 : 200;
  const total = subtotal + shippingFee;

  useEffect(() => {
    if (hasHydrated && items.length > 0) {
      trackEvent.beginCheckout(subtotal, items.length);
    }
  }, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated) {
    return (
      <div className="container-custom py-6 md:py-10">
        <h1 className="text-2xl font-serif font-bold text-brand-dark mb-6">Checkout</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="surface-card skeleton h-72 rounded-[1.5rem]" />
              <div className="surface-card skeleton h-32 rounded-[1.5rem]" />
            </div>
            <div className="surface-card skeleton h-80 rounded-[1.5rem]" />
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Auto-fill WhatsApp if user hasn't manually edited it
      setForm((prev) => ({
        ...prev,
        phone: value,
        ...(prev.whatsapp === '' || prev.whatsapp === prev.phone ? { whatsapp: value } : {}),
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    if (!form.customerName.trim() || !form.phone.trim() || !form.address.trim() || !form.city) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.phone.replace(/[^0-9]/g, '').length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);
    try {
      const referralCode = typeof window !== 'undefined' ? localStorage.getItem('hg_ref') : null;
      const orderData = {
        ...form,
        shippingFee,
        ...(referralCode ? { referralCode } : {}),
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.name,
          size: item.size,
          color: item.color,
          price: item.price,
          quantity: item.quantity,
          productImage: item.image,
        })),
      };

      const order = await api.post('/orders', orderData);
      trackEvent.purchase({ orderNumber: order.orderNumber, total, itemCount: items.length });
      clearCart();
      router.push(`/order-confirmation?order=${order.orderNumber}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
      setLoading(false);
      submittedRef.current = false;
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-custom py-12 text-center">
        <h1 className="text-2xl font-serif font-bold text-brand-dark mb-4">Your cart is empty</h1>
        <p className="text-brand-dark-light mb-6">Add something to your cart first, then come back here.</p>
        <Link href="/shop" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="container-custom py-6 md:py-10">
      <h1 className="text-2xl font-serif font-bold text-brand-dark mb-6">Checkout</h1>
      <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-card p-6">
            <h2 className="font-semibold text-lg mb-4">Delivery Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium mb-1">Full Name *</label>
                <input type="text" id="customerName" name="customerName" value={form.customerName} onChange={handleChange}
                  autoComplete="name" autoFocus
                  className="w-full border border-brand-secondary/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary hover:border-brand-secondary transition-all duration-200" required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">Mobile Number *</label>
                <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="03XX XXXXXXX"
                  autoComplete="tel"
                  className="w-full border border-brand-secondary/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary hover:border-brand-secondary transition-all duration-200" required />
              </div>
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium mb-1">WhatsApp Number <span className="text-gray-400 font-normal">(for order updates)</span></label>
                <input type="tel" id="whatsapp" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="03XX XXXXXXX"
                  className="w-full border border-brand-secondary/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary hover:border-brand-secondary transition-all duration-200" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email <span className="text-gray-400 font-normal">(for order confirmation)</span></label>
                <input type="email" id="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full border border-brand-secondary/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary hover:border-brand-secondary transition-all duration-200" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium mb-1">Delivery Address *</label>
                <input type="text" id="address" name="address" value={form.address} onChange={handleChange}
                  autoComplete="street-address"
                  className="w-full border border-brand-secondary/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary hover:border-brand-secondary transition-all duration-200" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <CitySearchSelect value={form.city} onChange={(city) => setForm({ ...form, city })} cities={CITIES} />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">Order Notes (optional)</label>
                <input type="text" id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Any special instructions"
                  className="w-full border border-brand-secondary/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary hover:border-brand-secondary transition-all duration-200" />
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
            <div className="flex items-center gap-3 border-2 border-brand-primary rounded-xl p-4 bg-brand-bg/30">
              <div className="w-5 h-5 rounded-full border-2 border-brand-primary flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-brand-primary" />
              </div>
              <div>
                <p className="font-semibold">Cash on Delivery (COD)</p>
                <p className="text-sm text-gray-500">Pay when you receive your order</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-brand-dark-light flex items-center gap-1.5">
              <HiOutlineShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
              No online payment needed — pay cash to the delivery person
            </p>
          </div>

          {/* Delivery Timeline */}
          <div className="surface-card p-4 sm:p-6 bg-blue-50/50 border border-blue-100">
            <div className="flex items-start gap-3">
              <HiOutlineTruck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-brand-dark">Estimated Delivery</p>
                <p className="text-sm text-gray-600 mt-0.5">Major cities (Lahore, Karachi, Islamabad): <strong>2-3 business days</strong></p>
                <p className="text-sm text-gray-600">Other areas: <strong>3-5 business days</strong></p>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><HiOutlineLockClosed className="w-3 h-3" /> Discreet, unmarked packaging on every order</p>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card h-fit lg:sticky lg:top-24 p-4 sm:p-6">
          <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

          <div className="space-y-3 mb-4 max-h-40 sm:max-h-60 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="relative w-14 h-14 bg-brand-bg rounded overflow-hidden flex-shrink-0">
                  {item.image && <MediaImage src={item.image} alt={item.name} sizes="56px" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.size && `${item.size}`} × {item.quantity}</p>
                  <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-4 text-lg disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Order...
              </span>
            ) : `Place Order · ${formatPrice(total)}`}
          </button>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-brand-dark-light">
              <HiOutlineLockClosed className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Private packaging on every order</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-brand-dark-light">
              <HiOutlineTruck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{subtotal >= 3000 ? 'Free delivery included' : 'Free delivery over Rs. 3,000'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-brand-dark-light">
              <HiOutlineRefresh className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Easy 7-day exchange policy</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-brand-dark-light">
              <HiOutlineShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Cash on delivery — pay when it arrives</span>
            </div>
          </div>
        </div>
      </form>
      </div>

      {/* Mobile sticky Place Order bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-brand-dark">{formatPrice(total)}</p>
          </div>
          <button type="submit" form="checkout-form" disabled={loading} className="btn-primary flex-1 max-w-[200px] py-3.5 text-base disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing...
              </span>
            ) : 'Place Order'}
          </button>
        </div>
      </div>
      {/* Spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
