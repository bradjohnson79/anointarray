'use client'

import Link from 'next/link'
import AuroraBackground from '@/components/AuroraBackground'
import { ArrowLeft } from 'lucide-react'

export default function About() {
  return (
    <div className="relative">
      <AuroraBackground variant="subtle" />
      
      <section className="min-h-screen bg-gray-900 text-white py-20 px-6 md:px-16 lg:px-32 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading with fade-in animation */}
          <h1 className="text-5xl font-serif mb-12 text-center animate-fadeIn">About ANOINT: Array</h1>
          
          {/* Introduction Section */}
          <div className="mb-16 animate-fadeIn animation-delay-200">
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              <span className="text-purple-400 font-semibold">ANOINT: Array</span> is a pioneering force in the evolution of Scalar energy and intentional healing technologies.
            </p>
            
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              At the heart of our work lies <span className="text-cyan-400 font-semibold">authentic Transcendental infusion</span>—the art of imbuing each product with conscious intent and energetically charged patterns that align with your highest well-being. This isn&apos;t new-age gimmickry—it&apos;s <span className="text-emerald-400 font-semibold">ancient science revitalized</span> through focused intent and paired with modern Scalar enhancement.
            </p>
            
            <p className="text-lg text-gray-300 leading-relaxed">
              Our technology bridges the unseen and the physical, merging <span className="text-purple-400 font-semibold">quantum-level frequency calibration</span> with sacred geometrical architecture. Every piece in the ANOINT collection is not only Scalar-enhanced, but purpose-driven: from wearables that support biofield balance, to tools that elevate the energy of your home, environment, and daily life.
            </p>
          </div>
          
          {/* VIP Scalar Technology Section */}
          <div className="mb-16 animate-fadeIn animation-delay-400">
            <h2 className="text-3xl font-serif mb-8 text-center text-white">The Future: VIP Scalar Technology</h2>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-lg p-8 border border-purple-500/30 backdrop-blur-sm mb-8">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                We are currently developing our <span className="text-purple-400 font-semibold">VIP line of Scalar products</span>—a new frontier in energy healing. These upcoming innovations are forged from industrial-grade materials, amplified through advanced Scalar arrays, and infused with precise Transcendental codes to create the most potent rejuvenation tools ever crafted.
              </p>
              
              <p className="text-xl font-semibold text-cyan-400 mb-4">This elite series includes:</p>
              
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-3">•</span>
                  <span>Wearable Scalar devices for deep cellular alignment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-3">•</span>
                  <span>Environmental energy harmonizers for homes and sacred spaces</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-3">•</span>
                  <span>Arrays designed to interact with the user&apos;s intention field and subconscious mind</span>
                </li>
              </ul>
              
              <p className="text-lg text-gray-300 leading-relaxed mt-6">
                Each VIP product is the result of <span className="text-purple-400 font-semibold">meticulous design</span>, field-tested energetics, and a commitment to authenticity.
              </p>
            </div>
          </div>
          
          {/* Our Mission Section */}
          <div className="mb-16 animate-fadeIn animation-delay-600">
            <h2 className="text-3xl font-serif mb-8 text-center text-white">Our Mission</h2>
            
            <div className="bg-gradient-to-br from-emerald-900/30 to-purple-900/30 rounded-lg p-8 border border-emerald-500/30 backdrop-blur-sm text-center">
              <p className="text-xl text-gray-300 leading-relaxed">
                To awaken a new era of <span className="text-emerald-400 font-semibold">personal empowerment</span> through frequency, combining <span className="text-purple-400 font-semibold">sacred intention</span>, <span className="text-cyan-400 font-semibold">Scalar science</span>, and <span className="text-emerald-400 font-semibold">ancient wisdom</span>. Whether you&apos;re seeking transformation, restoration, or elevation, ANOINT: Array exists to bring alignment to every layer of your being.
              </p>
            </div>
          </div>
          
          {/* Call to Action */}
          <div className="text-center animate-fadeIn animation-delay-800">
            <Link href="/login">
              <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Begin Your Journey
              </button>
            </Link>
          </div>
          
          {/* Back to Home Link */}
          <div className="mt-16 pt-8 border-t border-gray-700">
            <Link href="/" className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
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
    </div>
  )
}