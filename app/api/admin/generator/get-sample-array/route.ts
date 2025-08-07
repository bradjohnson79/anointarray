import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const publicPath = path.join(process.cwd(), 'public')
    const filePath = path.join(publicPath, 'sample-array.png')
    
    try {
      // Check if sample array file exists
      const stats = await fs.stat(filePath)
      
      return NextResponse.json({
        success: true,
        sampleArray: {
          uploaded: true,
          fileName: 'sample-array.png',
          uploadDate: stats.mtime.toISOString(),
          imageUrl: '/sample-array.png'
        }
      })
    } catch (error) {
      // File doesn't exist
      return NextResponse.json({
        success: true,
        sampleArray: {
          uploaded: false,
          fileName: null,
          uploadDate: null,
          imageUrl: null
        }
      })
    }
  } catch (error) {
    console.error('Failed to get sample array info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve sample array information' },
      { status: 500 }
    )
  }
}