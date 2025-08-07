import { NextRequest, NextResponse } from 'next/server'
import { createWriteStream, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'
import { randomUUID } from 'crypto'

// This would normally come from your auth middleware
interface User {
  id: string
  email: string
  displayName: string
}

// Mock data - in production, this would come from your database
const getUserArrays = async (userId: string) => {
  return [
    {
      id: '1',
      name: 'Mystic Energy Array',
      type: 'Healing',
      template: 'Torus Field',
      date: '2024-01-15',
      status: 'Complete',
      power: '★★★★☆',
      purchased: true,
      files: {
        png: '/path/to/mystic-energy-array.png',
        pdf: '/path/to/mystic-energy-array.pdf'
      },
      metadata: {
        birthDate: '1990-01-01',
        birthTime: '12:00',
        birthLocation: 'New York, NY',
        generatedAt: '2024-01-15T10:30:00Z',
        purchaseId: 'purchase_1234'
      }
    },
    {
      id: '2',
      name: 'Abundance Manifestation',
      type: 'Prosperity',
      template: 'Flower of Life',
      date: '2024-01-14',
      status: 'Complete',
      power: '★★★★★',
      purchased: true,
      files: {
        png: '/path/to/abundance-manifestation.png',
        pdf: '/path/to/abundance-manifestation.pdf'
      },
      metadata: {
        birthDate: '1990-01-01',
        birthTime: '12:00',
        birthLocation: 'New York, NY',
        generatedAt: '2024-01-14T14:20:00Z',
        purchaseId: 'purchase_1235'
      }
    },
    {
      id: '4',
      name: 'Love Frequency Array',
      type: 'Relationship',
      template: 'Torus Field',
      date: '2024-01-12',
      status: 'Complete',
      power: '★★★★☆',
      purchased: true,
      files: {
        png: '/path/to/love-frequency-array.png',
        pdf: '/path/to/love-frequency-array.pdf'
      },
      metadata: {
        birthDate: '1990-01-01',
        birthTime: '12:00',
        birthLocation: 'New York, NY',
        generatedAt: '2024-01-12T16:45:00Z',
        purchaseId: 'purchase_1236'
      }
    }
  ]
}

const getUserProfile = async (userId: string) => {
  return {
    id: userId,
    displayName: 'Brad Johnson',
    email: 'brad@example.com',
    birthData: {
      date: '1990-01-01',
      time: '12:00',
      location: 'New York, NY'
    },
    memberSince: '2024-01-01',
    totalArrays: 47,
    purchasedArrays: 34,
    exportedAt: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    // In production, you would get user from authentication middleware
    const user: User = {
      id: 'user_123',
      email: 'brad@example.com',
      displayName: 'Brad Johnson'
    }

    // Get user's purchased arrays and profile data
    const arrays = await getUserArrays(user.id)
    const profile = await getUserProfile(user.id)

    // Filter only purchased arrays
    const purchasedArrays = arrays.filter(array => array.purchased)

    if (purchasedArrays.length === 0) {
      return NextResponse.json(
        { error: 'No purchased arrays found' },
        { status: 400 }
      )
    }

    // Create temporary directory for ZIP file
    const tempDir = tmpdir()
    const zipFileName = `anoint-arrays-${user.id}-${Date.now()}.zip`
    const zipPath = join(tempDir, zipFileName)

    // Create ZIP file
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Handle archive events
    return new Promise<NextResponse>((resolve, reject) => {
      output.on('close', async () => {
        try {
          // Read the ZIP file and return as response
          const zipBuffer = readFileSync(zipPath)
          
          // Clean up temp file
          // fs.unlinkSync(zipPath) // Uncomment in production
          
          resolve(new NextResponse(zipBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="anoint-arrays-export-${new Date().toISOString().split('T')[0]}.zip"`,
              'Content-Length': zipBuffer.length.toString(),
            },
          }))
        } catch (error) {
          console.error('Error reading ZIP file:', error)
          reject(new NextResponse(
            JSON.stringify({ error: 'Failed to create export file' }),
            { status: 500 }
          ))
        }
      })

      archive.on('error', (err) => {
        console.error('Archive error:', err)
        reject(new NextResponse(
          JSON.stringify({ error: 'Failed to create archive' }),
          { status: 500 }
        ))
      })

      // Pipe archive data to the file
      archive.pipe(output)

      // Add arrays metadata to ZIP
      const arraysMetadata = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exportedBy: user.displayName,
          totalArraysExported: purchasedArrays.length,
          exportVersion: '1.0'
        },
        userProfile: profile,
        arrays: purchasedArrays.map(array => ({
          id: array.id,
          name: array.name,
          type: array.type,
          template: array.template,
          generatedDate: array.date,
          powerLevel: array.power,
          files: {
            png: `arrays/${array.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`,
            pdf: `arrays/${array.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`
          },
          metadata: array.metadata
        }))
      }

      // Add metadata JSON file
      archive.append(
        JSON.stringify(arraysMetadata, null, 2),
        { name: 'export-metadata.json' }
      )

      // Add README file
      const readmeContent = `# ANOINT Array Export

This export contains your purchased ANOINT Arrays and associated metadata.

## Contents:
- arrays/ - Your purchased array files in PNG and PDF format
- export-metadata.json - Complete metadata about your arrays and export
- README.txt - This file

## Array Files Included:
${purchasedArrays.map(array => `- ${array.name} (${array.template} template)`).join('\n')}

Export created: ${new Date().toISOString()}
Total arrays: ${purchasedArrays.length}

For questions about your arrays, contact support@anoint.me
`

      archive.append(readmeContent, { name: 'README.txt' })

      // In a real implementation, you would add actual array files here
      // For now, we'll create placeholder files for each array
      purchasedArrays.forEach(array => {
        const arrayName = array.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        
        // Add placeholder PNG file
        const pngPlaceholder = Buffer.from(`PNG placeholder for ${array.name}`)
        archive.append(pngPlaceholder, { name: `arrays/${arrayName}.png` })
        
        // Add placeholder PDF file
        const pdfPlaceholder = Buffer.from(`PDF placeholder for ${array.name}`)
        archive.append(pdfPlaceholder, { name: `arrays/${arrayName}.pdf` })
        
        // Add individual array metadata
        const individualMetadata = {
          array: array,
          exportNote: 'This file contains the complete metadata for this specific array'
        }
        archive.append(
          JSON.stringify(individualMetadata, null, 2),
          { name: `arrays/${arrayName}-metadata.json` }
        )
      })

      // Finalize the archive
      archive.finalize()
    })

  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to export data.' },
    { status: 405 }
  )
}