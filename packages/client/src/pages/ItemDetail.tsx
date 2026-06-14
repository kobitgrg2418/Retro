import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMenuItem } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import type { MenuItem } from '../types';

const CATEGORY_EMOJIS: Record<string, string> = {
  appetizer: '🥟',
  main_course: '🍛',
  dessert: '🍰',
  beverage: '🍵',
  premium_beverage: '🍷',
};

const CATEGORY_LABELS: Record<string, string> = {
  appetizer: 'Appetizers',
  main_course: 'Main Course',
  dessert: 'Desserts',
  beverage: 'Beverages',
  premium_beverage: 'Premium Beverages',
};

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getMenuItem(Number(id))
      .then(data => { setItem(data); setError(''); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!item) return;
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      is_premium: item.is_premium,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!item) return <div className="container"><p>Item not found.</p></div>;

  const canOrder = !item.is_premium || isAuthenticated;

  return (
    <div className="item-detail-page">
      <div className="container">
        <Link to="/menu" className="back-link">&larr; Back to Menu</Link>

        <div className="item-detail">
          <div className="item-detail-image">
            <span className="item-detail-emoji">
              {CATEGORY_EMOJIS[item.category] || '🍽️'}
            </span>
            {item.is_premium && <span className="badge badge-premium">Premium</span>}
          </div>

          <div className="item-detail-info">
            <h1 className="item-detail-name">{item.name}</h1>
            <span className="badge badge-category">{CATEGORY_LABELS[item.category] || item.category}</span>
            <p className="item-detail-price">Rs. {item.price}</p>
            <p className="item-detail-description">
              {item.description || 'A delicious dish prepared with the finest Himalayan ingredients and traditional recipes passed down through generations.'}
            </p>

            {!item.is_available && (
              <div className="alert alert-warning">This item is currently unavailable.</div>
            )}

            {item.is_premium && !isAuthenticated && (
              <div className="alert alert-info">
                <span className="lock-icon">&#128274;</span>
                This is a premium item. <Link to="/login">Log in</Link> to order.
              </div>
            )}

            <div className="item-detail-actions">
              <div className="quantity-selector">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >-</button>
                <span className="qty-value">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(q => q + 1)}
                >+</button>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleAdd}
                disabled={!canOrder || !item.is_available}
              >
                {added ? 'Added!' : `Add to Cart - Rs. ${item.price * quantity}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
