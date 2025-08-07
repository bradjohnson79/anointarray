'use client'

import Link from 'next/link'
import AuroraBackground from '@/components/AuroraBackground'
import { ArrowLeft } from 'lucide-react'

export default function Disclaimer() {
  return (
    <div className="relative">
      <AuroraBackground variant="subtle" />
      
      <section className="min-h-screen bg-gray-900 text-white py-20 px-6 md:px-16 lg:px-32 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-serif mb-8 text-center">Disclaimer</h1>
          <p className="text-gray-400 text-center mb-12">Last Updated: January 30, 2025</p>
          
          <div className="space-y-8 text-gray-300">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. General Information</h2>
              <p>
                The information provided by ANOINT Array on this website is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Not Medical Advice</h2>
              <p className="mb-4">
                <strong className="text-white">IMPORTANT:</strong> The products and information provided by ANOINT Array are not intended to diagnose, treat, cure, or prevent any disease or medical condition. Our products are intended for experimental, educational, and entertainment purposes only.
              </p>
              <p>
                Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this website or in connection with our products.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Energy Healing Disclaimer</h2>
              <p>
                Our scalar technology and energy healing products are based on experimental concepts and alternative healing modalities. Results may vary from person to person. These products should not be used as a substitute for professional medical care.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. External Links Disclaimer</h2>
              <p>
                This website may contain links to external websites that are not provided or maintained by ANOINT Array. We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Testimonials Disclaimer</h2>
              <p>
                Any testimonials or reviews on this website are the personal experiences of individual users. These results are not typical, and individual results may vary. Testimonials are not intended to make claims that these products can be used to diagnose, treat, cure, mitigate, or prevent any disease.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Fair Use Disclaimer</h2>
              <p>
                This site may contain copyrighted material the use of which has not always been specifically authorized by the copyright owner. We believe this constitutes a 'fair use' of any such copyrighted material as provided for in section 107 of the US Copyright Law.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. No Guarantees</h2>
              <p>
                We make no guarantees, representations, or warranties of any kind, whether expressed or implied, with respect to the products offered on this website, including but not limited to their quality, performance, or compatibility with your specific needs.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <p>
                In no event shall ANOINT Array, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the website or products.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">9. Personal Responsibility</h2>
              <p>
                By using our products and services, you acknowledge that you are doing so at your own risk and that you are solely responsible for any consequences that may arise from such use.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact Information</h2>
              <p>
                If you have any questions about this Disclaimer, please contact us at:
              </p>
              <p className="mt-4">
                Email: info@anointarray.com<br />
                Address: [Your Business Address]
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <Link href="/" className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}