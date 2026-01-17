import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, FileText } from 'lucide-react'
import { authApi } from '../services/auth'
import { AuthContext } from '../context/AuthContext'

const Register = () => {
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  
  // Independent toggles for password visibility
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Register
      const { confirmPassword, ...registerData } = formData
      await authApi.register(registerData)

      // Auto-login after successful registration
      const result = await login(formData.email, formData.password)
      
      if (!result.success) {
        setError(result.error || 'Registration succeeded but login failed. Please login manually.')
        return
      }

      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      // Prevent state update if component unmounted
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 md:py-8 relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-slate-200/30 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[500px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative z-10 my-4"
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-600 mb-4 shadow-sm">
            <User size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">Create Account</h1>
          <p className="text-slate-500 text-sm">Join our community to start shopping</p>
        </div>

        {/* Form Body */}
        <div className="px-6 md:px-8 pb-10">
          <AnimatePresence mode='wait'>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="name">Full Name</label>
              <InputGroup icon={<User size={20} />} type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} />
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="email">Email</label>
                <InputGroup icon={<Mail size={20} />} type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="phone">Phone</label>
                <InputGroup icon={<Phone size={20} />} type="tel" name="phone" placeholder="+91 98765..." value={formData.phone} onChange={handleChange} required={false} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="password">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Create a password"
                  required
                  minLength="6"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Repeat password"
                  required
                  minLength="6"
                />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                  {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start pt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500/30 cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-slate-600">
                  I agree to the <Link to="/terms" className="text-rose-600 hover:text-rose-800 font-medium hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-rose-600 hover:text-rose-800 font-medium hover:underline">Privacy Policy</Link>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:translate-y-[-1px] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-slate-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-rose-600 hover:text-rose-800 transition-colors">
              Log in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// Helper component to reduce repetition for standard inputs
const InputGroup = ({ icon, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-600 transition-colors">
      {icon}
    </div>
    <input
      {...props}
      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400"
      required={props.required !== false}
    />
  </div>
)

export default Register