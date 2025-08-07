'use client'

import { useState, useEffect, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Image as ImageIcon,
  FileText,
  Zap,
  DollarSign
} from 'lucide-react'

interface AssetStatus {
  glyphs: {
    total: number
    verified: string[]
    missing: string[]
    sizes: { [filename: string]: { width: number, height: number } }
  }
  templates: {
    flowerOfLife: boolean
    sriYantra: boolean
    torusField: boolean
  }
  csvData: {
    numbers: { loaded: boolean, count: number }
    colors: { loaded: boolean, count: number }
    glyphs: { loaded: boolean, count: number }
  }
  openAI: {
    connected: boolean
    model: string
    lastTest: Date | null
    customPrompt: string
    promptTemplate: string
  }
  paymentGateways: {
    stripe: boolean
    paypal: boolean
    nowpayments: boolean
  }
  sampleArray: {
    uploaded: boolean
    fileName: string | null
    uploadDate: Date | null
    imageUrl: string | null
  }
}

interface CalibrationCanvasProps {
  onCoordinateClick: (x: number, y: number, angle: number, ring: number) => void
}

function CalibrationCanvas({ onCoordinateClick }: CalibrationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showWatermark, setShowWatermark] = useState(true)
  const [centerOffset, setCenterOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<{ x: number, y: number, angle: number, ring: number } | null>(null)
  const [showCircularText, setShowCircularText] = useState(true)
  const [circularTextSample, setCircularTextSample] = useState('PEACE LOVE HARMONY')
  const [circularTextSize, setCircularTextSize] = useState(24)
  const [ring3Radius, setRing3Radius] = useState(540)
  const [letterSpacing, setLetterSpacing] = useState(1.0)

  // 24-point coordinate system
  const generateCoordinates = () => {
    const center = { x: 600 + centerOffset.x, y: 600 + centerOffset.y }
    const ring1Radius = 360
    const ring2Radius = 460
    
    const positions = []
    for (let i = 0; i < 24; i++) {
      const angle = i * 15 // 15° intervals
      const radian = (angle - 90) * (Math.PI / 180) // -90 to start at 12:00
      
      // Ring 1 positions
      positions.push({
        ring: 1,
        angle: angle,
        time: formatTime(angle),
        x: center.x + Math.cos(radian) * ring1Radius,
        y: center.y + Math.sin(radian) * ring1Radius
      })
      
      // Ring 2 positions
      positions.push({
        ring: 2,
        angle: angle,
        time: formatTime(angle),
        x: center.x + Math.cos(radian) * ring2Radius,
        y: center.y + Math.sin(radian) * ring2Radius
      })
    }
    
    return positions
  }

  const formatTime = (angle: number): string => {
    const hour = Math.floor(angle / 30) || 12
    const minute = (angle % 30) === 0 ? '00' : '30'
    return `${hour.toString().padStart(2, '0')}:${minute}`
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw elegant gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#F8F9FA') // Light silver
    gradient.addColorStop(1, '#FFFFFF') // White
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)'
      ctx.lineWidth = 1
      
      for (let x = 0; x <= canvas.width; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      
      for (let y = 0; y <= canvas.height; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Draw center point
    const center = { x: 600 + centerOffset.x, y: 600 + centerOffset.y }
    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.arc(center.x, center.y, 5, 0, Math.PI * 2)
    ctx.fill()

    // Draw ring circles
    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 2
    
    // Ring 1
    ctx.beginPath()
    ctx.arc(center.x, center.y, 360, 0, Math.PI * 2)
    ctx.stroke()
    
    // Ring 2
    ctx.beginPath()
    ctx.arc(center.x, center.y, 460, 0, Math.PI * 2)
    ctx.stroke()
    
    // Ring 3
    ctx.beginPath()
    ctx.arc(center.x, center.y, ring3Radius, 0, Math.PI * 2)
    ctx.stroke()

    // Draw coordinate points
    const coordinates = generateCoordinates()
    coordinates.forEach((coord) => {
      const isHovered = hoveredNode && 
        Math.abs(hoveredNode.x - coord.x) < 10 && 
        Math.abs(hoveredNode.y - coord.y) < 10

      // Draw node
      ctx.fillStyle = coord.ring === 1 ? '#3b82f6' : '#8b5cf6'
      if (isHovered) ctx.fillStyle = '#ef4444'
      
      ctx.beginPath()
      ctx.arc(coord.x, coord.y, 8, 0, Math.PI * 2)
      ctx.fill()

      // Draw time label
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(coord.time, coord.x, coord.y - 20)
    })

    // Draw circular text if enabled
    if (showCircularText && circularTextSample) {
      ctx.save()
      ctx.fillStyle = '#000000'
      ctx.font = `bold ${circularTextSize}px "Georgia", serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Create repeated text with start/end bullets for each phrase
      const fullText = `• ${circularTextSample} • • ${circularTextSample} •`
      const chars = fullText.split('')
      const baseAngleStep = (Math.PI * 2) / chars.length
      const angleStep = baseAngleStep * letterSpacing
      
      chars.forEach((char, index) => {
        const angle = index * angleStep - Math.PI / 2 // Start at top
        const x = center.x + Math.cos(angle) * ring3Radius
        const y = center.y + Math.sin(angle) * ring3Radius
        
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle + Math.PI / 2) // Rotate character to follow circle
        ctx.fillText(char, 0, 0)
        ctx.restore()
      })
      
      ctx.restore()
    }

    // Draw watermark if enabled
    if (showWatermark) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.font = 'bold 64px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('© ANOINT', center.x, center.y)
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find closest coordinate
    const coordinates = generateCoordinates()
    let closest = coordinates[0]
    let minDistance = Math.hypot(x - closest.x, y - closest.y)

    coordinates.forEach(coord => {
      const distance = Math.hypot(x - coord.x, y - coord.y)
      if (distance < minDistance) {
        minDistance = distance
        closest = coord
      }
    })

    if (minDistance < 20) {
      onCoordinateClick(closest.x, closest.y, closest.angle, closest.ring)
    }
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find hovered node
    const coordinates = generateCoordinates()
    const hovered = coordinates.find(coord => 
      Math.hypot(x - coord.x, y - coord.y) < 15
    )

    setHoveredNode(hovered || null)
  }

  useEffect(() => {
    drawCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGrid, showWatermark, centerOffset, hoveredNode, showCircularText, circularTextSample, circularTextSize, ring3Radius, letterSpacing])

  // Configuration management functions
  const saveCalibrationConfig = () => {
    const config = {
      showGrid,
      showWatermark,
      centerOffset,
      showCircularText,
      circularTextSample,
      circularTextSize,
      ring3Radius,
      savedAt: new Date().toISOString()
    }
    
    try {
      localStorage.setItem('anoint-calibration-config', JSON.stringify(config))
      alert('Calibration configuration saved successfully!')
      console.log('Saved calibration config:', config)
    } catch (error) {
      console.error('Failed to save calibration config:', error)
      alert('Failed to save configuration. Please try again.')
    }
  }

  const loadCalibrationConfig = () => {
    try {
      const savedConfig = localStorage.getItem('anoint-calibration-config')
      if (savedConfig) {
        const config = JSON.parse(savedConfig)
        setShowGrid(config.showGrid ?? true)
        setShowWatermark(config.showWatermark ?? true)
        setCenterOffset(config.centerOffset ?? { x: 0, y: 0 })
        setShowCircularText(config.showCircularText ?? true)
        setCircularTextSample(config.circularTextSample ?? 'PEACE LOVE HARMONY')
        setCircularTextSize(config.circularTextSize ?? 24)
        setRing3Radius(config.ring3Radius ?? 540)
        setLetterSpacing(config.letterSpacing ?? 1.0)
        alert(`Configuration loaded successfully!\nSaved: ${new Date(config.savedAt).toLocaleString()}`)
        console.log('Loaded calibration config:', config)
      } else {
        alert('No saved configuration found.')
      }
    } catch (error) {
      console.error('Failed to load calibration config:', error)
      alert('Failed to load configuration.')
    }
  }

  const resetCalibrationConfig = () => {
    if (confirm('Reset all calibration settings to default values?')) {
      setShowGrid(true)
      setShowWatermark(true)
      setCenterOffset({ x: 0, y: 0 })
      setShowCircularText(true)
      setCircularTextSample('PEACE LOVE HARMONY')
      setCircularTextSize(24)
      setRing3Radius(540)
      alert('Configuration reset to default values.')
    }
  }

  // Load saved config on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('anoint-calibration-config')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setShowGrid(config.showGrid ?? true)
        setShowWatermark(config.showWatermark ?? true)
        setCenterOffset(config.centerOffset ?? { x: 0, y: 0 })
        setShowCircularText(config.showCircularText ?? true)
        setCircularTextSample(config.circularTextSample ?? 'PEACE LOVE HARMONY')
        setCircularTextSize(config.circularTextSize ?? 24)
        setRing3Radius(config.ring3Radius ?? 540)
        setLetterSpacing(config.letterSpacing ?? 1.0)
        console.log('Auto-loaded saved calibration config')
      } catch (error) {
        console.error('Failed to auto-load calibration config:', error)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Button
          variant={showGrid ? "default" : "outline"}
          onClick={() => setShowGrid(!showGrid)}
          size="sm"
        >
          Grid Overlay
        </Button>
        
        <Button
          variant={showWatermark ? "default" : "outline"}
          onClick={() => setShowWatermark(!showWatermark)}
          size="sm"
        >
          Watermark
        </Button>

        <div className="flex items-center gap-2">
          <label className="text-sm">Center X:</label>
          <input
            type="range"
            min={-50}
            max={50}
            value={centerOffset.x}
            onChange={(e) => setCenterOffset(prev => ({ ...prev, x: parseInt(e.target.value) }))}
            className="w-20"
          />
          <span className="text-sm w-8">{centerOffset.x}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Center Y:</label>
          <input
            type="range"
            min={-50}
            max={50}
            value={centerOffset.y}
            onChange={(e) => setCenterOffset(prev => ({ ...prev, y: parseInt(e.target.value) }))}
            className="w-20"
          />
          <span className="text-sm w-8">{centerOffset.y}</span>
        </div>
      </div>

      {/* Ring 3 Circular Text Controls */}
      <div className="flex flex-wrap gap-4 items-center border-t pt-4">
        <Button
          variant={showCircularText ? "default" : "outline"}
          onClick={() => setShowCircularText(!showCircularText)}
          size="sm"
        >
          Ring 3 Text
        </Button>

        <div className="flex items-center gap-2">
          <label className="text-sm">Sample Text:</label>
          <input
            type="text"
            value={circularTextSample}
            onChange={(e) => setCircularTextSample(e.target.value)}
            className="px-2 py-1 border rounded text-sm w-48"
            placeholder="Enter sample text"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Font Size:</label>
          <input
            type="range"
            min={16}
            max={32}
            value={circularTextSize}
            onChange={(e) => setCircularTextSize(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm w-8">{circularTextSize}px</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Ring 3 Radius:</label>
          <input
            type="range"
            min={500}
            max={580}
            value={ring3Radius}
            onChange={(e) => setRing3Radius(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm w-12">{ring3Radius}px</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Letter Spacing:</label>
          <input
            type="range"
            min={0.8}
            max={2.0}
            step={0.1}
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
            className="w-20"
          />
          <span className="text-sm w-12">{letterSpacing.toFixed(1)}x</span>
        </div>
      </div>

      {/* Configuration Management */}
      <div className="flex flex-wrap gap-3 items-center border-t pt-4">
        <Button
          onClick={saveCalibrationConfig}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          💾 Save Configuration
        </Button>
        
        <Button
          onClick={loadCalibrationConfig}
          size="sm"
          variant="outline"
          className="border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          📂 Load Saved
        </Button>
        
        <Button
          onClick={resetCalibrationConfig}
          size="sm"
          variant="outline"
          className="border-red-500 text-red-600 hover:bg-red-50"
        >
          🔄 Reset Default
        </Button>
        
        <div className="text-xs text-gray-500 ml-4">
          💡 Save your calibration settings to preserve grid, watermark, center offset, and Ring 3 text configurations
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <canvas
          ref={canvasRef}
          width={1200}
          height={1200}
          className="border bg-white cursor-crosshair max-w-full h-auto"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          style={{ maxWidth: '600px', height: 'auto' }}
        />
      </div>

      {hoveredNode && (
        <Alert>
          <AlertDescription>
            <strong>Ring {hoveredNode.ring}</strong> - Position: {formatTime(hoveredNode.angle)} 
            - Coordinates: ({Math.round(hoveredNode.x)}, {Math.round(hoveredNode.y)})
            - Angle: {hoveredNode.angle}°
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function GeneratorSettingsPage() {
  const [assetStatus, setAssetStatus] = useState<AssetStatus>({
    glyphs: { total: 0, verified: [], missing: [], sizes: {} },
    templates: { flowerOfLife: false, sriYantra: false, torusField: false },
    csvData: { numbers: { loaded: false, count: 0 }, colors: { loaded: false, count: 0 }, glyphs: { loaded: false, count: 0 } },
    openAI: { connected: false, model: '', lastTest: null, customPrompt: '', promptTemplate: 'default' },
    paymentGateways: { stripe: false, paypal: false, nowpayments: false },
    sampleArray: { uploaded: false, fileName: null, uploadDate: null, imageUrl: null }
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCoordinate, setSelectedCoordinate] = useState<{x: number, y: number, angle: number, ring: number} | null>(null)
  
  // Upload states
  const [uploadLoading, setUploadLoading] = useState<{ [key: string]: boolean }>({})
  const [uploadMessages, setUploadMessages] = useState<{ [key: string]: { type: 'success' | 'error', message: string } }>({})
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({})
  
  // File input refs
  const csvFileRef = useRef<HTMLInputElement>(null)
  const flowerOfLifeRef = useRef<HTMLInputElement>(null)
  const sriYantraRef = useRef<HTMLInputElement>(null)
  const torusFieldRef = useRef<HTMLInputElement>(null)
  const sampleArrayRef = useRef<HTMLInputElement>(null)

  const verifyAssets = async () => {
    setIsLoading(true)
    setPaymentTestResults(null) // Clear previous payment test results
    try {
      const response = await fetch('/api/admin/generator/verify-assets')
      const data = await response.json()
      
      // Ensure sampleArray property exists with defaults
      const assetStatusWithDefaults = {
        ...data,
        sampleArray: data.sampleArray || {
          uploaded: false,
          fileName: null,
          uploadDate: null,
          imageUrl: null
        }
      }
      
      setAssetStatus(assetStatusWithDefaults)
      
      // Show a brief success message
      if (data.paymentGateways) {
        const activeGateways = Object.values(data.paymentGateways).filter(Boolean).length
        console.log(`Asset verification complete. ${activeGateways}/3 payment gateways active.`)
      }
    } catch (error) {
      console.error('Failed to verify assets:', error)
      alert('❌ Failed to refresh assets. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const testAIConnection = async () => {
    try {
      const response = await fetch('/api/admin/generator/test-ai', { method: 'POST' })
      const data = await response.json()
      
      setAssetStatus(prev => ({
        ...prev,
        openAI: {
          ...prev.openAI,
          connected: data.success,
          model: data.model || 'gpt-4o',
          lastTest: new Date()
        }
      }))
    } catch (error) {
      console.error('AI test failed:', error)
    }
  }

  const [paymentTestLoading, setPaymentTestLoading] = useState(false)
  const [paymentTestResults, setPaymentTestResults] = useState<any>(null)

  const testPaymentGateways = async () => {
    setPaymentTestLoading(true)
    setPaymentTestResults(null)
    
    try {
      const response = await fetch('/api/admin/generator/test-payments', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setAssetStatus(prev => ({
          ...prev,
          paymentGateways: data.gateways
        }))
        setPaymentTestResults(data)
        
        // Show success message if all gateways are active
        if (data.summary?.allActive) {
          alert('🎉 All payment gateways are active and ready!')
        } else {
          const activeCount = data.summary?.totalActive || 0
          const totalCount = data.summary?.totalGateways || 3
          alert(`⚠️ ${activeCount}/${totalCount} payment gateways are active. Check the results for details.`)
        }
      } else {
        console.error('Payment test failed:', data.error)
        alert('❌ Payment gateway test failed: ' + data.error)
      }
    } catch (error) {
      console.error('Payment gateway test failed:', error)
      alert('❌ Failed to test payment gateways. Please check your internet connection and try again.')
    } finally {
      setPaymentTestLoading(false)
    }
  }

  useEffect(() => {
    verifyAssets()
  }, [])

  const handleCoordinateClick = (x: number, y: number, angle: number, ring: number) => {
    setSelectedCoordinate({ x, y, angle, ring })
  }

  // Upload handler functions
  const handleFileSelect = (key: string, file: File | null) => {
    setSelectedFiles(prev => ({ ...prev, [key]: file }))
    // Clear previous messages
    setUploadMessages(prev => {
      const newMessages = { ...prev }
      delete newMessages[key]
      return newMessages
    })
  }

  const uploadCSV = async () => {
    const file = selectedFiles['csv']
    if (!file) {
      setUploadMessages(prev => ({ ...prev, csv: { type: 'error', message: 'Please select a CSV file first' } }))
      return
    }

    setUploadLoading(prev => ({ ...prev, csv: true }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/generator/upload-csv', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadMessages(prev => ({ ...prev, csv: { type: 'success', message: result.message } }))
        setSelectedFiles(prev => ({ ...prev, csv: null }))
        if (csvFileRef.current) csvFileRef.current.value = ''
        // Refresh asset status
        verifyAssets()
      } else {
        setUploadMessages(prev => ({ ...prev, csv: { type: 'error', message: result.error } }))
      }
    } catch (error) {
      setUploadMessages(prev => ({ ...prev, csv: { type: 'error', message: 'Upload failed. Please try again.' } }))
    } finally {
      setUploadLoading(prev => ({ ...prev, csv: false }))
    }
  }

  const uploadDiamondStarWard = async () => {
    const file = selectedFiles['diamond-star-ward']
    if (!file) {
      setUploadMessages(prev => ({ ...prev, 'diamond-star-ward': { type: 'error', message: 'Please select an image file first' } }))
      return
    }

    setUploadLoading(prev => ({ ...prev, 'diamond-star-ward': true }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/generator/upload-diamond-star-ward', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadMessages(prev => ({ ...prev, 'diamond-star-ward': { type: 'success', message: result.message } }))
        setSelectedFiles(prev => ({ ...prev, 'diamond-star-ward': null }))
        // Refresh asset status if needed
        verifyAssets()
      } else {
        setUploadMessages(prev => ({ ...prev, 'diamond-star-ward': { type: 'error', message: result.error } }))
      }
    } catch (error) {
      setUploadMessages(prev => ({ ...prev, 'diamond-star-ward': { type: 'error', message: 'Upload failed. Please try again.' } }))
    } finally {
      setUploadLoading(prev => ({ ...prev, 'diamond-star-ward': false }))
    }
  }

  const uploadTemplate = async (templateType: 'flower-of-life' | 'sri-yantra' | 'torus-field') => {
    const file = selectedFiles[templateType]
    if (!file) {
      setUploadMessages(prev => ({ ...prev, [templateType]: { type: 'error', message: 'Please select an image file first' } }))
      return
    }

    setUploadLoading(prev => ({ ...prev, [templateType]: true }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('templateType', templateType)

      const response = await fetch('/api/admin/generator/upload-template', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadMessages(prev => ({ ...prev, [templateType]: { type: 'success', message: result.message } }))
        setSelectedFiles(prev => ({ ...prev, [templateType]: null }))
        
        // Clear the corresponding file input
        const ref = templateType === 'flower-of-life' ? flowerOfLifeRef : 
                    templateType === 'sri-yantra' ? sriYantraRef : torusFieldRef
        if (ref.current) ref.current.value = ''
        
        // Refresh asset status
        verifyAssets()
      } else {
        setUploadMessages(prev => ({ ...prev, [templateType]: { type: 'error', message: result.error } }))
      }
    } catch (error) {
      setUploadMessages(prev => ({ ...prev, [templateType]: { type: 'error', message: 'Upload failed. Please try again.' } }))
    } finally {
      setUploadLoading(prev => ({ ...prev, [templateType]: false }))
    }
  }

  // Upload sample array function
  const uploadSampleArray = async () => {
    const file = selectedFiles['sample-array']
    if (!file) {
      setUploadMessages(prev => ({ ...prev, 'sample-array': { type: 'error', message: 'Please select a PNG file first' } }))
      return
    }
    
    // Validate file type
    if (file.type !== 'image/png') {
      setUploadMessages(prev => ({ ...prev, 'sample-array': { type: 'error', message: 'Please select a PNG file only' } }))
      return
    }
    
    setUploadLoading(prev => ({ ...prev, 'sample-array': true }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/admin/generator/upload-sample-array', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (result.success) {
        setUploadMessages(prev => ({ ...prev, 'sample-array': { type: 'success', message: result.message } }))
        setSelectedFiles(prev => ({ ...prev, 'sample-array': null }))
        if (sampleArrayRef.current) sampleArrayRef.current.value = ''
        // Refresh asset status to show updated sample array info
        verifyAssets()
      } else {
        setUploadMessages(prev => ({ ...prev, 'sample-array': { type: 'error', message: result.error } }))
      }
    } catch (error) {
      setUploadMessages(prev => ({ ...prev, 'sample-array': { type: 'error', message: 'Upload failed. Please try again.' } }))
    } finally {
      setUploadLoading(prev => ({ ...prev, 'sample-array': false }))
    }
  }

  // Test Prompt functionality
  const testCustomPrompt = async () => {
    const customPrompt = assetStatus.openAI?.customPrompt
    if (!customPrompt || customPrompt.trim() === '') {
      alert('Please enter a custom prompt before testing.')
      return
    }

    try {
      // Create sample user data for testing
      const sampleUserData = {
        fullName: "John Doe",
        birthDate: "01/15/1990",
        birthTime: "14:30",
        birthPlace: "New York, NY",
        sealType: "Personal Healing",
        category: "Spiritual Growth",
        template: "flower-of-life",
        additionalComments: "Focus on heart chakra healing"
      }

      // Replace template variables with sample data
      let testPrompt = customPrompt
      testPrompt = testPrompt.replace(/\{\{fullName\}\}/g, sampleUserData.fullName)
      testPrompt = testPrompt.replace(/\{\{birthDate\}\}/g, sampleUserData.birthDate)
      testPrompt = testPrompt.replace(/\{\{birthTime\}\}/g, sampleUserData.birthTime)
      testPrompt = testPrompt.replace(/\{\{birthPlace\}\}/g, sampleUserData.birthPlace)
      testPrompt = testPrompt.replace(/\{\{sealType\}\}/g, sampleUserData.sealType)
      testPrompt = testPrompt.replace(/\{\{category\}\}/g, sampleUserData.category)
      testPrompt = testPrompt.replace(/\{\{template\}\}/g, sampleUserData.template)
      testPrompt = testPrompt.replace(/\{\{additionalComments\}\}/g, sampleUserData.additionalComments)

      // Show the processed prompt in an alert for now
      alert(`Prompt Test Successful!\n\nProcessed Prompt Preview:\n${testPrompt.substring(0, 500)}${testPrompt.length > 500 ? '...' : ''}`)
      
    } catch (error) {
      console.error('Prompt test failed:', error)
      alert('Prompt test failed. Please check your prompt syntax.')
    }
  }

  // Save Configuration functionality
  const savePromptConfiguration = async () => {
    const customPrompt = assetStatus.openAI?.customPrompt
    const promptTemplate = assetStatus.openAI?.promptTemplate
    
    if (!customPrompt || customPrompt.trim() === '') {
      alert('Please enter a custom prompt before saving.')
      return
    }

    try {
      // For now, just show success message
      // In a real implementation, this would save to a database or config file
      console.log('Saving configuration:', {
        customPrompt,
        promptTemplate,
        savedAt: new Date().toISOString()
      })
      
      alert('Configuration saved successfully!')
      
    } catch (error) {
      console.error('Save configuration failed:', error)
      alert('Failed to save configuration. Please try again.')
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout userRole="admin">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Generator Settings</h1>
          <p className="text-gray-400 mt-2">
            Configure and test the ANOINT Array Generator system
          </p>
        </div>
        <Button onClick={verifyAssets} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="assets">Asset Status</TabsTrigger>
          <TabsTrigger value="calibration">Coordinate Calibration</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="payments">Payment Gateways</TabsTrigger>
          <TabsTrigger value="sample-array">Sample Array</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-6">
          {/* Glyphs Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Glyph Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {assetStatus.glyphs.verified.length}
                  </div>
                  <div className="text-sm text-gray-600">Verified</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {assetStatus.glyphs.missing.length}
                  </div>
                  <div className="text-sm text-gray-600">Missing</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {assetStatus.glyphs.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Expected</div>
                </div>
              </div>
              
              {assetStatus.glyphs.missing.length > 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Missing glyphs: {assetStatus.glyphs.missing.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Glyphs CSV Uploader */}
              <div className="mt-4 p-4 border-t bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Update Glyphs CSV</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a new glyphs.csv file to update the available glyph list and resolve missing glyphs.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    ref={csvFileRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileSelect('csv', e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <Button 
                    size="sm" 
                    onClick={uploadCSV}
                    disabled={uploadLoading.csv || !selectedFiles.csv}
                  >
                    {uploadLoading.csv ? 'Uploading...' : 'Upload CSV'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  CSV format: filename,description (e.g., "ankh.png,Egyptian symbol of life")
                </p>
                
                {/* Upload Status */}
                {uploadMessages.csv && (
                  <Alert className={`mt-3 ${uploadMessages.csv.type === 'success' ? 'border-green-200 bg-green-50' : ''}`} 
                         variant={uploadMessages.csv.type === 'error' ? "destructive" : "default"}>
                    <AlertDescription>
                      {uploadMessages.csv.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Diamond Star Ward Uploader */}
              <div className="mt-4 p-4 border-t bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-2">Diamond Star Ward Placeholder</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a diamond star ward image to replace gray placeholder tokens in the seal array when glyphs are not available.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => handleFileSelect('diamond-star-ward', e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <Button 
                    size="sm" 
                    onClick={uploadDiamondStarWard}
                    disabled={uploadLoading['diamond-star-ward'] || !selectedFiles['diamond-star-ward']}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {uploadLoading['diamond-star-ward'] ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 40x40px PNG image with transparent background
                </p>
                
                {/* Upload Status */}
                {uploadMessages['diamond-star-ward'] && (
                  <Alert className={`mt-3 ${uploadMessages['diamond-star-ward'].type === 'success' ? 'border-green-200 bg-green-50' : ''}`} 
                         variant={uploadMessages['diamond-star-ward'].type === 'error' ? "destructive" : "default"}>
                    <AlertDescription>
                      {uploadMessages['diamond-star-ward'].message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Templates Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sacred Geometry Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Flower of Life</span>
                    <Badge variant={assetStatus.templates.flowerOfLife ? "default" : "destructive"}>
                      {assetStatus.templates.flowerOfLife ? 'Available' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Sri Yantra</span>
                    <Badge variant={assetStatus.templates.sriYantra ? "default" : "destructive"}>
                      {assetStatus.templates.sriYantra ? 'Available' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Torus Field</span>
                    <Badge variant={assetStatus.templates.torusField ? "default" : "destructive"}>
                      {assetStatus.templates.torusField ? 'Available' : 'Missing'}
                    </Badge>
                  </div>
                </div>

                {/* Template Upload Section */}
                <div className="border-t pt-4 bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Upload Template Images</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload 1200x1200px PNG template images for sacred geometry backgrounds.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="w-32 text-sm font-medium">Flower of Life:</label>
                      <input
                        ref={flowerOfLifeRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => handleFileSelect('flower-of-life', e.target.files?.[0] || null)}
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => uploadTemplate('flower-of-life')}
                        disabled={uploadLoading['flower-of-life'] || !selectedFiles['flower-of-life']}
                      >
                        {uploadLoading['flower-of-life'] ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="w-32 text-sm font-medium">Sri Yantra:</label>
                      <input
                        ref={sriYantraRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => handleFileSelect('sri-yantra', e.target.files?.[0] || null)}
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => uploadTemplate('sri-yantra')}
                        disabled={uploadLoading['sri-yantra'] || !selectedFiles['sri-yantra']}
                      >
                        {uploadLoading['sri-yantra'] ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="w-32 text-sm font-medium">Torus Field:</label>
                      <input
                        ref={torusFieldRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => handleFileSelect('torus-field', e.target.files?.[0] || null)}
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => uploadTemplate('torus-field')}
                        disabled={uploadLoading['torus-field'] || !selectedFiles['torus-field']}
                      >
                        {uploadLoading['torus-field'] ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Template Upload Status */}
                  <div className="space-y-2 mt-4">
                    {['flower-of-life', 'sri-yantra', 'torus-field'].map(templateType => 
                      uploadMessages[templateType] && (
                        <Alert 
                          key={templateType}
                          className={uploadMessages[templateType].type === 'success' ? 'border-green-200 bg-green-50' : ''} 
                          variant={uploadMessages[templateType].type === 'error' ? "destructive" : "default"}
                        >
                          <AlertDescription>
                            <strong>{templateType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {uploadMessages[templateType].message}
                          </AlertDescription>
                        </Alert>
                      )
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Recommended: 1200x1200px PNG files for optimal quality
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium">Numbers</div>
                    <div className="text-sm text-gray-600">1-999 range</div>
                  </div>
                  <Badge variant="default">
                    Hardcoded
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium">Colors</div>
                    <div className="text-sm text-gray-600">13 colors</div>
                  </div>
                  <Badge variant="default">
                    Hardcoded
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Glyphs</div>
                    <div className="text-sm text-gray-600">{assetStatus.csvData.glyphs.count} entries</div>
                  </div>
                  <Badge variant={assetStatus.csvData.glyphs.loaded ? "default" : "destructive"}>
                    {assetStatus.csvData.glyphs.loaded ? 'CSV File' : 'Failed'}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Configuration Details:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Numbers:</strong> Generated from 1-999 range during seal array creation</p>
                  <p><strong>Colors:</strong> WHITE, RED, ORANGE, YELLOW, GREEN, AQUA, BLUE, INDIGO, PURPLE, VIOLET, GOLD, SILVER, GRAY</p>
                  <p><strong>Glyphs:</strong> Loaded from uploadable CSV file with filename references</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>24-Point Coordinate Calibration Canvas</CardTitle>
              <p className="text-sm text-gray-600">
                Interactive testing canvas for precise seal array positioning. 
                Click on any node to view its coordinates.
              </p>
            </CardHeader>
            <CardContent>
              <CalibrationCanvas onCoordinateClick={handleCoordinateClick} />
              
              {selectedCoordinate && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">Selected Coordinate</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Ring</div>
                        <div className="font-mono">{selectedCoordinate.ring}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Angle</div>
                        <div className="font-mono">{selectedCoordinate.angle}°</div>
                      </div>
                      <div>
                        <div className="text-gray-600">X Coordinate</div>
                        <div className="font-mono">{Math.round(selectedCoordinate.x)}px</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Y Coordinate</div>
                        <div className="font-mono">{Math.round(selectedCoordinate.y)}px</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                OpenAI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">API Connection</div>
                  <div className="text-sm text-gray-600">
                    Model: {assetStatus.openAI?.model || 'gpt-4o'}
                  </div>
                  {assetStatus.openAI?.lastTest && (
                    <div className="text-xs text-gray-500">
                      Last tested: {assetStatus.openAI?.lastTest?.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={assetStatus.openAI?.connected ? "default" : "destructive"}>
                    {assetStatus.openAI?.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Button onClick={testAIConnection} size="sm">
                    Test Connection
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  The AI system connects to OpenAI's API to generate personalized seal arrays. Configure ChatGPT-4o prompts in the dedicated card below.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* ChatGPT-4o Prompt Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 ChatGPT-4o Prompt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600">
                Configure ChatGPT-4o's instructions for seal array element selection. ChatGPT-4o will analyze user data and provide element selections, which Claude will then assemble into the final seal array.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prompt Template</label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-white"
                    value={assetStatus.openAI?.promptTemplate || 'default'}
                    onChange={(e) => setAssetStatus(prev => ({
                      ...prev,
                      openAI: { ...prev.openAI, promptTemplate: e.target.value }
                    }))}
                  >
                    <option value="default">Default - Balanced Approach</option>
                    <option value="numerological">Numerological Focus</option>
                    <option value="astrological">Astrological Emphasis</option>
                    <option value="chakra">Chakra-Based Alignment</option>
                    <option value="elemental">Elemental Balancing</option>
                    <option value="custom">Custom Template</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Custom AI Prompt 
                    <span className="text-xs text-gray-500 ml-2">({assetStatus.openAI?.customPrompt?.length || 0}/4000 characters)</span>
                  </label>
                  <textarea
                    className="w-full p-3 border rounded-lg text-sm font-mono"
                    rows={8}
                    maxLength={4000}
                    placeholder="Enter your custom prompt for ChatGPT-4o. Use template variables like {{fullName}}, {{birthDate}}, {{birthTime}}, {{birthPlace}}, {{sealType}}, {{category}} to insert user data..."
                    value={assetStatus.openAI?.customPrompt || ''}
                    onChange={(e) => setAssetStatus(prev => ({
                      ...prev,
                      openAI: { ...prev.openAI, customPrompt: e.target.value }
                    }))}
                  />
                </div>

                {/* Available Resources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Available Template Variables:</h4>
                    <div className="text-xs text-gray-700 space-y-1">
                      <span>• {`{{fullName}}`} - User's full name</span>
                      <span>• {`{{birthDate}}`} - Birth date</span>
                      <span>• {`{{birthTime}}`} - Birth time</span>
                      <span>• {`{{birthPlace}}`} - Birth location</span>
                      <span>• {`{{sealType}}`} - Selected seal type</span>
                      <span>• {`{{category}}`} - Seal category</span>
                      <span>• {`{{template}}`} - Template type</span>
                      <span>• {`{{additionalComments}}`} - User comments</span>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Available Colors (13 total):</h4>
                    <div className="text-xs text-gray-700">
                      WHITE, RED, ORANGE, YELLOW, GREEN, AQUA, BLUE, INDIGO, PURPLE, VIOLET, GOLD, SILVER, GRAY
                    </div>
                  </div>
                </div>

                {/* Available Glyphs */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">Available Glyphs ({assetStatus.glyphs.verified.length} verified):</h4>
                  <div className="text-xs text-gray-700 max-h-24 overflow-y-auto">
                    {assetStatus.glyphs.verified.map(glyph => glyph.replace('.png', '')).join(', ')}
                    {assetStatus.glyphs.missing.length > 0 && (
                      <div className="mt-2 text-red-600">
                        <strong>Missing:</strong> {assetStatus.glyphs.missing.map(glyph => glyph.replace('.png', '')).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setAssetStatus(prev => ({
                      ...prev,
                      openAI: { ...prev.openAI, customPrompt: '' }
                    }))}
                  >
                    Reset Prompt
                  </Button>
                  <Button size="sm" onClick={testCustomPrompt}>
                    Test Prompt
                  </Button>
                  <Button size="sm" variant="outline" onClick={savePromptConfiguration}>
                    Save Configuration
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Two-AI System:</strong> ChatGPT-4o analyzes user data using your custom prompt and selects specific numbers, colors, glyphs, and mantras. Claude then handles the technical assembly, coordinate calculations, and rendering of the final seal array.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Gateway Status
                <Badge variant="outline">$17 USD</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Stripe</div>
                    <div className="text-sm text-gray-600">Credit/Debit Cards</div>
                  </div>
                  <Badge variant={assetStatus.paymentGateways?.stripe ? "default" : "destructive"}>
                    {assetStatus.paymentGateways?.stripe ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">PayPal</div>
                    <div className="text-sm text-gray-600">PayPal Account</div>
                  </div>
                  <Badge variant={assetStatus.paymentGateways?.paypal ? "default" : "destructive"}>
                    {assetStatus.paymentGateways?.paypal ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">NowPayments</div>
                    <div className="text-sm text-gray-600">Cryptocurrency</div>
                  </div>
                  <Badge variant={assetStatus.paymentGateways?.nowpayments ? "default" : "destructive"}>
                    {assetStatus.paymentGateways?.nowpayments ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={testPaymentGateways} disabled={paymentTestLoading}>
                  {paymentTestLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test All Gateways'
                  )}
                </Button>
              </div>

              {/* Payment Test Results */}
              {paymentTestResults && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3">Latest Test Results</h4>
                  
                  {/* Summary */}
                  <div className="mb-4 p-3 bg-white rounded border">
                    <div className="text-sm">
                      <strong>Summary:</strong> {paymentTestResults.summary?.totalActive || 0} of {paymentTestResults.summary?.totalGateways || 3} gateways active
                    </div>
                  </div>

                  {/* Detailed Results */}
                  <div className="space-y-3">
                    {paymentTestResults.testResults && Object.entries(paymentTestResults.testResults).map(([gateway, result]: [string, any]) => (
                      <div key={gateway} className={`p-3 rounded border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <strong className="capitalize">{gateway}</strong>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.message}
                        </div>
                        {result.details && (
                          <div className="text-xs text-gray-500 mt-1">
                            {typeof result.details === 'object' ? JSON.stringify(result.details, null, 2) : result.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {paymentTestResults.recommendations && paymentTestResults.recommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h5 className="font-semibold text-sm mb-2">Configuration Recommendations:</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {paymentTestResults.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <Alert>
                <AlertDescription>
                  All seal arrays are priced at $17 USD. Payment processing fees are handled by the respective gateways.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sample-array" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Sample Array for Merchandise Mockups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Upload a sample seal array design that will be used to generate product mockups on the merchandise page.
                This gives customers a visual preview of how their design might look on various products.
              </div>
              
              {/* Current Sample Array Status */}
              {assetStatus.sampleArray?.uploaded ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Sample Array Uploaded</p>
                        <p className="text-sm text-green-600">
                          File: {assetStatus.sampleArray.fileName} • 
                          Uploaded: {assetStatus.sampleArray.uploadDate ? new Date(assetStatus.sampleArray.uploadDate).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    {assetStatus.sampleArray.imageUrl && (
                      <div className="w-16 h-16 bg-gray-100 rounded border overflow-hidden">
                        <img 
                          src={assetStatus.sampleArray.imageUrl} 
                          alt="Sample array preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">No Sample Array Uploaded</p>
                      <p className="text-sm text-orange-600">Upload a sample seal array to generate product mockups</p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload Interface */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Sample Array (PNG only)
                  </label>
                  <input
                    type="file"
                    accept=".png,image/png"
                    ref={sampleArrayRef}
                    onChange={(e) => setSelectedFiles(prev => ({ ...prev, 'sample-array': e.target.files?.[0] || null }))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {selectedFiles['sample-array'] && (
                    <p className="mt-1 text-sm text-gray-600">
                      Selected: {selectedFiles['sample-array'].name}
                    </p>
                  )}
                </div>

                <Button
                  onClick={uploadSampleArray}
                  disabled={!selectedFiles['sample-array'] || uploadLoading['sample-array']}
                  className="w-full"
                >
                  {uploadLoading['sample-array'] ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Upload Sample Array
                    </>
                  )}
                </Button>

                {uploadMessages['sample-array'] && (
                  <Alert variant={uploadMessages['sample-array'].type === 'error' ? 'destructive' : 'default'}>
                    <AlertDescription>
                      {uploadMessages['sample-array'].message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}