import { Link } from 'react-router-dom'
import { 
  Facebook, Instagram, Twitter, Linkedin, 
  Mail, MapPin, Phone, ArrowRight, CreditCard, ShieldCheck 
} from 'lucide-react'

const Footer = ({ appName = "Luxe Sarees" }) => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Top Section: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 border-b border-slate-800 pb-12">
          
          {/* Brand Story */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex gap-4 pt-2">
              <SocialIcon icon={<Facebook size={20} />} />
              <SocialIcon icon={<Instagram size={20} />} />
              <SocialIcon icon={<Twitter size={20} />} />
              <SocialIcon icon={<Linkedin size={20} />} />
            </div>
          </div>
        </div>

        {/* Middle Section: Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          
          {/* Column 1: Shop */}
          <div>
            <h4 className="text-white font-serif text-lg mb-6">Shop</h4>
            <ul className="space-y-4 text-sm">
              <FooterLink to="/products?category=silk">Silk Sarees</FooterLink>
              <FooterLink to="/products?category=banarasi">Banarasi Collection</FooterLink>
              <FooterLink to="/products?category=kanchipuram">Kanchipuram</FooterLink>
              <FooterLink to="/products?category=cotton">Cotton Comforts</FooterLink>
              <FooterLink to="/new-arrivals">New Arrivals</FooterLink>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div>
            <h4 className="text-white font-serif text-lg mb-6">Support</h4>
            <ul className="space-y-4 text-sm">
              <FooterLink to="/contact">Contact Us</FooterLink>
              <FooterLink to="/track-order">Track Order</FooterLink>
              <FooterLink to="/shipping">Shipping Policy</FooterLink>
              <FooterLink to="/returns">Returns & Exchanges</FooterLink>
              <FooterLink to="/faq">FAQs</FooterLink>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="text-white font-serif text-lg mb-6">Get in Touch</h4>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-rose-600 mt-0.5 shrink-0" size={18} />
                <span className="text-slate-400">
                  123 Fashion Avenue,<br />Mumbai, Maharashtra 400001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-rose-600 shrink-0" size={18} />
                <span className="text-slate-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-rose-600 shrink-0" size={18} />
                <span className="text-slate-400">support@luxesarees.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-800 text-sm text-slate-500">
          <p>&copy; {year} {appName}. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <ShieldCheck size={16} /> 100% Secure Checkout
            </div>
            {/* Payment Icons Representation */}
            <div className="flex gap-2 opacity-70 grayscale hover:grayscale-0 transition-all">
              <div className="w-8 h-5 bg-white rounded flex items-center justify-center"><span className="text-[8px] font-bold text-blue-800">VISA</span></div>
              <div className="w-8 h-5 bg-white rounded flex items-center justify-center"><span className="text-[8px] font-bold text-red-600">MC</span></div>
              <div className="w-8 h-5 bg-white rounded flex items-center justify-center"><span className="text-[8px] font-bold text-indigo-600">UPI</span></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Sub Components for cleaner code

const FooterLink = ({ to, children }) => (
  <li>
    <Link 
      to={to} 
      className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block"
    >
      {children}
    </Link>
  </li>
)

const SocialIcon = ({ icon }) => (
  <a 
    href="#" 
    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1"
  >
    {icon}
  </a>
)

export default Footer