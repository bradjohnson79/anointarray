import { useState, useRef, useEffect } from 'react';
import { Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { isAuthenticated, user, profile, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserDropdownOpen(false);
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserAvatar = () => {
    if (profile?.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt="User Avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
        {getUserInitials()}
      </div>
    );
  };

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
          
          {/* User Authentication */}
          {isAuthenticated ? (
            <div className="relative ml-4" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-full bg-purple-700 hover:bg-purple-600 transition-colors"
              >
                {getUserAvatar()}
                <ChevronDown size={16} className={`transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile?.role || 'User'}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <User size={16} className="mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings size={16} className="mr-2" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <button className="ml-4 px-4 py-1 border border-white rounded hover:bg-white hover:text-black transition">
                Login / Sign Up
              </button>
            </Link>
          )}
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
          {/* Mobile User Authentication */}
          {isAuthenticated ? (
            <div className="border-t border-white/20 pt-4 mt-4">
              <div className="flex items-center space-x-3 mb-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {getUserInitials()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-white/70 capitalize">{profile?.role || 'User'}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                className="block py-2 border-b border-white/20"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="block py-2 border-b border-white/20"
                onClick={() => setMenuOpen(false)}
              >
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  setMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-red-300 hover:text-red-200"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/auth" className="block">
              <button className="mt-2 w-full py-2 border border-white rounded hover:bg-white hover:text-black transition">
                Login / Sign Up
              </button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}