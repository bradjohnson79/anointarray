
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-black text-gray-400 py-12 px-6 md:px-16 lg:px-32 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold mb-4">ANOINT: Array</h3>
            <p className="text-sm">Energy healing technology for the modern age</p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-purple-400 transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-purple-400 transition-colors">Products</Link></li>
              <li><Link to="/array-generator" className="hover:text-purple-400 transition-colors">Array Generator</Link></li>
              <li><Link to="/about" className="hover:text-purple-400 transition-colors">About</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="hover:text-purple-400 transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-purple-400 transition-colors">FAQ</Link></li>
              <li><Link to="/guides" className="hover:text-purple-400 transition-colors">Guides</Link></li>
              <li><Link to="/testimonials" className="hover:text-purple-400 transition-colors">Testimonials</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-purple-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/disclaimer" className="hover:text-purple-400 transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-sm">&copy; 2025 ANOINT: Array. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer