'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { HiMinus, HiPlus, HiOutlineTrash } from 'react-icons/hi';
import PageHero from '@/components/PageHero';
import MediaImage from '@/components/MediaImage';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, hasHydrated } = useCartStore();
  const subtotal = getTotal();
  const shipping = subtotal >= 3000 ? 0 : 200;
  const total = subtotal + shipping;

  if (!hasHydrated) {
    return (
      <div>
        <PageHero title="Loading your cart" align="center" />
        <div className="container-custom py-12">
          <div className="mx-auto max-w-4xl space-y-4">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="surface-card skeleton h-28 rounded-[1.5rem]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHero title="Your cart is empty" align="center" />
        <div className="container-custom py-12 text-center">
          <Link href="/shop" className="btn-primary">Shop Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        title="Your Cart"
      />
      <div className="container-custom py-10 md:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, idx) => (
            <div key={`${item.productId}-${item.variantId}-${idx}`} className="surface-card flex gap-3 sm:gap-4 p-3 sm:p-4 md:p-5">
              <div className="relative w-20 sm:w-24 h-20 sm:h-24 bg-brand-secondary rounded-[1.25rem] overflow-hidden flex-shrink-0">
                {item.image && <MediaImage src={item.image} alt={item.name} sizes="96px" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <Link href={`/product/${item.slug}`} className="font-medium hover:underline">{item.name}</Link>
                {(item.size || item.color) && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {item.size && `Size: ${item.size}`}{item.size && item.color && ' | '}{item.color && `Color: ${item.color}`}
                  </p>
                )}
                <p className="font-semibold mt-1">{formatPrice(item.price)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-brand-secondary/40 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 transition-colors rounded-l-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <HiMinus size={14} />
                    </button>
                    <span className="w-8 text-center" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 transition-colors rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
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
                    <HiOutlineTrash size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="surface-card h-fit lg:sticky lg:top-24 p-4 sm:p-6">
          <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-4 text-sm">
            <span className="text-gray-500">Shipping</span>
            <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
          </div>
          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="mt-3 text-sm text-brand-dark-light">{shipping === 0 ? 'You qualify for free shipping.' : `Add ${formatPrice(3000 - subtotal)} more for free shipping.`}</p>
          <Link href="/checkout" className="btn-primary w-full text-center mt-6">
            Proceed to Checkout
          </Link>
          <Link href="/shop" className="btn-outline w-full text-center mt-3">
            Continue Shopping
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
