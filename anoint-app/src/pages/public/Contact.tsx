import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Layout from '../../components/layout/Layout'

interface ContactFormData {
  fullName: string
  email: string
  subject: string
  message: string
}

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error'
  message: string
}

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  })
  
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<FormStatus>({ type: 'idle', message: '' })

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setStatus({ type: 'error', message: 'Full name is required' })
      return false
    }
    
    if (!formData.email.trim()) {
      setStatus({ type: 'error', message: 'Email address is required' })
      return false
    }
    
    if (!validateEmail(formData.email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address' })
      return false
    }
    
    if (!formData.message.trim()) {
      setStatus({ type: 'error', message: 'Message is required' })
      return false
    }
    
    if (formData.message.trim().length < 10) {
      setStatus({ type: 'error', message: 'Message must be at least 10 characters long' })
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Honeypot check - if filled, it's likely a bot
    if (honeypot) {
      console.log('Honeypot triggered - likely spam')
      return
    }
    
    if (!validateForm()) {
      return
    }
    
    setStatus({ type: 'loading', message: 'Sending your message...' })
    
    try {
      // Create Supabase client to call Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-contact-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          subject: formData.subject || 'Contact Form Submission',
          message: formData.message,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setStatus({ 
          type: 'success', 
          message: 'Thank you! Your message has been sent successfully. We\'ll get back to you soon!' 
        })
        
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          subject: '',
          message: ''
        })
      } else {
        throw new Error(result.error || 'Failed to send message')
      }
      
    } catch (error) {
      console.error('Contact form error:', error)
      setStatus({ 
        type: 'error', 
        message: 'Sorry, there was an error sending your message. Please try again or contact us directly at info@anoint.me' 
      })
    }
  }

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error status when user starts typing
    if (status.type === 'error') {
      setStatus({ type: 'idle', message: '' })
    }
  }

  return (
    <Layout auroraVariant="default">
      <section className="min-h-screen bg-gray-900 text-white py-20 px-6 md:px-16 lg:px-32">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading with fade-in animation */}
          <h1 className="text-5xl font-serif mb-12 text-center animate-fadeIn">Get in Touch with the ANOINT Team</h1>
          
          {/* Introduction Section */}
          <div className="mb-16 animate-fadeIn animation-delay-200">
            <p className="text-lg text-gray-300 leading-relaxed mb-8 text-center">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
          
          {/* Contact Form Section */}
          <div className="mb-16 animate-fadeIn animation-delay-400">
            <h2 className="text-3xl font-serif mb-8 text-center text-white">ANOINT Array Contact Form</h2>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-lg p-8 border border-purple-500/30 backdrop-blur-sm mb-8">
              {/* Status Messages */}
              {status.type !== 'idle' && (
                <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
                  status.type === 'success' 
                    ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                    : status.type === 'error'
                    ? 'bg-red-900/30 border border-red-500/30 text-red-300'
                    : 'bg-blue-900/30 border border-blue-500/30 text-blue-300'
                }`}>
                  {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
                  {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
                  {status.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                  <p>{status.message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Honeypot field - hidden from users */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="What's this about? (optional)"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-vertical"
                    placeholder="Tell us what's on your mind..."
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Minimum 10 characters. {formData.message.length}/500
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status.type === 'loading'}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {status.type === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>

              {/* Alternative Contact Info */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-center text-gray-400 text-sm">
                  You can also reach us directly at{' '}
                  <a 
                    href="mailto:info@anoint.me" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                  >
                    info@anoint.me
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          {/* Call to Action */}
          <div className="text-center animate-fadeIn animation-delay-600">
            <Link to="/auth">
              <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Begin Your Journey
              </button>
            </Link>
          </div>
          
          {/* Back to Home Link */}
          <div className="mt-16 pt-8 border-t border-gray-700">
            <Link to="/" className="text-purple-400 hover:text-purple-300 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
      
      {/* Add CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
        
        .animation-delay-800 {
          animation-delay: 0.8s;
          opacity: 0;
        }
      `}</style>
    </Layout>
  )
}

export default Contact