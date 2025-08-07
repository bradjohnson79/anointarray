'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  CheckCircle,
  Cpu,
  Clock,
  Coins,
  FileText,
  Sparkles,
  Calculator
} from 'lucide-react'

interface DebugData {
  prompt: {
    fullText: string
    userInput: any
    availableGlyphsCount: number
  }
  aiResponse: {
    raw: string
    parsed: any
    model: string
    temperature: number
    maxTokens: number
  }
  timing: {
    total: number
    glyphLoad: number
    promptGeneration: number
    aiCall: number
    parsing: number
  }
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  coordinateCalculations: {
    ring1Sample: any
    ring2Sample: any
    ring3: any
  }
}

interface DebugWindowProps {
  debugData: DebugData | null
  isGenerating: boolean
}

function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean 
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
      <CardHeader 
        className="cursor-pointer py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

function CopyButton({ text, label = "Copy" }: { text: string, label?: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }
  
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className="h-7 text-xs"
    >
      {copied ? (
        <>
          <CheckCircle className="h-3 w-3 mr-1" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" />
          {label}
        </>
      )}
    </Button>
  )
}

export default function DebugWindow({ debugData, isGenerating }: DebugWindowProps) {
  if (!debugData && !isGenerating) {
    return null
  }

  if (isGenerating && !debugData) {
    return (
      <Alert className="bg-yellow-900/60 backdrop-blur-lg border-yellow-700/50 text-yellow-200">
        <Cpu className="h-4 w-4" />
        <AlertDescription>
          <strong>Debug Mode Active:</strong> Waiting for generation to complete...
        </AlertDescription>
      </Alert>
    )
  }

  if (!debugData) return null

  const formatJson = (obj: any) => JSON.stringify(obj, null, 2)
  const formatTime = (ms: number) => `${ms}ms (${(ms / 1000).toFixed(2)}s)`

  return (
    <div className="space-y-3 mt-4">
      <Alert className="bg-purple-900/60 backdrop-blur-lg border-purple-700/50 text-purple-200">
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <strong>AI Debug Console:</strong> ChatGPT 4o → Claude Processing Pipeline
        </AlertDescription>
      </Alert>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Total Time</span>
          </div>
          <p className="text-lg font-bold text-white">{formatTime(debugData.timing.total)}</p>
        </div>
        
        <div className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Cpu className="h-4 w-4" />
            <span className="text-xs font-medium">AI Call Time</span>
          </div>
          <p className="text-lg font-bold text-white">{formatTime(debugData.timing.aiCall)}</p>
        </div>
        
        <div className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Tokens Used</span>
          </div>
          <p className="text-lg font-bold text-white">{debugData.tokens.total.toLocaleString()}</p>
        </div>
        
        <div className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-400 mb-1">
            <Coins className="h-4 w-4" />
            <span className="text-xs font-medium">API Cost</span>
          </div>
          <p className="text-lg font-bold text-white">${(debugData.tokens.total * 0.00003).toFixed(4)}</p>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-3">
        {/* ChatGPT 4o Prompt */}
        <CollapsibleSection 
          title="ChatGPT 4o Prompt" 
          icon={<FileText className="h-4 w-4 text-purple-400" />}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {debugData.prompt.availableGlyphsCount} glyphs available
              </Badge>
              <CopyButton text={debugData.prompt.fullText} label="Copy Prompt" />
            </div>
            <pre className="bg-gray-900/60 rounded p-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {debugData.prompt.fullText}
            </pre>
          </div>
        </CollapsibleSection>

        {/* AI Response */}
        <CollapsibleSection 
          title="ChatGPT 4o Raw Response" 
          icon={<Sparkles className="h-4 w-4 text-cyan-400" />}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">Model: {debugData.aiResponse.model}</Badge>
                <Badge variant="outline" className="text-xs">Temp: {debugData.aiResponse.temperature}</Badge>
              </div>
              <CopyButton text={debugData.aiResponse.raw} label="Copy Response" />
            </div>
            <pre className="bg-gray-900/60 rounded p-3 text-xs font-mono text-gray-300 overflow-x-auto max-h-96">
              {debugData.aiResponse.raw}
            </pre>
          </div>
        </CollapsibleSection>

        {/* Parsed Data */}
        <CollapsibleSection 
          title="Parsed AI Data" 
          icon={<Calculator className="h-4 w-4 text-green-400" />}
        >
          <div className="space-y-3">
            <CopyButton text={formatJson(debugData.aiResponse.parsed)} label="Copy Parsed JSON" />
            <pre className="bg-gray-900/60 rounded p-3 text-xs font-mono text-gray-300 overflow-x-auto max-h-96">
              {formatJson(debugData.aiResponse.parsed)}
            </pre>
          </div>
        </CollapsibleSection>

        {/* Coordinate Calculations */}
        <CollapsibleSection 
          title="Claude Coordinate Processing" 
          icon={<Cpu className="h-4 w-4 text-blue-400" />}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-1">Ring 1 Sample</h4>
                <pre className="bg-gray-900/60 rounded p-2 text-xs font-mono text-gray-300">
                  {formatJson(debugData.coordinateCalculations.ring1Sample)}
                </pre>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-1">Ring 2 Sample</h4>
                <pre className="bg-gray-900/60 rounded p-2 text-xs font-mono text-gray-300">
                  {formatJson(debugData.coordinateCalculations.ring2Sample)}
                </pre>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-1">Ring 3 Affirmation</h4>
                <pre className="bg-gray-900/60 rounded p-2 text-xs font-mono text-gray-300">
                  {formatJson(debugData.coordinateCalculations.ring3)}
                </pre>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Timing Breakdown */}
        <CollapsibleSection 
          title="Performance Breakdown" 
          icon={<Clock className="h-4 w-4 text-yellow-400" />}
        >
          <div className="space-y-2">
            {Object.entries(debugData.timing).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-sm font-mono text-white">
                  {formatTime(value as number)}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}