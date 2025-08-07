'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail,
  Send,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useState } from 'react'

export default function MemberSupport() {
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // In production, this would call your API endpoint to send email
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'info@anoint.me',
          subject: formData.subject,
          message: formData.message,
          from: 'member' // This would include user info from auth context
        })
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      setSubmitStatus('success')
      setFormData({ subject: '', message: '' })
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000)
    } catch (error) {
      console.error('Error sending message:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <ProtectedRoute requiredRole="member">
      <Layout userRole="member">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Support Center</h1>
            <p className="text-gray-400">Send us your feedback or report any issues</p>
          </div>

          {/* Contact Form */}
          <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare size={20} />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Brief description of your issue or feedback"
                    className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-500/50 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={8}
                    placeholder="Please provide detailed information about your issue or feedback..."
                    className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-500/50 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Status Alerts */}
                {submitStatus === 'success' && (
                  <Alert className="bg-green-900/60 backdrop-blur-lg border-green-700/50 text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your message has been sent successfully! We'll respond within 24 hours.
                    </AlertDescription>
                  </Alert>
                )}

                {submitStatus === 'error' && (
                  <Alert className="bg-red-900/60 backdrop-blur-lg border-red-700/50 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to send message. Please try again or email us directly at info@anoint.me
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>

              {/* Contact Info */}
              <div className="mt-8 pt-8 border-t border-gray-700/50">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail size={20} className="text-purple-400" />
                  <div>
                    <p className="text-sm">Email us directly at:</p>
                    <a href="mailto:info@anoint.me" className="text-white font-medium hover:text-purple-300 transition-colors">
                      info@anoint.me
                    </a>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-400">
                  We typically respond within 24 hours during business days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}