// API Route for AI Collaboration Monitoring
// Provides insights into Oracle + Claude autonomous operations

import { NextRequest, NextResponse } from 'next/server'
import { AICollaboration } from '@/lib/aiCollaboration'

// Get collaboration status and active tasks
export async function GET() {
  try {
    const report = AICollaboration.generateCollaborationReport()
    const activeHandoffs = AICollaboration.getActiveHandoffs()
    
    return NextResponse.json({
      status: 'online',
      service: 'AI Collaboration System',
      activeRepairs: activeHandoffs.length,
      report: report,
      handoffs: activeHandoffs.map(h => ({
        taskId: h.taskId,
        priority: h.fromOracle.priority,
        status: h.status,
        errorType: h.fromOracle.errorReport?.scanResults?.errorType || 'System Issue',
        oracleComplete: !!h.fromOracle.dispatchPrompt,
        claudeAcknowledged: h.toClaude.received,
        claudeProgress: {
          analysisComplete: h.toClaude.analysisComplete,
          repairStarted: h.toClaude.repairStarted,
          repairCompleted: h.toClaude.repairCompleted
        }
      })),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'AI Collaboration monitoring service unavailable',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Trigger collaboration cleanup
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'cleanup') {
      AICollaboration.cleanupCompletedTasks()
      return NextResponse.json({
        success: true,
        message: 'Completed tasks cleaned up successfully',
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'status') {
      const report = AICollaboration.generateCollaborationReport()
      return NextResponse.json({
        success: true,
        report: report,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      error: 'Invalid action. Use "cleanup" or "status"',
      timestamp: new Date().toISOString()
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      error: 'AI Collaboration service error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}