import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import Layout from './components/layout/Layout'

// Public pages
import Home from './pages/public/Home'
import About from './pages/public/About'
import Blog from './pages/public/Blog'
import Products from './pages/public/Products'
import Affiliate from './pages/public/Affiliate'
import Login from './pages/public/Login'
import Signup from './pages/public/Signup'

// Private pages
import Dashboard from './pages/private/Dashboard'
import ArrayGenerator from './pages/private/ArrayGenerator'
import MySeals from './pages/private/MySeals'
import Profile from './pages/private/Profile'

// Admin pages
import AdminUsers from './pages/admin/Users'
import AdminProducts from './pages/admin/Products'
import AdminUpdates from './pages/admin/Updates'
import AdminAnalytics from './pages/admin/Analytics'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="blog" element={<Blog />} />
              <Route path="products" element={<Products />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />

              {/* Protected routes */}
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="array-generator" element={
                <ProtectedRoute>
                  <ArrayGenerator />
                </ProtectedRoute>
              } />
              <Route path="my-seals" element={
                <ProtectedRoute>
                  <MySeals />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="admin/users" element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="admin/products" element={
                <ProtectedRoute requireAdmin>
                  <AdminProducts />
                </ProtectedRoute>
              } />
              <Route path="admin/updates" element={
                <ProtectedRoute requireAdmin>
                  <AdminUpdates />
                </ProtectedRoute>
              } />
              <Route path="admin/analytics" element={
                <ProtectedRoute requireAdmin>
                  <AdminAnalytics />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App