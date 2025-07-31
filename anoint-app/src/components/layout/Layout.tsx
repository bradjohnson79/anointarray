
import Navbar from '../Navbar'
import Footer from './Footer'
import AuroraBackground from '../AuroraBackground'

interface LayoutProps {
  children: React.ReactNode
  auroraVariant?: 'default' | 'subtle' | 'intense' | 'home'
}

const Layout: React.FC<LayoutProps> = ({ children, auroraVariant = 'default' }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <AuroraBackground variant={auroraVariant} />
      <Navbar />
      <main className="flex-grow pt-16 relative z-20">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout