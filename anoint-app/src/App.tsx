import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Home from './pages/Home';
import Auth from './pages/Auth';

// Lazy load components for better performance
const About = lazy(() => import('./pages/public/About'));
const Products = lazy(() => import('./pages/public/Products'));
const Cart = lazy(() => import('./pages/public/Cart'));
const Contact = lazy(() => import('./pages/public/Contact'));
const AnointArray = lazy(() => import('./pages/public/AnointArray'));
const VipProducts = lazy(() => import('./pages/public/VipProducts'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/public/TermsConditions'));
const Disclaimer = lazy(() => import('./pages/public/Disclaimer'));
const EnvTest = lazy(() => import('./pages/public/EnvTest'));
const TestUserCreation = lazy(() => import('./pages/public/TestUserCreation'));
const Dashboard = lazy(() => import('./pages/private/Dashboard'));
const Profile = lazy(() => import('./pages/private/Profile'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminShipping = lazy(() => import('./pages/admin/Shipping'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminMarketing = lazy(() => import('./pages/admin/Marketing'));
const AdminVipSubscribers = lazy(() => import('./pages/admin/VipSubscribers'));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
      <p className="text-purple-400 text-lg">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/anoint-array" element={<AnointArray />} />
            <Route path="/vip-products" element={<VipProducts />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/env-test" element={<EnvTest />} />
            <Route path="/test-user-creation" element={<TestUserCreation />} />
            
            {/* Private Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/shipping" element={<AdminShipping />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/marketing" element={<AdminMarketing />} />
            <Route path="/admin/vip-subscribers" element={<AdminVipSubscribers />} />
            </Routes>
          </Suspense>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;