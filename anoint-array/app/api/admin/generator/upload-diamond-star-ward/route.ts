import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PNG, JPG, or JPEG files only.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Define upload directory
    const uploadDir = join(process.cwd(), 'public', 'generator', 'placeholders')
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Define file path - always save as diamond-star-ward.png
    const fileName = 'diamond-star-ward.png'
    const filePath = join(uploadDir, fileName)

    // Write file
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      message: 'Diamond star ward uploaded successfully',
      filename: fileName,
      path: `/generator/placeholders/${fileName}`
    })

  } catch (error) {
    console.error('Diamond star ward upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload diamond star ward' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload diamond star ward.' },
    { status: 405 }
  )
}