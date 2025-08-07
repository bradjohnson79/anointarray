'use client'

import { useState, useRef, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ChevronDown,
  ChevronRight,
  User,
  Brain,
  Image as ImageIcon,
  CreditCard,
  Download,
  Lock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Zap
} from 'lucide-react'

// Import generator components
import UserInputAccordion from '@/components/generator/UserInputAccordion'
import GeneratorCanvas from '@/components/generator/GeneratorCanvas'
import PaymentAccordion from '@/components/generator/PaymentAccordion'
import EducationalSummary from '@/components/generator/EducationalSummary'
import MerchandiseUpsell from '@/components/generator/MerchandiseUpsell'
import DebugWindow from '@/components/generator/DebugWindow'
import UsageInstructions from '@/components/generator/UsageInstructions'

interface GeneratorState {
  currentStep: 'input' | 'generating' | 'preview' | 'payment' | 'complete'
  userInput: UserInput | null
  generatedData: GenerationOutput | null
  isPurchased: boolean
  paymentSession: string | null
  error: string | null
  sealArrayImage: string | null
}

interface UserInput {
  fullName: string
  birthdate: { month: number, day: number, year: number }
  birthTime?: { hour: number, minute: number, period: 'AM' | 'PM' }
  birthPlace?: {
    displayName: string
    latitude: number
    longitude: number
  }
  template: 'torus-field' | 'flower-of-life' | 'sri-yantra'
  category: string
  sealType: string
  additionalComments?: string
}

interface GenerationOutput {
  ring1: Array<{
    number: number
    color: string
    position: string
    angle: number
    x: number
    y: number
  }>
  ring2: Array<{
    glyph: string
    color: string
    position: string
    angle: number
    x: number
    y: number
  }>
  ring3: {
    text: string
    language: string
    repetitions: number
  }
  explanation: string
  metadata: {
    generated: Date | string
    template: string
    category: string
    sealType: string
  }
}

interface AccordionItemProps {
  id: string
  title: string
  icon: React.ReactNode
  status: 'locked' | 'active' | 'completed' | 'error'
  isOpen: boolean
  onToggle: () => void
  disabled?: boolean
  children: React.ReactNode
}

function AccordionItem({ 
  id, 
  title, 
  icon, 
  status, 
  isOpen, 
  onToggle, 
  disabled = false, 
  children 
}: AccordionItemProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'active': return 'text-blue-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'locked': return <Lock className="h-5 w-5 text-gray-400" />
      default: return null
    }
  }

  return (
    <Card className={`transition-all duration-200 bg-gray-800/60 backdrop-blur-lg border-gray-700/50 ${
      status === 'active' ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' : ''
    } ${status === 'completed' ? 'border-green-500/50 shadow-lg shadow-green-500/20' : ''}`}>
      <CardHeader 
        className={`cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        onClick={disabled ? undefined : onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={getStatusColor()}>
              {icon}
            </div>
            <CardTitle className="text-lg text-white">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {!disabled && (
              isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
            )}
          </div>
        </div>
      </CardHeader>
      {isOpen && !disabled && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

export default function GeneratorPage() {
  const [state, setState] = useState<GeneratorState>({
    currentStep: 'input',
    userInput: null,
    generatedData: null,
    isPurchased: false,
    paymentSession: null,
    error: null,
    sealArrayImage: null
  })

  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['input']))
  const [generationProgress, setGenerationProgress] = useState(0)
  const [debugData, setDebugData] = useState<any>(null)

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleUserInputSubmit = async (userInput: UserInput) => {
    setState(prev => ({ ...prev, userInput, currentStep: 'generating', error: null }))
    setOpenAccordions(new Set(['generating']))
    
    // Reset debug data for new generation
    setDebugData(null)
    
    try {
      // Start generation progress animation
      const progressTimer = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 500)

      const response = await fetch('/api/generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...userInput, debugMode: true }) // Always include debug for prompt display
      })

      const result = await response.json()

      clearInterval(progressTimer)
      setGenerationProgress(100)

      if (!result.success) {
        throw new Error(result.error || 'Generation failed')
      }

      // Capture debug data if available
      if (result.debug) {
        setDebugData(result.debug)
      }

      // Parse date if it's a string
      const generatedData: GenerationOutput = {
        ...result.data,
        metadata: {
          ...result.data.metadata,
          generated: result.data.metadata.generated instanceof Date 
            ? result.data.metadata.generated 
            : new Date(result.data.metadata.generated)
        }
      }

      setState(prev => ({
        ...prev,
        generatedData,
        currentStep: 'preview'
      }))

      setOpenAccordions(new Set(['preview']))

    } catch (error) {
      console.error('Generation error:', error)
      setState(prev => ({
        ...prev,
        currentStep: 'input',
        error: error instanceof Error ? error.message : 'Failed to generate seal array'
      }))
      setOpenAccordions(new Set(['input']))
    }
  }

  const handlePaymentSuccess = (sessionId: string, sealArrayImage?: string) => {
    setState(prev => ({
      ...prev,
      isPurchased: true,
      paymentSession: sessionId,
      currentStep: 'complete',
      sealArrayImage: sealArrayImage || prev.sealArrayImage
    }))
    setOpenAccordions(new Set(['complete']))
  }


  const handleImageGenerated = (imageDataUrl: string) => {
    try {
      if (!imageDataUrl) {
        console.warn('Empty image data URL received')
        return
      }
      
      setState(prev => ({
        ...prev,
        sealArrayImage: imageDataUrl
      }))
      console.log('Seal array image generated successfully')
    } catch (error) {
      console.error('Error handling generated image:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to process generated seal array image'
      }))
    }
  }

  const getAccordionStatus = (id: string) => {
    switch (id) {
      case 'input':
        if (state.error) return 'error'
        if (state.currentStep === 'input') return 'active'
        if (state.userInput) return 'completed'
        return 'active'
      
      case 'generating':
        if (state.currentStep === 'generating') return 'active'
        if (state.generatedData) return 'completed'
        if (state.userInput) return 'locked'
        return 'locked'
      
      case 'preview':
        if (state.currentStep === 'preview') return 'active'
        if (state.isPurchased) return 'completed'
        if (state.generatedData) return 'active'
        return 'locked'
      
      case 'payment':
        if (state.currentStep === 'payment') return 'active'
        if (state.isPurchased) return 'completed'
        if (state.generatedData) return 'locked'
        return 'locked'
      
      default:
        return 'locked'
    }
  }

  const isAccordionDisabled = (id: string) => {
    switch (id) {
      case 'input':
        return false
      case 'generating':
        return !state.userInput
      case 'preview':
        return !state.generatedData
      case 'payment':
        return !state.generatedData || state.isPurchased
      default:
        return true
    }
  }

  return (
    <ErrorBoundary>
      <ProtectedRoute requiredRole="member">
        <Layout userRole="member">
          <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">ANOINT Array Generator</h1>
            <p className="text-gray-400">
              Create your personalized metaphysical seal array for $17 USD
            </p>
          </div>

      {state.error && (
        <Alert className="mb-6 bg-red-900/60 backdrop-blur-lg border-red-700/50 text-red-200" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* User Input Accordion */}
        <AccordionItem
          id="input"
          title="Personal Information & Seal Configuration"
          icon={<User className="h-5 w-5" />}
          status={getAccordionStatus('input')}
          isOpen={openAccordions.has('input')}
          onToggle={() => toggleAccordion('input')}
          disabled={isAccordionDisabled('input')}
        >
          <UserInputAccordion onSubmit={handleUserInputSubmit} />
        </AccordionItem>

        {/* AI Generation Accordion */}
        <AccordionItem
          id="generating"
          title="AI Generation in Progress"
          icon={<Brain className="h-5 w-5" />}
          status={getAccordionStatus('generating')}
          isOpen={openAccordions.has('generating')}
          onToggle={() => toggleAccordion('generating')}
          disabled={isAccordionDisabled('generating')}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              <span className="text-lg text-white">Generating your personalized seal array...</span>
            </div>
            
            {/* Always show debug info when available */}
            {debugData && debugData.prompt && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-semibold text-purple-300">Claude 3.5 Sonnet Prompt:</div>
                <div className="bg-gray-900/60 rounded p-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-64">
                  {debugData.prompt.fullText}
                </div>
              </div>
            )}
            
            <div className="bg-gray-700/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            
            <Alert className="bg-blue-900/60 backdrop-blur-lg border-blue-700/50 text-blue-200">
              <AlertDescription>
                <strong>Seal Array Processing may take 1-2 minutes to complete.</strong>
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-gray-300 space-y-1">
              <p>✨ Analyzing your birth data and personal energy signature</p>
              <p>🧠 AI is selecting unique number/color combinations for Ring 1</p>
              <p>🔮 AI is selecting sacred glyph/color combinations for Ring 2</p>
              <p>📝 Generating your personalized affirmation for Ring 3</p>
            </div>
            
          </div>
        </AccordionItem>

        {/* Preview Canvas Accordion */}
        <AccordionItem
          id="preview"
          title="Seal Array Preview"
          icon={<ImageIcon className="h-5 w-5" />}
          status={getAccordionStatus('preview')}
          isOpen={openAccordions.has('preview')}
          onToggle={() => toggleAccordion('preview')}
          disabled={isAccordionDisabled('preview')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Your Personalized ANOINT Array</h3>
              <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-lg px-3 py-1 border-0">
                $17 USD
              </Badge>
            </div>
            
            {state.generatedData && (
              <>
                <ErrorBoundary>
                  <GeneratorCanvas 
                    data={state.generatedData}
                    isPurchased={state.isPurchased}
                    onPaymentClick={() => {
                      setState(prev => ({ ...prev, currentStep: 'payment' }))
                      setOpenAccordions(new Set(['payment']))
                    }}
                    onImageGenerated={handleImageGenerated}
                  />
                </ErrorBoundary>
                
                <ErrorBoundary>
                  <EducationalSummary explanation={state.generatedData.explanation} />
                </ErrorBoundary>
                
                <ErrorBoundary>
                  <UsageInstructions />
                </ErrorBoundary>
              </>
            )}
            
            <Alert className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 text-gray-300">
              <AlertDescription>
                This preview includes watermarks for protection. Purchase to download the high-resolution, 
                watermark-free version as PDF and PNG formats.
              </AlertDescription>
            </Alert>
            
            {!state.isPurchased && state.generatedData && (
              <div className="flex justify-center">
                <Button 
                  size="lg"
                  onClick={() => {
                    setState(prev => ({ ...prev, currentStep: 'payment' }))
                    setOpenAccordions(new Set(['payment']))
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Purchase for $17 USD
                </Button>
              </div>
            )}
          </div>
        </AccordionItem>

        {/* Payment Accordion */}
        <AccordionItem
          id="payment"
          title="Payment & Download"
          icon={<CreditCard className="h-5 w-5" />}
          status={getAccordionStatus('payment')}
          isOpen={openAccordions.has('payment')}
          onToggle={() => toggleAccordion('payment')}
          disabled={isAccordionDisabled('payment')}
        >
          {state.isPurchased ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg font-semibold text-white">Payment Successful!</span>
              </div>
              
              <p className="text-gray-300">
                Your ANOINT Array has been unlocked. You can now download the high-resolution, 
                watermark-free version.
              </p>
              
              <div className="flex gap-3">
                <Button className="bg-gray-700/60 backdrop-blur-lg border-gray-600/50 text-white hover:bg-gray-600/70">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button className="bg-gray-700/60 backdrop-blur-lg border-gray-600/50 text-white hover:bg-gray-600/70">
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
              </div>
              
              {/* Merchandise Upsell */}
              <MerchandiseUpsell />
            </div>
          ) : (
            <PaymentAccordion 
              amount={17.00}
              currency="USD"
              sealArrayId={
                state.generatedData?.metadata.generated 
                  ? (typeof state.generatedData.metadata.generated === 'string' 
                      ? state.generatedData.metadata.generated 
                      : state.generatedData.metadata.generated.toISOString())
                  : ''
              }
              onSuccess={handlePaymentSuccess}
              sealArrayImage={state.sealArrayImage || undefined}
            />
          )}
        </AccordionItem>

      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2">
          {(() => {
            const steps = ['input', 'generating', 'preview', 'payment']
            return steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${
                  getAccordionStatus(step) === 'completed' ? 'bg-green-500' :
                  getAccordionStatus(step) === 'active' ? 'bg-purple-500' :
                  'bg-gray-600'
                }`} />
                {index < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-600 mx-1" />}
              </div>
            ))
          })()}
        </div>
      </div>
        </div>
      </Layout>
    </ProtectedRoute>
    </ErrorBoundary>
  )
}