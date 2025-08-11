'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { 
  DocumentArrowUpIcon,
  SparklesIcon,
  PhotoIcon,
  CloudArrowDownIcon,
  EyeIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface GeneratorConfig {
  name: string
  description: string
  pattern_type: 'geometric' | 'sigil' | 'mandala' | 'rune' | 'custom'
  dimensions: {
    width: number
    height: number
  }
  style: {
    color_scheme: 'monochrome' | 'dual_tone' | 'rainbow' | 'custom'
    primary_color: string
    secondary_color?: string
    background_color: string
  }
  complexity: 'simple' | 'medium' | 'complex' | 'master'
  elements: {
    include_text: boolean
    text_content?: string
    include_symbols: boolean
    symbol_count: number
    geometric_shapes: boolean
  }
  metadata: {
    intention?: string
    purpose?: string
    energy_type?: string
  }
}

interface ParsedGlyph {
  id: string
  name: string
  symbol: string
  meaning: string
  position_x: number
  position_y: number
  size: number
  rotation: number
  color?: string
  valid: boolean
  errors?: string[]
}

interface GenerationResult {
  id: string
  status: 'generating' | 'completed' | 'failed'
  svg_url?: string
  thumbnail_url?: string
  preview_data?: string
  message?: string
  error?: string
}

const PATTERN_TYPES = [
  { value: 'geometric', label: 'Geometric Patterns', description: 'Sacred geometry and mathematical designs' },
  { value: 'sigil', label: 'Sigils', description: 'Personal intention symbols' },
  { value: 'mandala', label: 'Mandalas', description: 'Circular meditation patterns' },
  { value: 'rune', label: 'Runic Arrays', description: 'Ancient runic combinations' },
  { value: 'custom', label: 'Custom Design', description: 'Upload your own glyph data' }
]

const COLOR_SCHEMES = [
  { value: 'monochrome', label: 'Monochrome', colors: ['#FFFFFF', '#000000'] },
  { value: 'dual_tone', label: 'Dual Tone', colors: ['#8B5CF6', '#06B6D4'] },
  { value: 'rainbow', label: 'Rainbow', colors: ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'] },
  { value: 'custom', label: 'Custom', colors: ['#CUSTOM'] }
]

const COMPLEXITY_LEVELS = [
  { value: 'simple', label: 'Simple', description: '3-7 elements, basic patterns' },
  { value: 'medium', label: 'Medium', description: '8-15 elements, intermediate complexity' },
  { value: 'complex', label: 'Complex', description: '16-30 elements, advanced patterns' },
  { value: 'master', label: 'Master', description: '31+ elements, maximum complexity' }
]

export default function GeneratorPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'config' | 'upload' | 'preview' | 'generate'>('config')
  
  const [config, setConfig] = useState<GeneratorConfig>({
    name: '',
    description: '',
    pattern_type: 'geometric',
    dimensions: { width: 800, height: 600 },
    style: {
      color_scheme: 'monochrome',
      primary_color: '#8B5CF6',
      secondary_color: '#06B6D4',
      background_color: '#000000'
    },
    complexity: 'medium',
    elements: {
      include_text: false,
      text_content: '',
      include_symbols: true,
      symbol_count: 12,
      geometric_shapes: true
    },
    metadata: {
      intention: '',
      purpose: '',
      energy_type: ''
    }
  })
  
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedGlyphs, setParsedGlyphs] = useState<ParsedGlyph[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [previewData, setPreviewData] = useState<string>('')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login?redirectTo=/generator')
      return
    }
    setUser(session.user)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvErrors(['Please upload a valid CSV file'])
      return
    }

    setCsvFile(file)
    setCsvErrors([])
    
    // Parse CSV file
    const text = await file.text()
    await parseCSV(text)
  }

  const parseCSV = async (csvText: string) => {
    try {
      const lines = csvText.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Validate required headers
      const requiredHeaders = ['name', 'symbol', 'meaning', 'position_x', 'position_y']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        setCsvErrors([`Missing required columns: ${missingHeaders.join(', ')}`])
        return
      }

      const glyphs: ParsedGlyph[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = line.split(',').map(v => v.trim())
        const glyph: ParsedGlyph = {
          id: `glyph_${i}`,
          name: values[headers.indexOf('name')] || `Glyph ${i}`,
          symbol: values[headers.indexOf('symbol')] || '◯',
          meaning: values[headers.indexOf('meaning')] || '',
          position_x: parseFloat(values[headers.indexOf('position_x')]) || 0,
          position_y: parseFloat(values[headers.indexOf('position_y')]) || 0,
          size: parseFloat(values[headers.indexOf('size')]) || 20,
          rotation: parseFloat(values[headers.indexOf('rotation')]) || 0,
          color: values[headers.indexOf('color')] || config.style.primary_color,
          valid: true,
          errors: []
        }

        // Validate glyph data
        if (isNaN(glyph.position_x) || isNaN(glyph.position_y)) {
          glyph.valid = false
          glyph.errors!.push('Invalid position coordinates')
        }
        
        if (glyph.position_x < 0 || glyph.position_x > 100 || glyph.position_y < 0 || glyph.position_y > 100) {
          glyph.valid = false
          glyph.errors!.push('Positions must be between 0-100 (percentage)')
        }

        if (!glyph.symbol || glyph.symbol.length === 0) {
          glyph.valid = false
          glyph.errors!.push('Symbol is required')
        }

        if (glyph.errors!.length > 0) {
          errors.push(`Row ${i + 1}: ${glyph.errors!.join(', ')}`)
        }

        glyphs.push(glyph)
      }

      setParsedGlyphs(glyphs)
      setCsvErrors(errors)
      
      if (errors.length === 0) {
        setStep('preview')
        generatePreview(glyphs)
      }

    } catch (error) {
      console.error('Error parsing CSV:', error)
      setCsvErrors(['Failed to parse CSV file. Please check the format.'])
    }
  }

  const generatePreview = async (glyphs: ParsedGlyph[]) => {
    // Create a simple SVG preview
    const { width, height } = config.dimensions
    const validGlyphs = glyphs.filter(g => g.valid)
    
    let svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${config.style.background_color}"/>
    `

    validGlyphs.forEach(glyph => {
      const x = (glyph.position_x / 100) * width
      const y = (glyph.position_y / 100) * height
      const transform = glyph.rotation ? `rotate(${glyph.rotation} ${x} ${y})` : ''
      
      svgContent += `
        <text x="${x}" y="${y}" 
              font-size="${glyph.size}" 
              fill="${glyph.color || config.style.primary_color}"
              text-anchor="middle" 
              dominant-baseline="central"
              transform="${transform}">
          ${glyph.symbol}
        </text>
      `
    })

    svgContent += '</svg>'
    setPreviewData(`data:image/svg+xml;base64,${btoa(svgContent)}`)
  }

  const startGeneration = async () => {
    if (!user) return

    setLoading(true)
    setStep('generate')
    
    try {
      const generationData = {
        user_id: user.id,
        config: config,
        glyphs: config.pattern_type === 'custom' ? parsedGlyphs.filter(g => g.valid) : undefined
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-array`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(generationData)
      })

      if (response.ok) {
        const result = await response.json()
        setGenerationResult(result)
        
        // Poll for completion if still generating
        if (result.status === 'generating') {
          pollGenerationStatus(result.id)
        }
      } else {
        const errorData = await response.json()
        setGenerationResult({
          id: 'error',
          status: 'failed',
          error: errorData.message || 'Generation failed'
        })
      }
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationResult({
        id: 'error',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Generation failed'
      })
    } finally {
      setLoading(false)
    }
  }

  const pollGenerationStatus = async (arrayId: string) => {
    const maxAttempts = 30 // 5 minutes max
    let attempts = 0
    
    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('arrays')
          .select('id, status, svg_url, thumbnail_url, error_message')
          .eq('id', arrayId)
          .single()

        if (error) throw error

        if (data.status === 'completed') {
          setGenerationResult({
            id: data.id,
            status: 'completed',
            svg_url: data.svg_url,
            thumbnail_url: data.thumbnail_url
          })
          return
        }

        if (data.status === 'failed') {
          setGenerationResult({
            id: data.id,
            status: 'failed',
            error: data.error_message || 'Generation failed'
          })
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000) // Poll every 10 seconds
        } else {
          setGenerationResult({
            id: arrayId,
            status: 'failed',
            error: 'Generation timeout - please try again'
          })
        }
      } catch (error) {
        console.error('Polling error:', error)
        setGenerationResult({
          id: arrayId,
          status: 'failed',
          error: 'Failed to check generation status'
        })
      }
    }

    setTimeout(poll, 5000) // Start polling after 5 seconds
  }

  const resetGenerator = () => {
    setStep('config')
    setCsvFile(null)
    setParsedGlyphs([])
    setCsvErrors([])
    setGenerationResult(null)
    setPreviewData('')
  }

  const downloadResult = async () => {
    if (!generationResult?.svg_url) return

    try {
      const response = await fetch(generationResult.svg_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.name || 'mystical-array'}.svg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading generator...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">Mystical Array Generator</h1>
          <p className="text-gray-400">Create powerful symbolic arrays with ancient wisdom</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['config', 'upload', 'preview', 'generate'].map((stepName, index) => {
              const isActive = step === stepName
              const isCompleted = ['config', 'upload', 'preview', 'generate'].indexOf(step) > index
              const shouldShow = config.pattern_type === 'custom' || stepName !== 'upload'
              
              if (!shouldShow) return null

              return (
                <div key={stepName} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isActive ? 'border-purple-500 bg-purple-600' :
                    isCompleted ? 'border-green-500 bg-green-600' :
                    'border-gray-600 bg-gray-800'
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm ${
                    isActive ? 'text-purple-400' :
                    isCompleted ? 'text-green-400' :
                    'text-gray-500'
                  }`}>
                    {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
                  </span>
                  {index < 3 && <div className="w-8 h-px bg-gray-600 ml-4" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Configuration Step */}
        {step === 'config' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <CogIcon className="h-6 w-6 text-purple-400 mr-2" />
                Array Configuration
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Array Name</label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig({...config, name: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="My Mystical Array"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={config.description}
                      onChange={(e) => setConfig({...config, description: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      rows={3}
                      placeholder="Describe the purpose and intention of your array..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Pattern Type</label>
                    <div className="space-y-2">
                      {PATTERN_TYPES.map(type => (
                        <label key={type.value} className="flex items-start p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-purple-500">
                          <input
                            type="radio"
                            name="pattern_type"
                            value={type.value}
                            checked={config.pattern_type === type.value}
                            onChange={(e) => setConfig({...config, pattern_type: e.target.value as any})}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <span className="font-medium">{type.label}</span>
                            <p className="text-gray-400 text-sm">{type.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Style & Complexity */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Dimensions</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
                        <input
                          type="number"
                          value={config.dimensions.width}
                          onChange={(e) => setConfig({
                            ...config, 
                            dimensions: {...config.dimensions, width: parseInt(e.target.value) || 800}
                          })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                          min="400"
                          max="2000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
                        <input
                          type="number"
                          value={config.dimensions.height}
                          onChange={(e) => setConfig({
                            ...config, 
                            dimensions: {...config.dimensions, height: parseInt(e.target.value) || 600}
                          })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                          min="400"
                          max="2000"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Color Scheme</label>
                    <select
                      value={config.style.color_scheme}
                      onChange={(e) => setConfig({
                        ...config, 
                        style: {...config.style, color_scheme: e.target.value as any}
                      })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                    >
                      {COLOR_SCHEMES.map(scheme => (
                        <option key={scheme.value} value={scheme.value}>
                          {scheme.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Primary Color</label>
                      <input
                        type="color"
                        value={config.style.primary_color}
                        onChange={(e) => setConfig({
                          ...config, 
                          style: {...config.style, primary_color: e.target.value}
                        })}
                        className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Secondary Color</label>
                      <input
                        type="color"
                        value={config.style.secondary_color}
                        onChange={(e) => setConfig({
                          ...config, 
                          style: {...config.style, secondary_color: e.target.value}
                        })}
                        className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Background</label>
                      <input
                        type="color"
                        value={config.style.background_color}
                        onChange={(e) => setConfig({
                          ...config, 
                          style: {...config.style, background_color: e.target.value}
                        })}
                        className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Complexity Level</label>
                    <div className="space-y-2">
                      {COMPLEXITY_LEVELS.map(level => (
                        <label key={level.value} className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-purple-500">
                          <input
                            type="radio"
                            name="complexity"
                            value={level.value}
                            checked={config.complexity === level.value}
                            onChange={(e) => setConfig({...config, complexity: e.target.value as any})}
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">{level.label}</span>
                            <p className="text-gray-400 text-sm">{level.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Mystical Properties (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Intention</label>
                    <input
                      type="text"
                      value={config.metadata.intention}
                      onChange={(e) => setConfig({
                        ...config, 
                        metadata: {...config.metadata, intention: e.target.value}
                      })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Protection, Healing, Manifestation..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Purpose</label>
                    <input
                      type="text"
                      value={config.metadata.purpose}
                      onChange={(e) => setConfig({
                        ...config, 
                        metadata: {...config.metadata, purpose: e.target.value}
                      })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Meditation, Ritual, Daily Carry..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Energy Type</label>
                    <input
                      type="text"
                      value={config.metadata.energy_type}
                      onChange={(e) => setConfig({
                        ...config, 
                        metadata: {...config.metadata, energy_type: e.target.value}
                      })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Solar, Lunar, Elemental..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => router.push('/member/dashboard')}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  if (config.pattern_type === 'custom') {
                    setStep('upload')
                  } else {
                    setStep('preview')
                    generatePreview([]) // Generate preview for automatic patterns
                  }
                }}
                disabled={!config.name.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                Next: {config.pattern_type === 'custom' ? 'Upload Data' : 'Preview'}
              </button>
            </div>
          </div>
        )}

        {/* Upload Step (Custom patterns only) */}
        {step === 'upload' && config.pattern_type === 'custom' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <DocumentArrowUpIcon className="h-6 w-6 text-purple-400 mr-2" />
                Upload Glyph Data
              </h2>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <DocumentArrowUpIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-gray-400 mb-4">
                  Upload a CSV file containing your glyph data with the following columns:
                  <br />
                  <code className="text-purple-400">name, symbol, meaning, position_x, position_y, size, rotation, color</code>
                </p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
                >
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  <span>Choose CSV File</span>
                </button>
              </div>

              {/* CSV Errors */}
              {csvErrors.length > 0 && (
                <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                  <div className="flex items-center mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <h4 className="font-semibold text-red-400">CSV Errors</h4>
                  </div>
                  <ul className="text-red-300 text-sm space-y-1">
                    {csvErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Glyphs Preview */}
              {parsedGlyphs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Parsed Glyphs ({parsedGlyphs.filter(g => g.valid).length} valid, {parsedGlyphs.filter(g => !g.valid).length} invalid)
                  </h3>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {parsedGlyphs.map((glyph, index) => (
                        <div key={glyph.id} className={`p-3 rounded-lg border ${
                          glyph.valid ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{glyph.symbol}</span>
                              <div>
                                <span className="font-medium">{glyph.name}</span>
                                <p className="text-sm text-gray-400">{glyph.meaning}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400">
                                Position: ({glyph.position_x}, {glyph.position_y})
                              </p>
                              {!glyph.valid && (
                                <p className="text-red-400 text-xs">{glyph.errors?.join(', ')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('config')}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                Back
              </button>
              
              <button
                onClick={() => setStep('preview')}
                disabled={parsedGlyphs.filter(g => g.valid).length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                Next: Preview Array
              </button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <EyeIcon className="h-6 w-6 text-purple-400 mr-2" />
                Array Preview
              </h2>

              {/* Preview Image */}
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <div className="flex justify-center">
                  {previewData ? (
                    <img
                      src={previewData}
                      alt="Array Preview"
                      className="max-w-full max-h-96 rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-96 h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <SparklesIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">Generating preview...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuration Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Array Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Name:</span> {config.name}</div>
                    <div><span className="text-gray-400">Type:</span> {PATTERN_TYPES.find(t => t.value === config.pattern_type)?.label}</div>
                    <div><span className="text-gray-400">Dimensions:</span> {config.dimensions.width} × {config.dimensions.height}px</div>
                    <div><span className="text-gray-400">Complexity:</span> {COMPLEXITY_LEVELS.find(c => c.value === config.complexity)?.label}</div>
                    {config.pattern_type === 'custom' && (
                      <div><span className="text-gray-400">Glyphs:</span> {parsedGlyphs.filter(g => g.valid).length} elements</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Style & Colors</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Color Scheme:</span> {COLOR_SCHEMES.find(c => c.value === config.style.color_scheme)?.label}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Primary:</span>
                      <div className="w-6 h-6 rounded-full border border-gray-600" style={{backgroundColor: config.style.primary_color}}></div>
                      <span>{config.style.primary_color}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Secondary:</span>
                      <div className="w-6 h-6 rounded-full border border-gray-600" style={{backgroundColor: config.style.secondary_color}}></div>
                      <span>{config.style.secondary_color}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Background:</span>
                      <div className="w-6 h-6 rounded-full border border-gray-600" style={{backgroundColor: config.style.background_color}}></div>
                      <span>{config.style.background_color}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(config.pattern_type === 'custom' ? 'upload' : 'config')}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                Back
              </button>
              
              <button
                onClick={startGeneration}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <SparklesIcon className="h-5 w-5" />
                <span>Generate Array</span>
              </button>
            </div>
          </div>
        )}

        {/* Generate Step */}
        {step === 'generate' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <SparklesIcon className="h-6 w-6 text-purple-400 mr-2" />
                Generating Your Array
              </h2>

              {/* Generation Status */}
              <div className="text-center py-8">
                {!generationResult || generationResult.status === 'generating' ? (
                  <div>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
                    <h3 className="text-xl font-semibold mb-2">Weaving mystical energies...</h3>
                    <p className="text-gray-400">This may take a few minutes. Please be patient while we craft your unique array.</p>
                  </div>
                ) : generationResult.status === 'completed' ? (
                  <div>
                    <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold mb-2 text-green-400">Array Generated Successfully!</h3>
                    <p className="text-gray-400 mb-6">Your mystical array is ready. View and download your creation below.</p>
                    
                    {/* Generated Array Display */}
                    <div className="bg-gray-900 rounded-lg p-6 mb-6">
                      {generationResult.thumbnail_url && (
                        <img
                          src={generationResult.thumbnail_url}
                          alt="Generated Array"
                          className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                        />
                      )}
                    </div>

                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={downloadResult}
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <CloudArrowDownIcon className="h-5 w-5" />
                        <span>Download SVG</span>
                      </button>
                      
                      <button
                        onClick={() => router.push(`/member/creations`)}
                        className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <EyeIcon className="h-5 w-5" />
                        <span>View in Gallery</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold mb-2 text-red-400">Generation Failed</h3>
                    <p className="text-gray-400 mb-6">{generationResult.error}</p>
                    
                    <button
                      onClick={() => setStep('preview')}
                      className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                      <span>Try Again</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={resetGenerator}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                Create New Array
              </button>
              
              <button
                onClick={() => router.push('/member/dashboard')}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}