import { NextResponse } from 'next/server'
import { existsSync, statSync } from 'fs'
import { join } from 'path'
import { promises as fs } from 'fs'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backupId = params.id
    const backupDir = join(process.cwd(), 'backups')
    const backupPath = join(backupDir, `${backupId}.json`)

    if (!existsSync(backupPath)) {
      return NextResponse.json(
        { success: false, error: 'Backup file not found' },
        { status: 404 }
      )
    }

    // Read the backup file
    const fileBuffer = await fs.readFile(backupPath)
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${backupId}.json"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error) {
    console.error('Backup download error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to download backup' },
      { status: 500 }
    )
  }
}