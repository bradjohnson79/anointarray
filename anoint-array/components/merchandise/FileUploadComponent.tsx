'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Upload,
  FileImage,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface FileUploadComponentProps {
  onImageUpload: (imageDataUrl: string, fileName: string) => void
  onError: (error: string) => void
}

export default function FileUploadComponent({ onImageUpload, onError }: FileUploadComponentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const MIN_IMAGE_SIZE = 800 // 800x800px minimum
  const ACCEPTED_TYPE = 'image/png'

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== ACCEPTED_TYPE) {
      return 'Only PNG files are accepted. Please upload a PNG image.'
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.`
    }

    return null
  }

  const validateImage = (img: HTMLImageElement): string | null => {
    if (img.width < MIN_IMAGE_SIZE || img.height < MIN_IMAGE_SIZE) {
      return `Image is too small. Minimum size is ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE}px for good print quality.`
    }

    return null
  }

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true)

    try {
      // Validate file
      const fileError = validateFile(file)
      if (fileError) {
        onError(fileError)
        return
      }

      // Create image object to validate dimensions
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        onError('Unable to process image. Please try again.')
        return
      }

      img.onload = () => {
        try {
          // Validate image dimensions
          const imageError = validateImage(img)
          if (imageError) {
            onError(imageError)
            return
          }

          // Convert to data URL for preview and storage
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          const imageDataUrl = canvas.toDataURL('image/png')
          onImageUpload(imageDataUrl, file.name)
        } catch (error) {
          console.error('Image processing error:', error)
          onError('Failed to process image. Please try a different file.')
        }
      }

      img.onerror = () => {
        onError('Invalid image file. Please try a different PNG file.')
      }

      // Create object URL for the image
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl

      // Cleanup object URL after processing
      img.onload = (originalOnload => function(this: HTMLImageElement, ...args: any[]) {
        URL.revokeObjectURL(objectUrl)
        return originalOnload?.apply(this, args)
      })(img.onload)

    } catch (error) {
      console.error('File processing error:', error)
      onError('Failed to process file. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [onImageUpload, onError])

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    processFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-purple-400 bg-purple-900/20' 
            : 'border-gray-600 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800/60'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onClick={!isProcessing ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,image/png"
          onChange={handleInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="space-y-4">
          {isProcessing ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-purple-400 animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-white">Processing Image...</h3>
                <p className="text-gray-400">Validating and optimizing your seal array</p>
              </div>
            </>
          ) : (
            <>
              <FileImage className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isDragging ? 'Drop your PNG file here' : 'Upload Your Seal Array'}
                </h3>
                <p className="text-gray-400 mt-2">
                  Drag & drop your PNG file here, or click to browse
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Requirements */}
      <div className="bg-gray-800/40 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-2">File Requirements:</h4>
        <ul className="space-y-1 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
            PNG format only (high quality recommended)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
            Minimum 800x800px (1200x1200px recommended)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
            Maximum file size: 10MB
          </li>
        </ul>
      </div>

      {/* Alternative Upload Button */}
      <div className="text-center">
        <Button 
          variant="outline"
          onClick={handleBrowseClick}
          disabled={isProcessing}
          className="bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing ? 'Processing...' : 'Choose File from Computer'}
        </Button>
      </div>
    </div>
  )
}