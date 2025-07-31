import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { Mail, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
)

const VipProducts = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [honeypot, setHoneypot] = useState('') // Spam protection

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('') // Clear error when user starts typing
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Honeypot check - if filled, it's likely a bot
    if (honeypot) {
      console.log('Honeypot triggered - likely spam')
      return
    }

    if (!formData.name.trim()) {
      setError('Please enter your full name')
      return
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .rpc('check_vip_email_exists', { check_email: formData.email })

      if (checkError) {
        throw new Error('Failed to verify email')
      }

      if (existingUser) {
        setError('This email is already registered for VIP access')
        setLoading(false)
        return
      }

      // Insert new VIP waitlist signup
      const { error: insertError } = await supabase
        .from('vip_waitlist')
        .insert({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          ip_address: '', // Could be populated via IP detection service
          user_agent: navigator.userAgent,
          referrer: document.referrer
        })

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          setError('This email is already registered for VIP access')
        } else {
          throw insertError
        }
        return
      }

      // Optional: Send confirmation email via Edge Function
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/send-vip-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email
          })
        })
      } catch (emailError) {
        console.log('Email confirmation failed (non-critical):', emailError)
        // Don't show error to user - signup was successful
      }

      setSuccess(true)
      setFormData({ name: '', email: '' })

    } catch (err: any) {
      console.error('VIP signup error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout auroraVariant="intense">
      <div className="min-h-screen bg-black pt-20">
        {/* Hero Section */}
        <div className="relative">
          {/* Aurora background animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="aurora-bg opacity-20">
              <div className="aurora-line aurora-line-1"></div>
              <div className="aurora-line aurora-line-2"></div>
              <div className="aurora-line aurora-line-3"></div>
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  VIP Products
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Exclusive early access to next-generation scalar energy wearables
              </p>
            </div>

            {/* Main Content - 2 Cell Layout */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              
              {/* Left Cell - Image */}
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <img 
                    src="/images/bio-scalar-vest-development.png" 
                    alt="Bio-Scalar Vest"
                    className="w-full rounded-lg shadow-lg"
                  />
                  
                  {/* Development badge */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-600/80 text-white border border-purple-400/50">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                      In Development
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Cell - Content & Form */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Aurora gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-cyan-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                  
                  <div className="relative bg-black/40 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-8 lg:p-10">
                    
                    {/* Product Title */}
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                      ANOINT Bio-Scalar Vest
                    </h2>

                    {/* Content Paragraphs */}
                    <div className="space-y-6 text-gray-200 leading-relaxed">
                      <p>
                        The ANOINT Bio-Scalar Vest is a wearable energy technology in active development, designed to deliver targeted scalar field modulation through embedded copper coils and piezoelectric arrays. It gently pulses scalar frequencies into the body's biofield to support cellular repair, nervous system balance, and subtle energy alignment—without emitting harmful EMF. Crafted with breathable, lightweight materials and discreetly embedded components, it offers a fusion of science and spiritual innovation.
                      </p>

                      <p>
                        This vest is not just a health wearable—it's a next-gen energetic support system, aligned with the latest research in quantum wellness, frequency medicine, and scalar energy application. Early prototype testing has shown promising signs of reduced tension, improved circulation, and enhanced meditative focus in users. Whether you're navigating chronic discomfort, energetic stagnation, or simply looking to upgrade your inner calibration, this vest was created for pioneers like you.
                      </p>

                      <p className="text-cyan-300 font-medium">
                        Want early access and updates? Join our VIP waiting list below to receive exclusive behind-the-scenes progress, beta testing invitations, and a first look at the official release. Just leave your full name and email and we'll keep you in the loop.
                      </p>
                    </div>

                    {/* VIP Signup Form */}
                    <div className="mt-8">
                      {success ? (
                        <div className="text-center py-8">
                          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold text-green-400 mb-2">Welcome to VIP Access!</h3>
                          <p className="text-gray-300">
                            Thank you for joining our exclusive waitlist. You'll receive updates on development progress and early access opportunities.
                          </p>
                          <button 
                            onClick={() => setSuccess(false)}
                            className="mt-4 text-purple-400 hover:text-purple-300 underline"
                          >
                            Sign up another email
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <h3 className="text-xl font-semibold text-white mb-4">Join VIP Waitlist</h3>
                          
                          {/* Honeypot field - hidden from users */}
                          <input
                            type="text"
                            name="website"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                            className="hidden"
                            tabIndex={-1}
                            autoComplete="off"
                          />

                          {/* Name Field */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Full Name *
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                              <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition-all duration-200"
                                placeholder="Enter your full name"
                                disabled={loading}
                              />
                            </div>
                          </div>

                          {/* Email Field */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Email Address *
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition-all duration-200"
                                placeholder="Enter your email address"
                                disabled={loading}
                              />
                            </div>
                          </div>

                          {/* Error Message */}
                          {error && (
                            <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                              <AlertCircle className="w-5 h-5 flex-shrink-0" />
                              <span className="text-sm">{error}</span>
                            </div>
                          )}

                          {/* Submit Button */}
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Joining VIP List...
                              </>
                            ) : (
                              'Join VIP Waitlist'
                            )}
                          </button>

                          {/* Privacy Note */}
                          <p className="text-xs text-gray-400 text-center">
                            We respect your privacy. Your information will only be used for VIP updates and early access notifications. No spam, ever.
                          </p>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Features Section */}
            <div className="mt-20 grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Exclusive Updates</h3>
                <p className="text-gray-400">Get behind-the-scenes development progress and technical insights</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full animate-pulse animation-delay-200"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Beta Testing Access</h3>
                <p className="text-gray-400">Opportunity to test prototypes and provide feedback</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse animation-delay-400"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">First Access</h3>
                <p className="text-gray-400">Be among the first to purchase when officially released</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aurora Animation Styles */}
      <style>{`
        .aurora-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }
        
        .aurora-line {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent);
          animation: aurora-move 8s linear infinite;
        }
        
        .aurora-line-1 {
          top: 20%;
          width: 100%;
          animation-delay: 0s;
        }
        
        .aurora-line-2 {
          top: 50%;
          width: 80%;
          left: 10%;
          animation-delay: 2s;
          background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), transparent);
        }
        
        .aurora-line-3 {
          top: 80%;
          width: 60%;
          left: 20%;
          animation-delay: 4s;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent);
        }
        
        @keyframes aurora-move {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </Layout>
  )
}

export default VipProducts