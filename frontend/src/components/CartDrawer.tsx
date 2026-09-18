'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { HiOutlineX, HiMinus, HiPlus, HiOutlineTrash } from 'react-icons/hi';
import MediaImage from '@/components/MediaImage';

export default function CartDrawer() {
  const { items, isOpen, setOpen, removeItem, updateQuantity, getTotal, getCount } = useCartStore();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const subtotal = getTotal();
  const freeShippingGap = Math.max(0, 3000 - subtotal);
  const progress = Math.min(100, Math.round((subtotal / 3000) * 100));

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setVisible(false);
    }, 250);
  }, [setOpen]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!visible) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, handleClose]);

  if (!visible) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-[60] ${closing ? 'cart-backdrop-exit' : 'cart-backdrop-enter'}`} onClick={handleClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 bottom-0 z-[70] flex w-full max-w-[calc(100vw-2rem)] sm:max-w-md flex-col bg-white shadow-2xl ${closing ? 'cart-drawer-exit' : 'cart-drawer-enter'}`}
      >
        <div className="border-b border-brand-secondary/30 bg-brand-bg/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold">Your Cart ({getCount()})</h2>
              <p className="text-sm text-brand-dark-light">Ready for checkout whenever you are.</p>
            </div>
            <button onClick={handleClose} className="p-2 -m-1 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close cart">
              <HiOutlineX size={24} />
            </button>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-3">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-brand-dark-light/70">
              <span>Free shipping</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-brand-secondary/30" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Free shipping progress">
              <div className="h-2 rounded-full bg-brand-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-brand-dark-light">
              {freeShippingGap > 0
                ? `Add ${formatPrice(freeShippingGap)} more to unlock free delivery.`
                : 'Nice! You get free delivery.'}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <button onClick={handleClose} className="btn-primary">Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item, idx) => (
                <div key={`${item.productId}-${item.variantId}-${idx}`} className="flex gap-3 bg-gray-50 rounded-xl p-3 transition-colors hover:bg-brand-bg/60">
                  <div className="relative w-20 h-20 bg-brand-bg rounded-lg overflow-hidden flex-shrink-0">
                    {item.image && (
                      <MediaImage src={item.image} alt={item.name} sizes="80px" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    {(item.size || item.color) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.size && `Size: ${item.size}`}{item.size && item.color && ' | '}{item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    <p className="font-semibold text-sm mt-1">{formatPrice(item.price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 transition-colors rounded-l"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <HiMinus size={14} />
                        </button>
                        <span className="text-sm w-8 text-center" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 transition-colors rounded-r"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <HiPlus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-red-500 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Link href="/checkout" onClick={handleClose} className="btn-primary w-full text-center">
                Checkout
              </Link>
              <button onClick={handleClose} className="btn-outline w-full">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
