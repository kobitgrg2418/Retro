import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMenu, getOffers } from '../api';
import { useCart } from '../context/CartContext';
import { getFoodImage, HERO_IMAGE } from '../data/foodImages';
import type { MenuItem, Offer } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  appetizer: 'Appetizer',
  main_course: 'Main Course',
  dessert: 'Dessert',
  beverage: 'Beverage',
  premium_beverage: 'Premium',
};

const AVATARS = [
  'https://i.pravatar.cc/96?img=12',
  'https://i.pravatar.cc/96?img=32',
  'https://i.pravatar.cc/96?img=45',
  'https://i.pravatar.cc/96?img=5',
];

export default function Home() {
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const { addItem } = useCart();
  const carouselRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    getMenu()
      .then(items => setFeatured(items.slice(0, 8)))
      .catch(() => {});
    getOffers()
      .then(data => setOffers(data.filter(o => o.is_active)))
      .catch(() => {});
  }, []);

  // Auto-advance the featured carousel every 1.5s (loops; pauses on hover).
  useEffect(() => {
    if (featured.length === 0) return;
    const id = setInterval(() => {
      const el = carouselRef.current;
      if (!el || pausedRef.current) return;
      const card = el.querySelector<HTMLElement>('.dish-card');
      const step = card ? card.offsetWidth + 26 : 296;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 1500);
    return () => clearInterval(id);
  }, [featured]);

  const scroll = (dir: number) => {
    carouselRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const handleAdd = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      is_premium: item.is_premium,
    });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <span className="hero-eyebrow">&#9733; Authentic Himalayan Cuisine</span>
            <h1 className="hero-title">
              It&rsquo;s not just <span className="accent">Food</span>,<br />
              It&rsquo;s an Experience.
            </h1>
            <p className="hero-subtitle">
              Savor the rich flavors of Nepal, Tibet, and the Himalayas &mdash; from
              hand-folded momos to aromatic thali platters, freshly made and delivered with warmth.
            </p>
            <div className="hero-actions">
              <Link to="/menu" className="btn btn-primary btn-lg">View Menu</Link>
              <Link to="/booking" className="btn btn-outline btn-lg">Book a Table</Link>
            </div>
            <div className="hero-reviews">
              <span className="hero-reviews-label">Loved by our guests</span>
              <div className="hero-reviews-row">
                <div className="avatar-stack">
                  {AVATARS.map((src, i) => (
                    <img key={i} src={src} alt="" loading="lazy" />
                  ))}
                  <span className="avatar-more">10K+</span>
                </div>
                <div className="hero-stars">
                  &#9733;&#9733;&#9733;&#9733;&#9733;
                  <small>4.9 from 2,500+ reviews</small>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-plate">
              <img src={HERO_IMAGE} alt="Signature Himalayan platter" />
            </div>
            <div className="hero-badge">
              <span className="hero-badge-icon">&#9733;</span>
              <div>
                <div className="hero-badge-pct">15% OFF</div>
                <div className="hero-badge-text">on your first order</div>
              </div>
            </div>
            <div className="hero-chip chip-1">
              <span className="hero-chip-emoji">&#128075;</span> Free Delivery
            </div>
            <div className="hero-chip chip-2">
              <span className="hero-chip-emoji">&#9201;</span> 30 min
            </div>
            <span className="float-emoji fe-1">&#127813;</span>
            <span className="float-emoji fe-2">&#127807;</span>
          </div>
        </div>
      </section>

      {/* Featured Menu Carousel */}
      {featured.length > 0 && (
        <section className="section featured-section">
          <div className="container">
            <h2 className="section-title">Featured Dishes</h2>
            <p className="section-subtitle">Handpicked favorites from our kitchen</p>
            <div className="carousel-wrap">
              <button className="carousel-btn prev" onClick={() => scroll(-1)} aria-label="Previous">&#8249;</button>
              <div
                className="featured-carousel"
                ref={carouselRef}
                onMouseEnter={() => { pausedRef.current = true; }}
                onMouseLeave={() => { pausedRef.current = false; }}
              >
                {featured.map(item => (
                  <div key={item.id} className="dish-card">
                    {item.is_premium ? <span className="dish-premium">Premium</span> : null}
                    <Link to={`/menu/${item.id}`}>
                      <img
                        className="dish-card-img"
                        src={getFoodImage(item, 300)}
                        alt={item.name}
                        loading="lazy"
                      />
                      <h3 className="dish-card-name">{item.name}</h3>
                    </Link>
                    <p className="dish-card-sub">{CATEGORY_LABELS[item.category] || item.category}</p>
                    <div className="dish-card-row">
                      <span className="dish-card-price">Rs. {item.price}</span>
                      <button className="dish-add" onClick={() => handleAdd(item)} aria-label={`Add ${item.name}`}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="carousel-btn next" onClick={() => scroll(1)} aria-label="Next">&#8250;</button>
            </div>
            <div className="section-action">
              <Link to="/menu" className="btn btn-primary">View Full Menu</Link>
            </div>
          </div>
        </section>
      )}

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

      {/* Offers Section */}
      {offers.length > 0 && (
        <section className="section offers-section">
          <div className="container">
            <h2 className="section-title">Special Offers</h2>
            <p className="section-subtitle">Treat yourself to something special</p>
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
          <p className="section-subtitle">Real stories from our happy diners</p>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-text">
                &ldquo;The momos at Gokyo Bistro are hands down the best I have ever had.
                The flavors transport you straight to Kathmandu. An absolute gem!&rdquo;
              </p>
              <p className="testimonial-author">&mdash; Priya S.</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-text">
                &ldquo;A wonderful dining experience from start to finish. The ambiance,
                the service, and the thali platter are all world-class. Highly recommended!&rdquo;
              </p>
              <p className="testimonial-author">&mdash; Raj M.</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-text">
                &ldquo;Every visit feels like a celebration. The Himalayan tea and desserts
                are the perfect way to end a meal. My family&rsquo;s favorite restaurant!&rdquo;
              </p>
              <p className="testimonial-author">&mdash; Anita K.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
