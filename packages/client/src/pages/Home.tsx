import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMenu, getOffers } from '../api';
import type { MenuItem, Offer } from '../types';

const FOOD_EMOJIS = ['🍛', '🥘', '🍜', '🥟', '🍲', '🫕', '🥗', '🍰'];

function getEmoji(index: number) {
  return FOOD_EMOJIS[index % FOOD_EMOJIS.length];
}

export default function Home() {
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    getMenu()
      .then(items => setFeatured(items.slice(0, 6)))
      .catch(() => {});
    getOffers()
      .then(data => setOffers(data.filter(o => o.is_active)))
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay">
          <h1 className="hero-title">Gokyo Bistro</h1>
          <p className="hero-tagline">Authentic Himalayan Cuisine</p>
          <p className="hero-subtitle">
            Savor the rich flavors of Nepal, Tibet, and the Himalayan region
          </p>
          <div className="hero-actions">
            <Link to="/menu" className="btn btn-primary btn-lg">View Menu</Link>
            <Link to="/booking" className="btn btn-outline btn-lg">Book a Table</Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section about-section">
        <div className="container">
          <h2 className="section-title">Our Story</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                Nestled in the heart of the city, Gokyo Bistro brings the authentic flavors
                of the Himalayas to your plate. Named after the pristine Gokyo Lakes of Nepal,
                our restaurant is a celebration of rich culinary traditions passed down through
                generations.
              </p>
              <p>
                Every dish is crafted with hand-selected spices, fresh local ingredients,
                and the warmth of Himalayan hospitality. From traditional momos to aromatic
                thali platters, we invite you to experience a culinary journey like no other.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat-item">
                <span className="stat-number">15+</span>
                <span className="stat-label">Years of Excellence</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Signature Dishes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Happy Customers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      {featured.length > 0 && (
        <section className="section featured-section">
          <div className="container">
            <h2 className="section-title">Featured Dishes</h2>
            <p className="section-subtitle">Handpicked favorites from our kitchen</p>
            <div className="menu-grid">
              {featured.map((item, idx) => (
                <Link to={`/menu/${item.id}`} key={item.id} className="menu-card">
                  <div className="menu-card-image">
                    <span className="menu-card-emoji">{getEmoji(idx)}</span>
                    {item.is_premium && <span className="badge badge-premium">Premium</span>}
                  </div>
                  <div className="menu-card-body">
                    <h3 className="menu-card-name">{item.name}</h3>
                    <span className="badge badge-category">{item.category}</span>
                    <p className="menu-card-price">Rs. {item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="section-action">
              <Link to="/menu" className="btn btn-primary">View Full Menu</Link>
            </div>
          </div>
        </section>
      )}

      {/* Offers Section */}
      {offers.length > 0 && (
        <section className="section offers-section">
          <div className="container">
            <h2 className="section-title">Special Offers</h2>
            <div className="offers-grid">
              {offers.map(offer => (
                <div key={offer.id} className="offer-card">
                  <div className="offer-discount">{offer.discount_percent}% OFF</div>
                  <h3 className="offer-title">{offer.title}</h3>
                  <p className="offer-desc">{offer.description}</p>
                  <p className="offer-validity">
                    {offer.valid_to && `Valid until ${new Date(offer.valid_to).toLocaleDateString()}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reserve Section */}
      <section className="section reserve-section">
        <div className="container">
          <div className="reserve-content">
            <h2 className="section-title light">Reserve Your Table</h2>
            <p className="reserve-text">
              Plan your next dining experience at Gokyo Bistro.
              Book your table in advance and enjoy a seamless, unforgettable evening.
            </p>
            <Link to="/booking" className="btn btn-primary btn-lg">Make a Reservation</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials-section">
        <div className="container">
          <h2 className="section-title">What Our Guests Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-text">
                &ldquo;The momos at Gokyo Bistro are hands down the best I have ever had.
                The flavors transport you straight to Kathmandu. An absolute gem!&rdquo;
              </p>
              <p className="testimonial-author">- Priya S.</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-text">
                &ldquo;A wonderful dining experience from start to finish. The ambiance,
                the service, and the thali platter are all world-class. Highly recommended!&rdquo;
              </p>
              <p className="testimonial-author">- Raj M.</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-text">
                &ldquo;Every visit feels like a celebration. The Himalayan tea and desserts
                are the perfect way to end a meal. My family's favorite restaurant!&rdquo;
              </p>
              <p className="testimonial-author">- Anita K.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
