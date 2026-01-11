import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { MdLock } from 'react-icons/md'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext)

  // Show loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="access-denied">
        <MdLock size={64} />
        <h2>Please Login</h2>
        <p>You need to login to access this page</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="btn btn-primary"
        >
          Go to Login
        </button>
      </div>
    )
  }

  // Redirect if admin route but user is not admin
  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="access-denied">
        <MdLock size={64} />
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page</p>
        <button
          onClick={() => window.location.href = '/'}
          className="btn btn-primary"
        >
          Go Home
        </button>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
