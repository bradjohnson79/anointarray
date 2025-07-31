import { Link } from 'react-router-dom'
import Layout from '../../components/layout/Layout'

const AnointArray = () => {
  return (
    <Layout auroraVariant="intense">
      <section className="min-h-screen bg-gray-900 text-white py-20 px-6 md:px-16 lg:px-32">
        <div className="max-w-6xl mx-auto">
          {/* Main Heading with fade-in animation */}
          <h1 className="text-5xl font-serif mb-8 text-center animate-fadeIn">ANOINT Array Generator</h1>
          
          {/* Subtitle */}
          <div className="mb-16 animate-fadeIn animation-delay-200">
            <p className="text-xl text-gray-300 leading-relaxed text-center max-w-4xl mx-auto">
              Custom metaphysical seal creation system for personalized healing arrays.
            </p>
          </div>
          
          {/* Two-Cell Responsive Card Section */}
          <div className="mb-16 animate-fadeIn animation-delay-400">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              
              {/* Left Cell - Image */}
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <img 
                    src="/images/anoint-array-seal.png" 
                    alt="ANOINT Array Generator Seal Example"
                    className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
                  />
                </div>
              </div>

              {/* Right Cell - Content */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Aurora gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-cyan-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                  
                  <div className="relative bg-black/40 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-8 lg:p-10">
                    
                    {/* Content Paragraphs */}
                    <div className="space-y-6 text-white leading-relaxed mb-8">
                      <p className="text-lg">
                        The ANOINT Array Generator is a cutting-edge metaphysical tool that synthesizes ancient wisdom systems into powerful circular seals. Each seal integrates personalized numerology, astrological glyphs, color resonance, and sacred geometry patterns like the Flower of Life to create a unique energetic imprint. This imprint can be used for meditation, healing, energy focusing, and intention amplification.
                      </p>

                      <p className="text-lg">
                        Using the generator, users input their personal birth data and intention. The system then calculates core energetic alignments and converts them into a visual metaphysical array. The first ring displays numerological values inside radiant circular color bands. The second ring layers the astrology glyphs derived from the user's planetary positions. Around all this, a circular Sanskrit mantra reinforces the seal's resonance. The generator makes these deeply personal, and visually striking.
                      </p>
                    </div>

                    {/* Call to Action Button */}
                    <div className="text-center">
                      <Link to="/signup">
                        <button className="group relative bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl border border-purple-400/50 hover:border-cyan-400/50">
                          {/* Glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-cyan-600/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Button content */}
                          <span className="relative flex items-center justify-center space-x-2">
                            <span>Free Member Sign-Up</span>
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                            </svg>
                          </span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Features Section */}
          <div className="mb-16 animate-fadeIn animation-delay-600">
            <h2 className="text-3xl font-serif mb-8 text-center text-white">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Personal Data Input</h3>
                <p className="text-gray-400">Enter your birth details and personal intentions to create your unique energetic signature</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Energetic Calculation</h3>
                <p className="text-gray-400">Advanced algorithms synthesize numerology, astrology, and sacred geometry patterns</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-purple-500 rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Seal Generation</h3>
                <p className="text-gray-400">Receive your personalized metaphysical array for meditation and healing practices</p>
              </div>
            </div>
          </div>
          
          {/* Call to Action */}
          <div className="text-center animate-fadeIn animation-delay-800">
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
      <style jsx>{`
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

export default AnointArray