import React from 'react'
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react'

const Footer = ({ appName = "Saree Store" }) => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-950 py-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Flex Container: Stacks on mobile, Row on desktop */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6">
          
          {/* LEFT SIDE: Social Icons */}
          <div className="flex items-center gap-3">
            <SocialIcon icon={<Instagram size={18} />} href="https://www.instagram.com/shri_sai_collections_?igsh=MXBhNjN1ZjVkbzg1YQ%3D%3D&utm_source=qr" label="Instagram" />
            <SocialIcon icon={<Linkedin size={18} />} href="https://linkedin.com" label="LinkedIn" />
          </div>

          {/* RIGHT SIDE: Copyright & Company Name */}
          <div className="text-center md:text-right">
            <p className="text-sm font-medium text-slate-400">
              &copy; {year} {appName}. All rights reserved.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Crafted with <span className="text-rose-600 animate-pulse">❤️</span> for saree lovers.
            </p>
          </div>

        </div>
      </div>
    </footer>
  )
}

// --- Helper Component: Premium Social Icon ---
const SocialIcon = ({ icon, href, label }) => (
  <a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-900 text-slate-400 border border-slate-800 transition-all duration-300 hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-rose-900/30"
  >
    {icon}
  </a>
)

export default Footer