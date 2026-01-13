import { useContext, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  MdDashboard,
  MdShoppingBag,
  MdAnalytics,
  MdAssignment,
  MdCategory,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose
} from 'react-icons/md';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard Overview', icon: MdDashboard },
    { path: '/admin/products', label: 'Product Management', icon: MdShoppingBag },
    { path: '/admin/analytics', label: 'Sales & Analytics', icon: MdAnalytics },
    { path: '/admin/orders', label: 'Order Management', icon: MdAssignment },
    { path: '/admin/stock', label: 'Inventory / Stock', icon: MdCategory },
    { path: '/admin/settings', label: 'Settings', icon: MdSettings }
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <MdClose size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <MdMenu size={24} />
          </button>
          <h1>Admin</h1>
          <div className="admin-user">
            <span>{user?.name || 'Admin'}</span>
            <span className="badge badge-admin">Admin</span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
