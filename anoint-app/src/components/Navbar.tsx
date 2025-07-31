import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Products', path: '/products' },
  { name: 'Array Generator', path: '/anoint-array' },
  { name: 'VIP Products', path: '/vip-products' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full z-50 bg-gradient-to-r from-purple-800/90 to-blue-900/90 text-white font-serif shadow-md px-6 py-4 fixed top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          {/* Desktop logo */}
          <img
            src="/images/logo-desktop.png"
            alt="ANOINT Logo"
            className="hidden md:block h-10 w-auto"
          />
          {/* Mobile logo */}
          <img
            src="/images/logo-mobile.png"
            alt="ANOINT Logo"
            className="block md:hidden h-8 w-auto"
          />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            link.path === '#' ? (
              <a
                key={link.name}
                href="#"
                className="hover:text-emerald-300 transition duration-150"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                className="hover:text-emerald-300 transition duration-150"
              >
                {link.name}
              </Link>
            )
          ))}
          <Link to="/auth">
            <button className="ml-4 px-4 py-1 border border-white rounded hover:bg-white hover:text-black transition">
              Login / Sign Up
            </button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col space-y-4 px-4">
          {navLinks.map((link) => (
            link.path === '#' ? (
              <a
                key={link.name}
                href="#"
                className="block py-2 border-b border-white/20"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                className="block py-2 border-b border-white/20"
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            )
          ))}
          <Link to="/auth" className="block">
            <button className="mt-2 w-full py-2 border border-white rounded hover:bg-white hover:text-black transition">
              Login / Sign Up
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}