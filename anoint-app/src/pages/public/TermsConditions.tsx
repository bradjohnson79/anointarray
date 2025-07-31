
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const TermsConditions = () => {
  return (
    <>
      <Navbar />
      
      <section className="min-h-screen bg-gray-900 text-white py-20 px-6 md:px-16 lg:px-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-serif mb-8 text-center">Terms & Conditions</h1>
          <p className="text-gray-400 text-center mb-12">Effective Date: January 30, 2025</p>
          
          <div className="space-y-8 text-gray-300">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using ANOINT Array's website and services, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Use of Services</h2>
              <p className="mb-4">You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Use our services in any way that violates applicable laws or regulations</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use of the services</li>
                <li>Attempt to gain unauthorized access to any portion of the services</li>
                <li>Use the services to transmit any harmful or malicious code</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Intellectual Property</h2>
              <p>
                All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of ANOINT Array or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Product Purchases</h2>
              <p className="mb-4">When purchasing products through our website:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>You warrant that you are legally capable of entering into binding contracts</li>
                <li>All information you provide must be accurate and complete</li>
                <li>Prices are subject to change without notice</li>
                <li>We reserve the right to refuse or cancel any order</li>
                <li>Title and risk of loss pass to you upon delivery</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Returns and Refunds</h2>
              <p>
                Our return and refund policy is outlined separately. Please review our Return Policy for detailed information about returning products and obtaining refunds.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, ANOINT Array shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless ANOINT Array, its affiliates, and their respective officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of our services or violation of these Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on this page. Your continued use of our services after such modifications constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact Information</h2>
              <p>
                For questions about these Terms & Conditions, please contact us at:
              </p>
              <p className="mt-4">
                Email: legal@anointarray.com<br />
                Address: [Your Business Address]
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <Link to="/" className="text-purple-400 hover:text-purple-300 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default TermsConditions