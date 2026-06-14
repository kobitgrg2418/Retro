import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-heading">F<span className="brand-accent">oo</span>dy</h3>
          <p className="footer-text">
            Authentic Himalayan cuisine in the heart of the city.
            Experience the flavors of Nepal with every bite.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <Link to="/menu" className="footer-link">Our Menu</Link>
          <Link to="/booking" className="footer-link">Reservations</Link>
          <Link to="/login" className="footer-link">My Account</Link>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Contact Us</h4>
          <p className="footer-text">123 Mountain View Road</p>
          <p className="footer-text">Kathmandu, Nepal</p>
          <p className="footer-text">Phone: +977 1-4567890</p>
          <p className="footer-text">Email: hello@gokyobistro.com</p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Hours</h4>
          <p className="footer-text">Mon - Fri: 11:00 AM - 10:00 PM</p>
          <p className="footer-text">Saturday: 10:00 AM - 11:00 PM</p>
          <p className="footer-text">Sunday: 10:00 AM - 9:00 PM</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Gokyo Bistro. All rights reserved.</p>
      </div>
    </footer>
  );
}
