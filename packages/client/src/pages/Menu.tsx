import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMenu } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getFoodImage } from '../data/foodImages';
import type { MenuItem } from '../types';

const CATEGORIES = [
  { label: 'All', value: 'All' },
  { label: 'Appetizers', value: 'appetizer' },
  { label: 'Main Course', value: 'main_course' },
  { label: 'Desserts', value: 'dessert' },
  { label: 'Beverages', value: 'beverage' },
  { label: 'Premium Beverages', value: 'premium_beverage' },
];
const CATEGORY_LABELS: Record<string, string> = {
  appetizer: 'Appetizer',
  main_course: 'Main Course',
  dessert: 'Dessert',
  beverage: 'Beverage',
  premium_beverage: 'Premium',
};

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    getMenu(category === 'All' ? undefined : category as string)
      .then(data => {
        setItems(data);
        setError('');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      is_premium: item.is_premium,
    });
  };

  return (
    <div className="menu-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Our Menu</h1>
          <p className="page-subtitle">Explore our authentic Himalayan dishes</p>
        </div>

        {/* Search */}
        <div className="menu-search">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search dishes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`category-tab ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="page-loading"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No dishes found. Try a different category or search term.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filtered.map(item => (
              <div key={item.id} className="menu-card">
                <Link to={`/menu/${item.id}`} className="menu-card-link">
                  <div className="menu-card-image">
                    <img
                      className="menu-card-img"
                      src={getFoodImage(item, 500)}
                      alt={item.name}
                      loading="lazy"
                    />
                    {!!item.is_premium && (
                      <span className="badge badge-premium">Premium</span>
                    )}
                    {!item.is_available && (
                      <span className="badge badge-unavailable">Unavailable</span>
                    )}
                  </div>
                  <div className="menu-card-body">
                    <h3 className="menu-card-name">{item.name}</h3>
                    <span className="badge badge-category">{CATEGORY_LABELS[item.category] || item.category}</span>
                    <p className="menu-card-price">Rs. {item.price}</p>
                  </div>
                </Link>
                <div className="menu-card-footer">
                  {item.is_premium && !isAuthenticated ? (
                    <Link to="/login" className="btn btn-sm btn-outline">
                      <span className="lock-icon">&#128274;</span> Login to Order
                    </Link>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.is_available}
                    >
                      {item.is_available ? 'Add to Cart' : 'Unavailable'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
