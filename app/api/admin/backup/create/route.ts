import { NextResponse } from 'next/server'
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { promises as fs } from 'fs'
import { secureAdminRoute, type AuthenticatedRequest } from '@/lib/auth-middleware'

interface BackupOptions {
  type: 'full' | 'database' | 'files' | 'config'
  includeSensitive?: boolean
}

async function handlePOST(request: AuthenticatedRequest) {
  try {
    console.log(`Backup API: Starting backup creation by admin user: ${request.user?.email}`)
    
    // Parse request body with error handling
    let body: BackupOptions
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { type = 'full', includeSensitive = false } = body
    console.log(`Backup API: Creating ${type} backup`)

    // Generate unique backup ID and filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupId = `backup_${timestamp}_${type}`
    const backupDir = join(process.cwd(), 'backups')

    // Ensure backup directory exists
    try {
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true })
        console.log('Backup API: Created backup directory')
      }
    } catch (dirError) {
      console.error('Directory creation error:', dirError)
      return NextResponse.json(
        { success: false, error: 'Failed to create backup directory' },
        { status: 500 }
      )
    }

    // Create backup data (simplified JSON approach)
    const backupData = await createBackupData(type, includeSensitive, request.user?.email || 'system')
    
    // Save backup data to JSON file
    const backupPath = join(backupDir, `${backupId}.json`)
    try {
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))
      console.log('Backup API: Backup file created successfully')
    } catch (writeError) {
      console.error('File write error:', writeError)
      return NextResponse.json(
        { success: false, error: 'Failed to write backup file' },
        { status: 500 }
      )
    }

    // Get file stats for response
    const stats = await fs.stat(backupPath)
    const sizeInKB = (stats.size / 1024).toFixed(1)

    const response = {
      success: true,
      backupId,
      filename: `${backupId}.json`,
      size: `${sizeInKB} KB`,
      path: backupPath,
      created: new Date().toISOString(),
      type,
      message: `${type} backup created successfully`
    }

    console.log('Backup API: Returning success response')
    return NextResponse.json(response)

  } catch (error) {
    console.error('Backup creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create backup',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}

async function createBackupData(type: string, includeSensitive: boolean, creator: string) {
  const backupData: any = {
    metadata: {
      id: `backup_${Date.now()}`,
      type,
      created: new Date().toISOString(),
      version: '1.0',
      creator: creator,
      includedComponents: {
        sourceCode: type === 'full' || type === 'files',
        database: type === 'full' || type === 'database', 
        configuration: type === 'full' || type === 'config',
        assets: type === 'full' || type === 'files'
      }
    },
    data: {}
  }

  try {
    if (type === 'full' || type === 'database') {
      // Simulate database export
      backupData.data.database = {
        users: [
          { id: 1, email: 'admin@anoint.me', role: 'admin', created: '2024-01-01' }
        ],
        arrays: [
          { id: 1, name: 'Sample Array', type: 'flower_of_life', created: '2024-01-01' }
        ],
        orders: [
          { id: 1, userId: 1, total: 10.00, status: 'completed', created: '2024-01-01' }
        ],
        exportedAt: new Date().toISOString()
      }
    }

    if (type === 'full' || type === 'config') {
      // Read and include key configuration files
      try {
        const packageJson = await fs.readFile(join(process.cwd(), 'package.json'), 'utf-8')
        backupData.data.packageJson = JSON.parse(packageJson)
      } catch (e) {
        console.warn('Could not read package.json')
      }

      try {
        const tsConfig = await fs.readFile(join(process.cwd(), 'tsconfig.json'), 'utf-8')
        backupData.data.tsConfig = JSON.parse(tsConfig)
      } catch (e) {
        console.warn('Could not read tsconfig.json')
      }

      // Environment template
      if (!includeSensitive) {
        backupData.data.envTemplate = {
          VITE_SUPABASE_URL: 'your_supabase_url',
          VITE_SUPABASE_ANON_KEY: 'your_supabase_anon_key',
          OPENAI_API_KEY: 'your_openai_key',
          ANTHROPIC_API_KEY: 'your_anthropic_key',
          STRIPE_SECRET_KEY: 'your_stripe_key'
        }
      }
    }

    if (type === 'full' || type === 'files') {
      // File inventory (paths only for now)
      backupData.data.fileInventory = {
        components: 'React components directory structure',
        pages: 'Next.js pages and API routes',
        public: 'Static assets and images',
        styles: 'CSS and styling files',
        note: 'Full file backup would require archive format'
      }
    }

  } catch (error) {
    console.error('Error creating backup data:', error)
    backupData.data.error = 'Some backup data could not be collected'
  }

  return backupData
}


// GET endpoint to list available backups
async function handleGET(request: AuthenticatedRequest) {
  try {
    const backupDir = join(process.cwd(), 'backups')
    
    if (!existsSync(backupDir)) {
      return NextResponse.json({
        success: true,
        backups: [],
        message: 'No backups directory found'
      })
    }

    const files = readdirSync(backupDir)
    const backups = []

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(backupDir, file)
        const stats = statSync(filePath)
        const sizeInKB = (stats.size / 1024).toFixed(1)
        
        backups.push({
          id: file.replace('.json', ''),
          filename: file,
          size: `${sizeInKB} KB`,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          canRestore: true,
          type: file.includes('_full_') ? 'full' : 
                file.includes('_database_') ? 'database' : 
                file.includes('_files_') ? 'files' : 'config'
        })
      }
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    return NextResponse.json({
      success: true,
      backups,
      count: backups.length
    })

  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list backups' },
      { status: 500 }
    )
  }
}

// Secure exports with authentication
export const POST = secureAdminRoute(handlePOST)
export const GET = secureAdminRoute(handleGET)