import React from 'react'
import { Link } from 'react-router-dom'
import { MdShoppingCart, MdPerson, MdSearch, MdMenu, MdClose } from 'react-icons/md'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { CartContext } from '../context/CartContext'

const Header = ({ appName }) => {
  const { user, logout } = useContext(AuthContext)
  const { totalItems } = useContext(CartContext)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <header className="header">
      <div className="header-container">
        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>

        {/* Logo */}
        <Link to="/" className="logo">
          <h1>{appName}</h1>
        </Link>

        {/* Search Bar */}
        <div className="search-bar">
          <input type="text" placeholder="Search sarees..." />
          <button className="search-btn">
            <MdSearch size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Shop</Link>
          <Link to="/categories" className="nav-link">Categories</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>

        {/* User Actions */}
        <div className="user-actions">
          {/* Cart */}
          <Link to="/cart" className="action-btn cart-btn">
            <MdShoppingCart size={24} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="user-menu">
              <Link
                to={user.role === 'admin' ? '/admin' : '/orders'}
                className="action-btn"
              >
                <MdPerson size={24} />
              </Link>
              <button onClick={logout} className="btn btn-text">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-text">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
