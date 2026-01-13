import { Link } from 'react-router-dom'
import { MdShoppingCart, MdPerson, MdSearch, MdMenu, MdClose } from 'react-icons/md'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { CartContext } from '../context/CartContext'

const Navbar = ({ appName }) => {
  const { user, logout } = useContext(AuthContext)
  const { itemCount } = useContext(CartContext)

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <h1>{appName}</h1>
        </Link>

        {/* Search Bar */}
        <div className="navbar-search">
          <input type="text" placeholder="Search sarees..." />
          <button className="search-btn">
            <MdSearch size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Shop</Link>
        </div>

        {/* User Actions */}
        <div className="navbar-actions">
          {/* Cart */}
          <Link to="/cart" className="nav-action">
            <MdShoppingCart size={24} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>

          {/* User */}
          {user ? (
            <div className="user-menu">
              <Link to={user.role === 'admin' ? '/admin' : '/orders'} className="nav-action">
                <MdPerson size={24} />
              </Link>
              <button onClick={logout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-toggle">
          <MdMenu size={24} />
        </button>
      </div>
    </nav>
  )
}

export default Navbar