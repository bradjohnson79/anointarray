import { NextResponse } from 'next/server'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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