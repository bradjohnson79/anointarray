'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shirt, 
  Coffee, 
  Image as ImageIcon, 
  Loader2,
  Sparkles,
  Eye
} from 'lucide-react'

interface SampleArrayInfo {
  uploaded: boolean
  fileName: string | null
  imageUrl: string | null
}

const SAMPLE_PRODUCTS = [
  {
    id: 't-shirt',
    name: 'Premium T-Shirt',
    icon: Shirt,
    mockupImage: '/mockups/array-tshirt.png',
    sealSize: '30%',
    sealPosition: { top: '45%', left: '50%' },
    hasProfessionalMockup: true
  },
  {
    id: 'mug',
    name: 'Ceramic Mug',
    icon: Coffee,
    mockupImage: '/mockups/array-coffee-mug.png',
    sealSize: '25%',
    sealPosition: { top: '45%', left: '50%' },
    hasProfessionalMockup: true
  },
  {
    id: 'canvas',
    name: 'Canvas Print',
    icon: ImageIcon,
    mockupImage: '/mockups/array-framed-poster.png',
    sealSize: '35%',
    sealPosition: { top: '50%', left: '50%' },
    hasProfessionalMockup: true
  }
]

export default function SampleArrayMockups() {
  const [sampleArray, setSampleArray] = useState<SampleArrayInfo>({
    uploaded: false,
    fileName: null,
    imageUrl: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [mockupsGenerated, setMockupsGenerated] = useState(false)

  useEffect(() => {
    fetchSampleArray()
  }, [])

  const fetchSampleArray = async () => {
    try {
      const response = await fetch('/api/admin/generator/get-sample-array')
      const data = await response.json()
      
      if (data.success && data.sampleArray) {
        setSampleArray(data.sampleArray)
      }
    } catch (error) {
      console.error('Failed to fetch sample array:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate mockups with a slight delay for visual effect
  useEffect(() => {
    if (sampleArray.uploaded && sampleArray.imageUrl) {
      const timer = setTimeout(() => {
        setMockupsGenerated(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [sampleArray])

  if (isLoading) {
    return (
      <div className="mt-6 p-6 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400 mr-3" />
          <span className="text-gray-300">Loading sample mockups...</span>
        </div>
      </div>
    )
  }

  if (!sampleArray.uploaded || !sampleArray.imageUrl) {
    return (
      <div className="mt-6 p-6 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <Alert className="bg-amber-900/60 border-amber-700/50 text-amber-200">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>Sample Mockups Unavailable</strong><br/>
            Admin needs to upload a sample array in Generator Settings to display product previews here.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Product Preview Gallery
        </h3>
        <p className="text-sm text-gray-400 mb-1">
          See how your seal array might look on our premium products
        </p>
        <p className="text-xs text-gray-500">
          Sample design: {sampleArray.fileName}
        </p>
      </div>

      {/* Product Mockups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLE_PRODUCTS.map((product, index) => {
          const ProductIcon = product.icon
          const showMockup = mockupsGenerated

          return (
            <div 
              key={product.id}
              className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 group"
            >
              {/* Product Preview */}
              <div className="aspect-square rounded mb-3 relative overflow-hidden bg-gray-100">
                {showMockup ? (
                  <div className="w-full h-full relative">
                    {/* Professional mockup background image */}
                    {product.hasProfessionalMockup ? (
                      <img 
                        src={product.mockupImage}
                        alt={`${product.name} mockup`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`Failed to load mockup image: ${product.mockupImage}`)
                          // Hide the image and show fallback
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No mockup available</span>
                      </div>
                    )}
                    
                    {/* Sample seal array overlay - positioned over the mockup */}
                    <img 
                      src={sampleArray.imageUrl} 
                      alt={`Sample design on ${product.name}`}
                      className="absolute z-10 object-contain transition-opacity duration-500"
                      style={{
                        width: product.sealSize,
                        height: product.sealSize,
                        top: product.sealPosition.top,
                        left: product.sealPosition.left,
                        transform: 'translate(-50%, -50%)',
                        mixBlendMode: 'multiply' // Blend with the product mockup
                      }}
                      onError={(e) => {
                        console.error('Failed to load seal array image')
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 backdrop-blur-sm rounded-full p-2">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center text-gray-500">
                      <Loader2 className="mx-auto mb-2 animate-spin h-8 w-8" />
                      <div className="text-xs">Generating Preview...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ProductIcon className="h-4 w-4 text-purple-400" />
                  <h4 className="font-medium text-white text-sm">{product.name}</h4>
                </div>
                <p className="text-xs text-gray-400">Sample mockup</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Call to action */}
      <div className="text-center mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
        <p className="text-sm text-purple-300 mb-2">
          ✨ Upload your own seal array to see personalized mockups
        </p>
        <p className="text-xs text-gray-400">
          Your design will replace the sample and show exactly how your products will look
        </p>
      </div>
    </div>
  )
}