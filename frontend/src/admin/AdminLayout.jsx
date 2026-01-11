import { Outlet } from 'react-router-dom'
import AdminDashboard from '../pages/AdminDashboard'

const AdminLayout = () => {
  return (
    <AdminDashboard>
      <Outlet />
    </AdminDashboard>
  )
}

export default AdminLayout
