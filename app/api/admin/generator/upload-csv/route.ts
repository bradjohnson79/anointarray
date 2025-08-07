import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { findOrCreateGlyphsDirectory } from '@/lib/path-utils'
import { secureAdminRoute, type AuthenticatedRequest } from '@/lib/auth-middleware'

async function handlePOST(request: AuthenticatedRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()
    console.log('File content preview (first 500 chars):', fileContent.substring(0, 500))
    console.log('File size:', file.size, 'bytes')
    console.log('File name:', file.name)
    
    // Basic CSV validation - check if it has headers and data
    const lines = fileContent.trim().split('\n')
    console.log('Number of lines in CSV:', lines.length)
    console.log('First few lines:', lines.slice(0, 5))
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'Invalid CSV format. File must contain headers and at least one data row.' },
        { status: 400 }
      )
    }

    // Parse CSV headers properly
    const headerLine = lines[0].trim()
    const headers = headerLine.split(',').map(header => header.trim().toLowerCase().replace(/"/g, ''))
    
    console.log('CSV Headers detected:', headers)
    
    // Validate CSV format (first column should be filename-related)
    const firstColumn = headers[0]
    const validFirstColumns = ['filename', 'file', 'name', 'glyph', 'image']
    
    if (!validFirstColumns.some(validCol => firstColumn.includes(validCol))) {
      return NextResponse.json(
        { error: `Invalid CSV format. First column is "${firstColumn}" but should contain one of: ${validFirstColumns.join(', ')}. Current headers: ${headers.join(', ')}` },
        { status: 400 }
      )
    }

    // Count valid glyph entries
    let glyphCount = 0
    const validGlyphs = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines
      
      // Parse the CSV row
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
      const filename = columns[0]
      
      // Check if first column contains a valid image filename
      if (filename && (filename.includes('.png') || filename.includes('.jpg') || filename.includes('.jpeg'))) {
        glyphCount++
        validGlyphs.push(filename)
      }
    }

    console.log('Valid glyphs found:', validGlyphs)

    if (glyphCount === 0) {
      return NextResponse.json(
        { error: 'No valid glyph entries found. Each data row should have an image filename (.png, .jpg, .jpeg) in the first column.' },
        { status: 400 }
      )
    }

    // Use shared directory utility for consistency
    const glyphsDir = await findOrCreateGlyphsDirectory()
    
    // Save the CSV file
    const csvPath = path.join(glyphsDir, 'glyphs.csv')
    console.log('Saving CSV to:', csvPath)
    await fs.writeFile(csvPath, fileContent, 'utf8')

    console.log(`Successfully uploaded glyphs.csv with ${glyphCount} entries`)

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded glyphs.csv with ${glyphCount} glyph entries`,
      glyphCount,
      filePath: csvPath
    })

  } catch (error: any) {
    console.error('CSV upload failed:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
    
    // Return more specific error information
    let errorMessage = 'Failed to upload CSV file'
    if (error.code === 'ENOENT') {
      errorMessage = 'Directory access error. Please check server permissions.'
    } else if (error.code === 'EACCES') {
      errorMessage = 'Permission denied. Server cannot write to the target directory.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        code: error.code,
        name: error.name,
        originalMessage: error.message
      }
    }, { status: 500 })
  }
}

// Secure export with authentication
export const POST = secureAdminRoute(handlePOST)