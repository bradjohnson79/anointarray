import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'image/png') {
      return NextResponse.json(
        { success: false, error: 'Only PNG files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to public directory for now (will be updated to use database/cloud storage later)
    const publicPath = path.join(process.cwd(), 'public')
    const filePath = path.join(publicPath, 'sample-array.png')

    try {
      await fs.writeFile(filePath, buffer)
      console.log('Sample array saved to:', filePath)
    } catch (writeError) {
      console.error('Failed to write sample array file:', writeError)
      return NextResponse.json(
        { success: false, error: 'Failed to save file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sample array uploaded successfully',
      fileName: file.name,
      uploadDate: new Date().toISOString(),
      imageUrl: '/sample-array.png'
    })

  } catch (error) {
    console.error('Sample array upload failed:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}