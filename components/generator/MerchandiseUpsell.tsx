'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ShoppingBag, 
  Truck, 
  Shield, 
  Star,
  ArrowRight,
  Gift,
  Palette
} from 'lucide-react'

export default function MerchandiseUpsell() {
  const router = useRouter()

  const handleCreateMerchandise = () => {
    router.push('/member/merchandise')
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Main Upsell Card */}
      <div className="p-6 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-lg border border-purple-500/20">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Palette className="text-purple-400" size={28} />
            <h3 className="text-2xl font-bold text-white">
              Transform Your Array into Wearable Art
            </h3>
          </div>
          <p className="text-gray-300 text-lg">
            Your personalized seal array can be printed on premium products and delivered worldwide
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-800/40 rounded-lg">
            <Truck className="mx-auto mb-2 text-green-400" size={24} />
            <h4 className="font-semibold text-white mb-1">Free Shipping</h4>
            <p className="text-sm text-gray-300">Over $50 worldwide</p>
          </div>
          <div className="text-center p-4 bg-gray-800/40 rounded-lg">
            <Shield className="mx-auto mb-2 text-blue-400" size={24} />
            <h4 className="font-semibold text-white mb-1">Premium Quality</h4>
            <p className="text-sm text-gray-300">Professional printing</p>
          </div>
          <div className="text-center p-4 bg-gray-800/40 rounded-lg">
            <Star className="mx-auto mb-2 text-purple-400" size={24} />
            <h4 className="font-semibold text-white mb-1">Print-on-Demand</h4>
            <p className="text-sm text-gray-300">Made just for you</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleCreateMerchandise}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3 text-lg font-semibold"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Create Merchandise
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Product Types */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Available Products:</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-300">
            <span className="px-2 py-1 bg-gray-700/50 rounded">T-Shirts</span>
            <span className="px-2 py-1 bg-gray-700/50 rounded">Hoodies</span>
            <span className="px-2 py-1 bg-gray-700/50 rounded">Mugs</span>
            <span className="px-2 py-1 bg-gray-700/50 rounded">Canvas Prints</span>
            <span className="px-2 py-1 bg-gray-700/50 rounded">Hats</span>
            <span className="px-2 py-1 bg-gray-700/50 rounded">Blankets</span>
            <span className="px-2 py-1 bg-gray-700/50 rounded">+ More</span>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <Alert className="bg-blue-900/60 backdrop-blur-lg border-blue-700/50 text-blue-200">
        <Gift className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Upload the PNG you just downloaded, preview it on various products, 
          then order through our print partner FourthWall. They handle all printing, shipping, and customer service.
        </AlertDescription>
      </Alert>
    </div>
  )
}