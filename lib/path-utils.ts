import { promises as fs } from 'fs'
import path from 'path'

/**
 * Shared utility for consistent directory path handling across upload and verification APIs
 */

export async function findOrCreateGlyphsDirectory(): Promise<string> {
  // Try different possible directory structures
  const possiblePaths = [
    path.join(process.cwd(), '..', 'anoint-app', 'generator', 'glyphs'),
    path.join(process.cwd(), 'public', 'generator', 'glyphs'),
    path.join(process.cwd(), 'uploads', 'glyphs'),
    path.join(process.cwd(), 'data', 'glyphs')
  ]
  
  console.log('Looking for glyphs directory in:', possiblePaths)
  
  // First try to find an existing directory with files
  for (const tryPath of possiblePaths) {
    try {
      await fs.access(tryPath)
      // Check if directory has files
      const files = await fs.readdir(tryPath)
      if (files.length > 0) {
        console.log('Found existing glyphs directory with files:', tryPath)
        return tryPath
      }
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  // If no existing directory with files, try to find any existing directory
  for (const tryPath of possiblePaths) {
    try {
      await fs.access(tryPath)
      console.log('Found empty glyphs directory:', tryPath)
      return tryPath
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  // If no directory exists, create the first preference that can be created
  for (const tryPath of possiblePaths) {
    try {
      await fs.mkdir(tryPath, { recursive: true })
      console.log('Created new glyphs directory:', tryPath)
      return tryPath
    } catch (createError) {
      console.log('Failed to create directory:', tryPath, createError)
      continue
    }
  }
  
  // Fallback - should not happen but just in case
  const fallbackPath = path.join(process.cwd(), 'uploads', 'glyphs')
  await fs.mkdir(fallbackPath, { recursive: true })
  console.log('Using fallback glyphs directory:', fallbackPath)
  return fallbackPath
}

export async function findOrCreateTemplatesDirectory(): Promise<string> {
  // Try different possible directory structures for templates
  const possiblePaths = [
    path.join(process.cwd(), '..', 'anoint-app', 'generator', 'templates'),
    path.join(process.cwd(), 'public', 'generator', 'templates'),
    path.join(process.cwd(), 'uploads', 'templates'),
    path.join(process.cwd(), 'data', 'templates')
  ]
  
  console.log('Looking for templates directory in:', possiblePaths)
  
  // First try to find an existing directory with files
  for (const tryPath of possiblePaths) {
    try {
      await fs.access(tryPath)
      // Check if directory has files
      const files = await fs.readdir(tryPath)
      if (files.length > 0) {
        console.log('Found existing templates directory with files:', tryPath)
        return tryPath
      }
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  // If no existing directory with files, try to find any existing directory
  for (const tryPath of possiblePaths) {
    try {
      await fs.access(tryPath)
      console.log('Found empty templates directory:', tryPath)
      return tryPath
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  // If no directory exists, create the first preference that can be created
  for (const tryPath of possiblePaths) {
    try {
      await fs.mkdir(tryPath, { recursive: true })
      console.log('Created new templates directory:', tryPath)
      return tryPath
    } catch (createError) {
      console.log('Failed to create directory:', tryPath, createError)
      continue
    }
  }
  
  // Fallback
  const fallbackPath = path.join(process.cwd(), 'uploads', 'templates')
  await fs.mkdir(fallbackPath, { recursive: true })
  console.log('Using fallback templates directory:', fallbackPath)
  return fallbackPath
}