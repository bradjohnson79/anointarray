import { NextResponse } from 'next/server'
import { existsSync, unlinkSync } from 'fs'
import { validateBackupId, safeBackupPath } from '../../../../../../lib/security/path-utils'

export async function DELETE(
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

    // Delete the backup file
    unlinkSync(backupPath)

    return NextResponse.json({
      success: true,
      message: `Backup ${backupId} deleted successfully`
    })

  } catch (error) {
    console.error('Backup deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete backup' },
      { status: 500 }
    )
  }
}