'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wind, Clock, Monitor, Printer } from 'lucide-react'

export default function UsageInstructions() {
  return (
    <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wind className="h-5 w-5 text-cyan-400" />
          How to Use Your ANOINT Array
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-gray-300 space-y-3">
          <p className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">1.</span>
            <span>
              To use your seal array, have it on a digital screen <Monitor className="inline h-4 w-4" /> or 
              print it out on paper <Printer className="inline h-4 w-4" />. Use a color printer if possible for best results.
            </span>
          </p>
          
          <p className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">2.</span>
            <span>
              Once your seal array is displayed, focus on its center and breathe into it using 
              <strong className="text-cyan-400"> Ujjayi Pranayama</strong>, or the victorious/ocean breath.
            </span>
          </p>
          
          <p className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">3.</span>
            <span>
              Hold either hand out to the seal array's center and constrict the throat as you breathe in, 
              and keeping the throat constricted as you breathe out. Repeat this breath two more times.
            </span>
          </p>
          
          <p className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">4.</span>
            <span>
              What you're doing is guiding your own life force energy into the center of the seal array 
              giving it life force energy charge.
            </span>
          </p>
        </div>
        
        <Alert className="bg-purple-900/60 backdrop-blur-lg border-purple-700/50 text-purple-200">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Frequency:</strong> Repeat this breathwork with your array every 8 hours or so 
            to get the maximum benefits from it and the theme it's assisting you with.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-700/30">
          <h4 className="text-sm font-semibold text-cyan-300 mb-2">Ujjayi Pranayama Technique:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Constrict the back of your throat (like fogging a mirror)</li>
            <li>• Create a soft ocean-like sound as you breathe</li>
            <li>• Maintain even, controlled breaths</li>
            <li>• Focus your intention on charging the array</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}