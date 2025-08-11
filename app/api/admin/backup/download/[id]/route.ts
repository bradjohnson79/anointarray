import { NextResponse } from 'next/server'
import { existsSync, statSync } from 'fs'
import { promises as fs } from 'fs'
import { validateBackupId, safeBackupPath } from '../../../../../../lib/security/path-utils'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Validate and sanitize the backup ID to prevent path traversal
    const backupId = validateBackupId(params.id)
    const backupPath = safeBackupPath(backupId)

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