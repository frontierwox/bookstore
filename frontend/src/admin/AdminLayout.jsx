import { Outlet } from 'react-router-dom'
import AdminDashboard from '../pages/AdminDashboard'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const AdminLayout = () => {
  const { user } = useContext(AuthContext)

  if (user?.role !== 'admin') {
    return (
      <div className="admin-error">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this area.</p>
      </div>
    )
  }

  return (
    <AdminDashboard>
      <Outlet />
    </AdminDashboard>
  )
}

export default AdminLayout
