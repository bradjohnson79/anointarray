interface AuroraBackgroundProps {
  variant?: 'default' | 'subtle' | 'intense' | 'home'
  className?: string
}

export default function AuroraBackground({ variant = 'default', className = '' }: AuroraBackgroundProps) {
  const intensity = variant === 'subtle' ? 0.4 : variant === 'intense' ? 1.0 : variant === 'home' ? 0.8 : 0.6

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`} style={{ zIndex: 1 }}>
      {/* Aurora Effects - More Visible */}
      <div className="absolute inset-0" style={{ opacity: intensity }}>
        {/* Large moving orbs with stronger colors */}
        <div 
          className="absolute rounded-full filter blur-2xl animate-pulse"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8), rgba(139, 92, 246, 0.3), transparent)',
            top: '5%',
            left: '5%',
            animationDuration: '4s'
          }}
        />
        <div 
          className="absolute rounded-full filter blur-2xl animate-pulse"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.7), rgba(6, 182, 212, 0.2), transparent)',
            top: '50%',
            right: '10%',
            animationDuration: '5s',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute rounded-full filter blur-2xl animate-pulse"
          style={{
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.6), rgba(236, 72, 153, 0.2), transparent)',
            bottom: '10%',
            left: '25%',
            animationDuration: '6s',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute rounded-full filter blur-2xl animate-pulse"
          style={{
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.5), rgba(16, 185, 129, 0.1), transparent)',
            top: '25%',
            right: '30%',
            animationDuration: '7s',
            animationDelay: '3s'
          }}
        />
        
        {/* Flowing gradient waves */}
        <div 
          className="absolute w-full h-48 animate-pulse"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), rgba(6, 182, 212, 0.4), transparent)',
            top: '15%',
            animationDuration: '8s',
            transform: 'skewY(-2deg)'
          }}
        />
        <div 
          className="absolute w-full h-32 animate-pulse"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.3), rgba(139, 92, 246, 0.3), transparent)',
            top: '65%',
            animationDuration: '10s',
            animationDelay: '4s',
            transform: 'skewY(2deg)'
          }}
        />
        
        {/* Animated particles with glow */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-pulse"
            style={{
              background: i % 3 === 0 ? 'rgba(139, 92, 246, 0.8)' : i % 3 === 1 ? 'rgba(6, 182, 212, 0.8)' : 'rgba(236, 72, 153, 0.8)',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              boxShadow: i % 3 === 0 ? '0 0 15px rgba(139, 92, 246, 1)' : i % 3 === 1 ? '0 0 15px rgba(6, 182, 212, 1)' : '0 0 15px rgba(236, 72, 153, 1)'
            }}
          />
        ))}
        
        {/* Rotating geometric shapes */}
        <div 
          className="absolute border-2 rounded-full opacity-25 animate-spin"
          style={{
            width: '250px',
            height: '250px',
            borderColor: 'rgba(6, 182, 212, 0.6)',
            top: '20%',
            right: '15%',
            animationDuration: '20s',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
          }}
        />
        <div 
          className="absolute border-2 opacity-20 animate-spin"
          style={{
            width: '180px',
            height: '180px',
            borderColor: 'rgba(139, 92, 246, 0.6)',
            top: '60%',
            left: '70%',
            animationDuration: '15s',
            animationDirection: 'reverse',
            transform: 'rotate(45deg)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
          }}
        />
        <div 
          className="absolute border-2 border-pink-400 rounded-full opacity-15 animate-spin"
          style={{
            width: '120px',
            height: '120px',
            top: '80%',
            right: '40%',
            animationDuration: '25s',
            boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)'
          }}
        />
        
        {/* Additional moving light streaks */}
        <div 
          className="absolute h-1 w-96 animate-pulse"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)',
            top: '35%',
            left: '-20%',
            animationDuration: '12s',
            transform: 'rotate(-15deg)'
          }}
        />
        <div 
          className="absolute h-1 w-80 animate-pulse"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.6), transparent)',
            top: '75%',
            right: '-20%',
            animationDuration: '15s',
            animationDelay: '5s',
            transform: 'rotate(20deg)'
          }}
        />
      </div>
    </div>
  )
}