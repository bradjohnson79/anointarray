import { promises as fs } from 'fs'
import path from 'path'
import { findOrCreateGlyphsDirectory } from './path-utils'

/**
 * Ensures glyphs are accessible from the public directory
 * Copies glyphs from the source directory to public/generator/glyphs if needed
 */
export async function ensureGlyphsInPublic(): Promise<string> {
  const publicGlyphsPath = path.join(process.cwd(), 'public', 'generator', 'glyphs')
  
  try {
    // Create public glyphs directory if it doesn't exist
    await fs.mkdir(publicGlyphsPath, { recursive: true })
    
    // Check if glyphs already exist in public
    const publicFiles = await fs.readdir(publicGlyphsPath)
    if (publicFiles.filter(f => f.endsWith('.png')).length > 0) {
      console.log('Glyphs already exist in public directory')
      return publicGlyphsPath
    }
    
    // Find source glyphs directory
    const sourceGlyphsDir = await findOrCreateGlyphsDirectory()
    console.log('Source glyphs directory:', sourceGlyphsDir)
    
    // Copy glyphs to public directory
    try {
      const sourceFiles = await fs.readdir(sourceGlyphsDir)
      const pngFiles = sourceFiles.filter(f => f.endsWith('.png'))
      
      console.log(`Copying ${pngFiles.length} glyph files to public directory`)
      
      for (const file of pngFiles) {
        const sourcePath = path.join(sourceGlyphsDir, file)
        const destPath = path.join(publicGlyphsPath, file)
        
        try {
          await fs.copyFile(sourcePath, destPath)
          console.log(`Copied ${file} to public directory`)
        } catch (copyError) {
          console.error(`Failed to copy ${file}:`, copyError)
        }
      }
      
      console.log('Glyphs copied to public directory successfully')
    } catch (error) {
      console.error('Failed to copy glyphs:', error)
    }
    
    return publicGlyphsPath
  } catch (error) {
    console.error('Failed to ensure glyphs in public:', error)
    return publicGlyphsPath
  }
}

/**
 * Get the public URL path for glyphs
 */
export function getGlyphPublicPath(): string {
  return '/generator/glyphs'
}