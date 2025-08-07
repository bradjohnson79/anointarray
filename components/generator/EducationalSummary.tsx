'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, BookOpen } from 'lucide-react'

interface EducationalSummaryProps {
  explanation: string
}

export default function EducationalSummary({ explanation }: EducationalSummaryProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(explanation)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BookOpen className="h-5 w-5 text-purple-400" />
          Why These Tokens Were Chosen For You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <textarea
            value={explanation}
            readOnly
            className="w-full min-h-[120px] resize-none bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 text-gray-300 text-sm leading-relaxed p-3 rounded-lg placeholder-gray-500"
            placeholder="Educational explanation will appear here..."
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-gray-700/80 backdrop-blur-lg border-gray-600/50 hover:bg-gray-600/80 text-white"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-gray-600" />
            )}
          </Button>
        </div>
        
        <div className="text-xs text-gray-300 bg-purple-900/30 backdrop-blur-lg p-3 rounded-lg border border-purple-700/30">
          <p className="font-semibold mb-1 text-purple-300">✨ Personalized Explanation</p>
          <p>
            This explanation was generated specifically for your seal array based on your birth data, 
            personal energy signature, and the tokens selected by our AI system. Feel free to copy 
            and save this information for your records.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}