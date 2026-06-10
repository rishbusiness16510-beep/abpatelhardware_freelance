import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import Button from '../ui/Button';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartItemCount,
  selectIsDrawerOpen,
  closeCartDrawer,
  removeFromCart,
  updateQuantity,
} from '../../features/cart/cartSlice';

export default function CartDrawer() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const isOpen = useAppSelector(selectIsDrawerOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => dispatch(closeCartDrawer())}
      />

      {/* Drawer Panel */}
      <div
        className={`absolute inset-y-0 right-0 w-full max-w-md bg-surface shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-accent" />
            <h2 className="font-heading text-lg font-bold text-primary">
              Your Cart
              <span className="text-sm font-body font-normal text-text-muted ml-2">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            </h2>
          </div>
          <Button
            onClick={() => dispatch(closeCartDrawer())}
            className="p-2 -mr-2 text-text-muted hover:text-error transition-colors bg-transparent border-none outline-none"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-border mb-4" />
              <p className="font-heading text-lg font-semibold text-text mb-2">
                Your cart is empty
              </p>
              <p className="text-sm text-text-muted mb-6">
                Browse our collection and add items to get started.
              </p>
              <Button
                onClick={() => dispatch(closeCartDrawer())}
                className="text-accent hover:text-accent-dark font-medium text-sm bg-transparent border-none outline-none"
              >
                Continue Shopping →
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-4 bg-bg rounded-lg p-3"
              >
                {/* Image */}
                <Link
                  to={`/product/${item.slug}`}
                  onClick={() => dispatch(closeCartDrawer())}
                  className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-bg-alt"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                      No Image
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.slug}`}
                    onClick={() => dispatch(closeCartDrawer())}
                    className="text-sm font-semibold text-text hover:text-accent transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  {(item.finish || item.size) && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {[item.finish, item.size].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  <p className="text-sm font-bold text-text mt-1">
                    ₹{item.unitPrice.toLocaleString('en-IN')}
                  </p>

                  {/* Quantity + Remove */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-border rounded-md bg-surface">
                      <Button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              variantId: item.variantId,
                              quantity: item.quantity - 1,
                            })
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-primary disabled:opacity-30 transition-colors bg-transparent border-none outline-none"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-xs font-semibold text-text">
                        {item.quantity}
                      </span>
                      <Button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              variantId: item.variantId,
                              quantity: item.quantity + 1,
                            })
                          )
                        }
                        disabled={item.quantity >= item.maxStock}
                        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-primary disabled:opacity-30 transition-colors bg-transparent border-none outline-none"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <Button
                      onClick={() =>
                        dispatch(
                          removeFromCart({
                            productId: item.productId,
                            variantId: item.variantId,
                          })
                        )
                      }
                      className="p-1.5 text-text-muted hover:text-error transition-colors bg-transparent border-none outline-none"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — only show when cart has items */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4 bg-bg-alt">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Subtotal</span>
              <span className="text-lg font-bold text-text">
                ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-xs text-text-muted">Shipping and taxes calculated at checkout</p>

            <Link
              to="/checkout"
              onClick={() => dispatch(closeCartDrawer())}
              className="block w-full py-3.5 bg-primary text-white text-center text-sm font-medium uppercase tracking-wider rounded-md hover:bg-primary-dark transition-colors"
            >
              Proceed to Checkout
            </Link>
            <Button
              onClick={() => dispatch(closeCartDrawer())}
              className="block w-full text-center text-sm text-accent hover:text-accent-dark font-medium bg-transparent border-none outline-none"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
