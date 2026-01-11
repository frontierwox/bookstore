import { Link } from 'react-router-dom'
import './components.css'

const Footer = ({ appName }) => {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section">
          <h3>{appName}</h3>
          <p>Your trusted destination for beautiful traditional and modern sarees.</p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Shop</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div className="footer-section">
          <h4>Categories</h4>
          <ul>
            <li><Link to="/products?category=silk">Silk Sarees</Link></li>
            <li><Link to="/products?category=cotton">Cotton Sarees</Link></li>
            <li><Link to="/products?category=banarasi">Banarasi</Link></li>
            <li><Link to="/products?category=kanchipuram">Kanchipuram</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <ul className="contact-info">
            <li>Email: info@sareestore.com</li>
            <li>Phone: +91 98765 43210</li>
            <li>Address: 123 Saree Street, Mumbai, India</li>
          </ul>
        </div>

        {/* Social Links */}
        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="Twitter">Twitter</a>
            <a href="#" aria-label="Pinterest">Pinterest</a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>&copy; {year} {appName}. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
