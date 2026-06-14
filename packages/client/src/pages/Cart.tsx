import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getFoodImage } from '../data/foodImages';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalAmount, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Your Cart</h1>
          </div>
          <div className="empty-state">
            <span className="empty-icon">&#128722;</span>
            <h2>Your cart is empty</h2>
            <p>Explore our menu and add some delicious dishes!</p>
            <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Your Cart</h1>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <img className="cart-item-img" src={getFoodImage(item.name, 150)} alt={item.name} />
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  {!!item.is_premium && <span className="badge badge-premium">Premium</span>}
                  <p className="cart-item-price">Rs. {item.price}</p>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-selector">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >-</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >+</button>
                  </div>
                  <p className="cart-item-subtotal">Rs. {item.price * item.quantity}</p>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => removeItem(item.id)}
                  >Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3 className="cart-summary-title">Order Summary</h3>
            <div className="cart-summary-row">
              <span>Subtotal ({items.length} items)</span>
              <span>Rs. {totalAmount}</span>
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>Rs. {totalAmount}</span>
            </div>

            {isAuthenticated ? (
              <Link to="/checkout" className="btn btn-primary btn-block">
                Proceed to Checkout
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-block">
                Login to Checkout
              </Link>
            )}

            <button className="btn btn-outline btn-block" onClick={clearCart}>
              Clear Cart
            </button>

            <Link to="/menu" className="continue-shopping">&larr; Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
