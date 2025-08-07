import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { findOrCreateTemplatesDirectory } from '@/lib/path-utils'

// Valid template types and their expected filenames
const TEMPLATE_MAPPING: { [key: string]: string } = {
  'flower-of-life': 'flower-of-life-template.png',
  'sri-yantra': 'sri-yantra-template.png',
  'torus-field': 'torus-field-template.png'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const templateType = formData.get('templateType') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!templateType || !TEMPLATE_MAPPING[templateType]) {
      return NextResponse.json(
        { error: 'Invalid template type. Must be: flower-of-life, sri-yantra, or torus-field' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG or JPEG images only.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for images)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Use shared directory utility for consistency
    const templatesDir = await findOrCreateTemplatesDirectory()

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save the template file with correct name
    const filename = TEMPLATE_MAPPING[templateType]
    const filePath = path.join(templatesDir, filename)
    await fs.writeFile(filePath, buffer)

    console.log(`Successfully uploaded template: ${filename}`)

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${templateType} template`,
      templateType,
      filename,
      filePath,
      fileSize: file.size
    })

  } catch (error: any) {
    console.error('Template upload failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to upload template file',
      code: 'UPLOAD_FAILED'
    }, { status: 500 })
  }
}