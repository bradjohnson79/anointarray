'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  ShoppingBag,
  FileImage,
  Info
} from 'lucide-react'

// Import the updated MerchandiseOptions component
import MerchandiseOptionsStandalone from '@/components/merchandise/MerchandiseOptionsStandalone'
import MerchandiseShop from '@/components/merchandise/MerchandiseShop'
import FileUploadComponent from '@/components/merchandise/FileUploadComponent'
import SampleArrayMockups from '@/components/merchandise/SampleArrayMockups'

interface MerchandisePageState {
  step: 'upload' | 'preview' | 'browse'
  uploadedImage: string | null
  uploadedFileName: string | null
  error: string | null
  isProcessing: boolean
}

export default function MerchandisePage() {
  const [state, setState] = useState<MerchandisePageState>({
    step: 'upload',
    uploadedImage: null,
    uploadedFileName: null,
    error: null,
    isProcessing: false
  })

  const handleImageUpload = (imageDataUrl: string, fileName: string) => {
    setState(prev => ({
      ...prev,
      uploadedImage: imageDataUrl,
      uploadedFileName: fileName,
      step: 'preview',
      error: null
    }))
  }

  const handleUploadError = (error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isProcessing: false
    }))
  }

  const handleStartOver = () => {
    setState({
      step: 'upload',
      uploadedImage: null,
      uploadedFileName: null,
      error: null,
      isProcessing: false
    })
  }

  const handleBrowseProducts = () => {
    setState(prev => ({
      ...prev,
      step: 'browse'
    }))
  }

  return (
    <ErrorBoundary>
      <ProtectedRoute requiredRole="member">
        <Layout userRole="member">
          <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Merchandise Creation</h1>
              <p className="text-gray-400">
                Transform your ANOINT Array into premium wearable art and home décor
              </p>
              
              {/* Sample Array Mockups - Show when no user image uploaded yet */}
              {!state.uploadedImage && (
                <SampleArrayMockups />
              )}
            </div>

            {state.error && (
              <Alert className="mb-6 bg-red-900/60 backdrop-blur-lg border-red-700/50 text-red-200" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {state.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Step Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${
                  state.step === 'upload' ? 'text-purple-400' : 
                  state.uploadedImage ? 'text-green-400' : 'text-gray-500'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    state.step === 'upload' ? 'bg-purple-600' :
                    state.uploadedImage ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    <Upload size={16} className="text-white" />
                  </div>
                  <span className="font-medium">Upload</span>
                </div>
                
                <div className={`w-8 h-0.5 ${state.uploadedImage ? 'bg-green-500' : 'bg-gray-600'}`} />
                
                <div className={`flex items-center gap-2 ${
                  state.step === 'preview' ? 'text-purple-400' :
                  state.step === 'browse' ? 'text-green-400' : 'text-gray-500'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    state.step === 'preview' ? 'bg-purple-600' :
                    state.step === 'browse' ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    <ImageIcon size={16} className="text-white" />
                  </div>
                  <span className="font-medium">Preview</span>
                </div>
                
                <div className={`w-8 h-0.5 ${state.step === 'browse' ? 'bg-green-500' : 'bg-gray-600'}`} />
                
                <div className={`flex items-center gap-2 ${
                  state.step === 'browse' ? 'text-purple-400' : 'text-gray-500'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    state.step === 'browse' ? 'bg-purple-600' : 'bg-gray-600'
                  }`}>
                    <ShoppingBag size={16} className="text-white" />
                  </div>
                  <span className="font-medium">Shop</span>
                </div>
              </div>
            </div>

            {/* Upload Step */}
            {state.step === 'upload' && (
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileImage className="h-5 w-5 text-purple-400" />
                    Upload Your ANOINT Array Design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary>
                    <FileUploadComponent 
                      onImageUpload={handleImageUpload}
                      onError={handleUploadError}
                    />
                  </ErrorBoundary>
                  
                  <Alert className="mt-4 bg-blue-900/60 backdrop-blur-lg border-blue-700/50 text-blue-200">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Tip:</strong> Use the high-resolution PNG you downloaded from your generator 
                      for the best print quality on merchandise products.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Preview Step */}
            {state.step === 'preview' && state.uploadedImage && (
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Image Uploaded Successfully
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleStartOver}
                      className="bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
                    >
                      Upload Different Image
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-shrink-0">
                      <div className="w-48 h-48 bg-gray-700/50 rounded-lg overflow-hidden border-2 border-gray-600">
                        <img 
                          src={state.uploadedImage} 
                          alt="Uploaded seal array"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 text-center">
                        {state.uploadedFileName}
                      </p>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-3">Ready for Products!</h3>
                      <p className="text-gray-300 mb-4">
                        Your seal array looks great! Now you can browse our product catalog and see 
                        how it will look on various merchandise items.
                      </p>
                      
                      <Button 
                        onClick={handleBrowseProducts}
                        className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Browse Products
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Browse/Shop Step */}
            {state.step === 'browse' && state.uploadedImage && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Product Catalog</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleStartOver}
                    className="bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
                  >
                    Change Image
                  </Button>
                </div>
                
                <ErrorBoundary>
                  <MerchandiseShop
                    sealArrayImage={state.uploadedImage}
                    fileName={state.uploadedFileName || 'seal-array.png'}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>
        </Layout>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}