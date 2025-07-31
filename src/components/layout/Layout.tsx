import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Layout() {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  ANOINT
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Home
                </Link>
                <Link to="/about" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  About
                </Link>
                <Link to="/blog" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Blog
                </Link>
                <Link to="/products" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Products
                </Link>
                <Link to="/affiliate" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Affiliate
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link to="/array-generator" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                    Generator
                  </Link>
                  <Link to="/my-seals" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                    My Seals
                  </Link>
                  {isAdmin && (
                    <div className="relative group">
                      <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                        Admin
                      </button>
                      <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <div className="py-1">
                          <Link to="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Users
                          </Link>
                          <Link to="/admin/products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Products
                          </Link>
                          <Link to="/admin/updates" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Updates
                          </Link>
                          <Link to="/admin/analytics" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Analytics
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                  <Link to="/profile" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  )
}