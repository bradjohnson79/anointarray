
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AuroraBackground from '../components/AuroraBackground'

const Home = () => {
  return (
    <div className="relative">
      <AuroraBackground variant="home" />
      <Navbar />
      
      {/* Hero Section with Aurora Background */}
      <section className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center">
        {/* Multiple Aurora Background Layers */}
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
          
          {/* Tertiary glowing orbs */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div
                key={`orb-${i}`}
                className="absolute rounded-full mix-blend-screen filter blur-[60px] animate-float"
                style={{
                  width: `${200 + Math.random() * 200}px`,
                  height: `${200 + Math.random() * 200}px`,
                  background: `radial-gradient(circle, ${['#9333ea', '#06b6d4', '#10b981', '#ec4899', '#6366f1'][Math.floor(Math.random() * 5)]}, transparent)`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 1.5}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>
          
          {/* Ancient Symbols - More variety and density */}
          <div className="absolute inset-0">
            {['☥', '⚛', '☯', '🜏', '⚹', '⟐', '✧', '⬟', '◈', '⬢', '△', '◯', '☆', '✦', '⟡', '⬠', '⬡', '◉', '⊙', '☉'].map((symbol, i) => {
              const animations = ['animate-drift', 'animate-drift-reverse', 'animate-float', 'animate-zigzag', 'animate-spiral'];
              const randomAnim = animations[Math.floor(Math.random() * animations.length)];
              return (
                <div
                  key={`symbol-${i}`}
                  className={`absolute text-purple-400/30 ${randomAnim} filter drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]`}
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
              );
            })}
          </div>
          
          {/* Mystical Glyphs Layer */}
          <div className="absolute inset-0">
            {['⧈', '⧉', '⧊', '⧋', '⟠', '⟡', '⬢', '⬣', '⬤', '⬥', '⬦', '⬧', '⬨', '⬩'].map((glyph, i) => (
              <div
                key={`glyph-${i}`}
                className={`absolute text-cyan-300/25 ${i % 2 === 0 ? 'animate-slideAcross' : 'animate-slideAcross-reverse'} filter drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]`}
                style={{
                  fontSize: `${25 + Math.random() * 35}px`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 2}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}
              >
                {glyph}
              </div>
            ))}
          </div>
          
          {/* Numerical Matrix - More numbers and combinations */}
          <div className="absolute inset-0">
            {['111', '222', '333', '444', '555', '666', '777', '888', '999', '1111', '369', '432', '528', '741', '963', '147', '258', '1234', '4321', '1010', '0101', '1212', '3333', '7777', '8888'].map((num, i) => (
              <div
                key={`num-${i}`}
                className={`absolute font-mono text-emerald-300/20 ${i % 3 === 0 ? 'animate-fadeInOut' : 'animate-fadeInOut-slow'} filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
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
          
          {/* Sacred Geometry Patterns */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(12)].map((_, i) => (
              <div
                key={`geo-${i}`}
                className={`absolute border border-purple-400/30 ${i % 2 === 0 ? 'animate-rotate' : 'animate-rotate-reverse'}`}
                style={{
                  width: `${50 + Math.random() * 150}px`,
                  height: `${50 + Math.random() * 150}px`,
                  borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0%' : '20%',
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 1.5}s`,
                  animationDuration: `${20 + i * 5}s`,
                  boxShadow: '0 0 20px rgba(147,51,234,0.3)'
                }}
              />
            ))}
          </div>
          
          {/* Energy Grid Lines */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(147,51,234,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              transform: 'perspective(500px) rotateX(60deg)',
              transformOrigin: 'center center'
            }}></div>
          </div>
          
          {/* Particle Field */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <div
                key={`particle-${i}`}
                className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${10 + Math.random() * 20}s`,
                  boxShadow: '0 0 6px rgba(255,255,255,0.5)'
                }}
              />
            ))}
          </div>
          
          {/* Moving Wave Patterns */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={`wave-${i}`}
                className="absolute w-full h-32 opacity-10"
                style={{
                  background: `linear-gradient(90deg, transparent, ${['purple', 'cyan', 'emerald'][i % 3]}, transparent)`,
                  top: `${i * 20}%`,
                  animation: `slideAcross ${10 + i * 2}s linear infinite`,
                  animationDelay: `${i * 2}s`,
                  transform: `skewY(${-10 + i * 5}deg)`
                }}
              />
            ))}
          </div>
          
          {/* Floating Orbs with Trails */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={`orb-trail-${i}`}
                className="absolute animate-drift"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDuration: `${20 + i * 5}s`,
                  animationDelay: `${i * 2}s`
                }}
              >
                <div className="relative">
                  <div className={`w-4 h-4 bg-gradient-to-r ${i % 2 === 0 ? 'from-purple-400 to-pink-400' : 'from-cyan-400 to-blue-400'} rounded-full blur-sm`}></div>
                  <div className="absolute inset-0 w-4 h-4 bg-white/50 rounded-full animate-ping"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Rotating Mandala Patterns */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[800px] h-[800px] animate-rotate" style={{animationDuration: '60s'}}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={`mandala-${i}`}
                  className="absolute inset-0 border border-purple-500/10 rounded-full"
                  style={{
                    width: `${100 + i * 100}px`,
                    height: `${100 + i * 100}px`,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 0.5}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="relative text-center pt-32 pb-20 z-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">
            ANOINT: Array
          </h1>
          <p className="text-xl text-white mt-4">
            Build Your Own Energy Healing Technology using our Array Generator!
          </p>
          <Link to="/auth">
            <button className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:scale-105 transition">
              Start Your Journey
            </button>
          </Link>
        </div>
      </section>

      {/* Product Catalogue Section */}
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-gray-900">
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
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-black">
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
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-gray-900">
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
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-black relative overflow-hidden">
        {/* Aurora background effects */}
        <div className="absolute inset-0">
          {/* Primary aurora waves */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-400 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-green-500 rounded-full mix-blend-screen filter blur-[150px] animate-float" style={{animationDelay: '4s'}}></div>
          </div>
          
          {/* Aurora lines */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(5)].map((_, i) => (
              <div
                key={`aurora-line-${i}`}
                className="absolute w-full h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${['emerald', 'green', 'cyan'][i % 3]}, transparent)`,
                  top: `${20 + i * 15}%`,
                  animation: `slideAcross ${8 + i * 2}s linear infinite`,
                  animationDelay: `${i * 1.5}s`,
                  transform: `rotate(${-5 + i * 2}deg)`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="relative bg-gradient-to-br from-purple-900/50 to-emerald-900/50 rounded-lg p-12 border border-emerald-500/50 backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            {/* Animated glow effect */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-full blur-[120px] animate-pulse"></div>
            </div>
            
            {/* Green border glow animation */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500 via-green-500 to-cyan-500 opacity-50 blur-sm animate-pulse"></div>
            <div className="absolute inset-[1px] rounded-lg bg-black/80"></div>
            
            {/* Content */}
            <div className="relative z-10 text-center">
              <h2 className="text-4xl font-serif mb-4 text-white">VIP Scalar Technology</h2>
              <h3 className="text-2xl text-purple-400 mb-6">Exclusive Bio-Scalar Technology</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
                Experience cutting-edge healing technology not available anywhere else. Our VIP collection features custom-made bio-scalar devices personally crafted by Brad Johnson, founder of ANOINT. These high-quality, industrial-grade wearable scalar technology devices represent the pinnacle of energy healing innovation, combining ancient wisdom with quantum physics principles.
              </p>
              <p className="text-gray-300 text-lg mb-8">
                Join the exclusive waiting list for access to these revolutionary healing tools.
              </p>
              <Link to="/vip-waitlist">
                <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Join VIP Waiting List
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 md:px-16 lg:px-32 bg-gray-900">
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
      <footer className="bg-black text-gray-400 py-12 px-6 md:px-16 lg:px-32 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">ANOINT: Array</h3>
              <p className="text-sm">Energy healing technology for the modern age</p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-purple-400 transition-colors">Home</Link></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Products</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Array Generator</a></li>
                <li><Link to="/about" className="hover:text-purple-400 transition-colors">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Testimonials</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy-policy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-purple-400 transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/disclaimer" className="hover:text-purple-400 transition-colors">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-sm">&copy; 2025 ANOINT: Array. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home