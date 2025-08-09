'use client'

import { useAuth, useAuthStatus } from '../contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import AuroraBackground from '@/components/AuroraBackground'
import BottomNavigation from '@/components/mobile/BottomNavigation'
import UserDropdown from '@/components/UserDropdown'
import { Zap, Crown, Users, Shield, ArrowRight, Menu, X } from 'lucide-react'

export default function Home() {
  const { user, signOut } = useAuth()
  const { isAuthenticated, isLoading } = useAuthStatus()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/member/dashboard')
      }
    } else {
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">Loading ANOINT Array...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <AuroraBackground variant="home" />
      
      {/* Navigation */}
      <nav className="relative z-20 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold text-white">
                ANOINT Array
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/products" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Products
                </Link>
                <Link href="/anoint-array" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Array Generator
                </Link>
                <Link href="/vip-products" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  VIP Products
                </Link>
                <Link href="/about" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  About
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Contact
                </Link>
              </div>
            </div>

            {/* Auth Section */}
            <div className="hidden md:block">
              {isAuthenticated && user ? (
                <UserDropdown />
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                    Login
                  </Link>
                  <Link href="/login" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-800/95 backdrop-blur-lg border-t border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/products" className="block text-gray-300 hover:text-white px-3 py-2 text-base font-medium">
                Products
              </Link>
              <Link href="/anoint-array" className="block text-gray-300 hover:text-white px-3 py-2 text-base font-medium">
                Array Generator
              </Link>
              <Link href="/vip-products" className="block text-gray-300 hover:text-white px-3 py-2 text-base font-medium">
                VIP Products
              </Link>
              <Link href="/about" className="block text-gray-300 hover:text-white px-3 py-2 text-base font-medium">
                About
              </Link>
              <Link href="/contact" className="block text-gray-300 hover:text-white px-3 py-2 text-base font-medium">
                Contact
              </Link>
              
              {isAuthenticated && user ? (
                <div className="px-3 py-2 border-t border-gray-700 mt-2">
                  <UserDropdown className="w-full" />
                </div>
              ) : (
                <div className="px-3 py-2 border-t border-gray-700 mt-2 space-y-2">
                  <Link href="/login" className="block w-full text-gray-300 hover:text-white px-3 py-2 text-sm transition-colors border border-gray-600 rounded-lg text-center">
                    Login
                  </Link>
                  <Link href="/login" className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-center">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile App Bar (shows when not logged in) */}
      {!isAuthenticated && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 z-30 safe-area-padding-top">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-xl font-bold text-white">ANOINT Array</div>
            <Link
              href="/login"
              className="mobile-btn-primary px-4 py-2 text-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
      
      {/* Hero Section with Enhanced Aurora Background */}
      <section className="relative min-h-screen-dynamic overflow-hidden bg-black text-white flex items-center justify-center pt-16 lg:pt-0 pb-20 lg:pb-0">
        {/* Enhanced Aurora Background Layers */}
        <div className="absolute inset-0">
          {/* Primary aurora gradient */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-0 left-1/2 w-[700px] h-[700px] bg-emerald-500 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>
          
          {/* Secondary aurora waves */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-pink-500 rounded-full mix-blend-screen filter blur-[80px] animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-blue-400 rounded-full mix-blend-screen filter blur-[90px] animate-float" style={{animationDelay: '3s'}}></div>
            <div className="absolute top-1/2 left-1/3 w-[350px] h-[350px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[70px] animate-float" style={{animationDelay: '5s'}}></div>
          </div>
          
          {/* Ancient Symbols */}
          <div className="absolute inset-0">
            {['☥', '⚛', '☯', '🜏', '⚹', '⟐', '✧', '⬟', '◈', '⬢', '△', '◯', '☆', '✦', '⟡', '⬠', '⬡', '◉', '⊙', '☉'].map((symbol, i) => (
              <div
                key={`symbol-${i}`}
                className="absolute text-purple-400/30 animate-float filter drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                style={{
                  fontSize: `${20 + Math.random() * 40}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 1.2}s`,
                  animationDuration: `${20 + i * 3}s`,
                }}
              >
                {symbol}
              </div>
            ))}
          </div>
          
          {/* Numerical Matrix */}
          <div className="absolute inset-0">
            {['111', '222', '333', '444', '555', '666', '777', '888', '999', '1111', '369', '432', '528', '741', '963'].map((num, i) => (
              <div
                key={`num-${i}`}
                className="absolute font-mono text-emerald-300/20 animate-pulse filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                style={{
                  fontSize: `${16 + Math.random() * 20}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  transform: `rotate(${-15 + Math.random() * 30}deg)`
                }}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="relative text-center pt-32 pb-20 z-10 px-6">
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 mb-6">
            ANOINT: Array
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl mx-auto">
            Build Your Own Energy Healing Technology using our Array Generator!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Your Journey'}</span>
              <ArrowRight size={20} />
            </button>
            <Link href="/products">
              <button className="border border-purple-500 text-purple-300 hover:bg-purple-500/10 font-semibold py-4 px-8 rounded-lg transition-all duration-200">
                Explore Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Catalogue Section */}
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif text-center mb-4 text-white">Product Catalogue</h2>
          <p className="text-center text-gray-400 mb-12">Explore our collection of energy healing arrays</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'AetherX Card Decks: Body, Mind, Energy', subtitle: 'Energy Healing Card Decks (Printed & Digital)', price: 'Starting at $24.11 USD', description: 'Transcendental Imbued and Scalar enhanced sacred geometrical cards to detoxify and rejuvenate the body, mind, and energy.' },
              { title: 'ANOINT Manifestation Sphere', subtitle: 'Transcendental Imbuing & Scalar Enhanced 3D Printed Technology', price: '$111.32 USD', description: 'Manifestation Sphere\'s enhanced transcendental and Scalar frequencies designed to help empower manifestation and personal healing.' },
              { title: 'ANOINT Pet Collars', subtitle: 'For Adult Cats to Large Dogs', price: '$12.32 USD', description: 'Transcendental Imbuing & Scalar Enhanced pet collar to charge the cells of your pet encouraging self-healing.' },
              { title: 'Wooden Wall Arrays', subtitle: 'For Personal and Environmental Balancing', price: '$22.31 USD', description: 'Transcendental Imbuing & Scalar Enhanced wooden rejuvenation wall arrays that can be used for personal healing or hung up to balance environmental energies.' },
              { title: 'ANOINT Torus Donut Necklaces', subtitle: 'Transcendental imbued & Scalar Enhanced Crystal', price: '$12.32 USD', description: 'Transcendental Imbuing & Scalar Enhanced torus donut necklace to help balance the cells of the body encouraging self-healing.' },
              { title: 'ANOINT Crystal Bracelets', subtitle: 'Transcendental imbued & Scalar Enhanced Crystal', price: 'Starting at $12.32 USD', description: 'Transcendental Imbuing & Scalar Enhanced crystal bracelets to help balance cells of the body encouraging self-healing.' }
            ].map((product, i) => (
              <div key={i} className="bg-gray-800 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <div className="h-48 bg-gradient-to-br from-purple-800 to-cyan-800"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{product.title}</h3>
                  <p className="text-purple-400 text-sm mb-2">{product.subtitle}</p>
                  <p className="text-gray-400 text-sm mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-cyan-400">{product.price}</span>
                    <Link href="/products">
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-black relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif text-center mb-12 text-white">Features of ANOINT Array Technology</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🎨', title: 'Custom Designs', description: 'Create unique healing arrays tailored to your specific needs' },
              { icon: '⚡', title: 'Instant Activation', description: 'Arrays begin working immediately upon creation' },
              { icon: '🔢', title: 'Sacred Mathematics', description: 'Based on ancient numerical principles and modern quantum physics' },
              { icon: '⬟', title: 'Sacred Geometry', description: 'Incorporates powerful geometric patterns for maximum effect' },
              { icon: '🌟', title: 'High Frequency', description: 'Operates at optimal vibrational frequencies for healing' },
              { icon: '♾️', title: 'Infinite Possibilities', description: 'Unlimited combinations for every healing intention' }
            ].map((feature, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-8 text-center hover:bg-gray-800 transition-colors">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif text-center mb-4 text-white">How It Works</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Our Array Generator uses advanced algorithms combined with ancient wisdom to create powerful healing technologies
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Set Your Intention', description: 'Choose your healing focus and energy requirements' },
              { step: '2', title: 'Generate Your Array', description: 'Our AI creates a custom array based on your specifications' },
              { step: '3', title: 'Activate & Heal', description: 'Download and use your personalized healing technology' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Products Section */}
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-black relative overflow-hidden z-10">
        {/* VIP Aurora background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-400 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-green-500 rounded-full mix-blend-screen filter blur-[150px] animate-float" style={{animationDelay: '4s'}}></div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="relative bg-gradient-to-br from-purple-900/50 to-emerald-900/50 rounded-lg p-12 border border-emerald-500/50 backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <div className="relative z-10 text-center">
              <h2 className="text-4xl font-serif mb-4 text-white">VIP Scalar Technology</h2>
              <h3 className="text-2xl text-purple-400 mb-6">Exclusive Bio-Scalar Technology</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
                Experience cutting-edge healing technology not available anywhere else. Our VIP collection features custom-made bio-scalar devices personally crafted by Brad Johnson, founder of ANOINT. These high-quality, industrial-grade wearable scalar technology devices represent the pinnacle of energy healing innovation.
              </p>
              <Link href="/vip-products">
                <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Explore VIP Products
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif text-center mb-12 text-white">Testimonials</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah J.', text: 'The Array Generator changed my life! I feel more balanced and energized than ever.', rating: 5 },
              { name: 'Michael C.', text: 'Incredible technology. The custom arrays work exactly as described. Highly recommend!', rating: 5 },
              { name: 'Jennifer M.', text: 'I was skeptical at first, but the results speak for themselves. Amazing healing tool!', rating: 5 }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <span key={j} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <p className="text-purple-400 font-bold">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-12 px-6 md:px-16 lg:px-32 border-t border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">ANOINT: Array</h3>
              <p className="text-sm">Energy healing technology for the modern age</p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-purple-400 transition-colors">Home</Link></li>
                <li><Link href="/products" className="hover:text-purple-400 transition-colors">Products</Link></li>
                <li><Link href="/anoint-array" className="hover:text-purple-400 transition-colors">Array Generator</Link></li>
                <li><Link href="/about" className="hover:text-purple-400 transition-colors">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="hover:text-purple-400 transition-colors">Contact</Link></li>
                <li><Link href="/products" className="hover:text-purple-400 transition-colors">Products</Link></li>
                <li><Link href="/anoint-array" className="hover:text-purple-400 transition-colors">Array Generator</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-purple-400 transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/disclaimer" className="hover:text-purple-400 transition-colors">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-sm">&copy; 2025 ANOINT: Array. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation for non-authenticated users */}
      {!isAuthenticated && <BottomNavigation />}
    </div>
  )
}