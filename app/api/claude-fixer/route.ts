// API Route for Claude Sonnet 3.7 - Autonomous Fixer Component
// Partners with Oracle (ChatGPT 4o) for full self-healing AI

import { NextRequest, NextResponse } from 'next/server'
import { ClaudeSonnet37, RepairTask } from '@/lib/claudeAI'
import { AICollaboration } from '@/lib/aiCollaboration'

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'online',
    service: 'Claude Sonnet 3.7 Autonomous Fixer',
    role: 'System Repair & Maintenance',
    partner: 'Oracle (ChatGPT 4o Scanner/Dispatcher)',
    constraints: 'Maintenance-only - No infrastructure changes',
    timestamp: new Date().toISOString()
  })
}

// Execute autonomous repair from Oracle dispatch
export async function POST(request: NextRequest) {
  try {
    const { handoffId, dispatchPrompt, errorReport, taskType } = await request.json()

    if (!dispatchPrompt) {
      return NextResponse.json(
        { error: 'Dispatch prompt from Oracle is required' },
        { status: 400 }
      )
    }

    // Step 1: Acknowledge handoff from Oracle
    if (handoffId) {
      const handoff = AICollaboration.acknowledgeRepairTask(handoffId)
      if (handoff) {
        console.log(`✅ Claude acknowledged Oracle handoff: ${handoffId}`)
        AICollaboration.updateRepairProgress(handoffId, 'analysis')
      }
    }

    // Step 2: Execute autonomous repair
    console.log('🛠️ Claude Sonnet 3.7 starting autonomous repair...')
    if (handoffId) {
      AICollaboration.updateRepairProgress(handoffId, 'repair_started')
    }

    const repairTask: RepairTask = await ClaudeSonnet37.executeRepair(
      dispatchPrompt, 
      errorReport || {}
    )

    // Step 3: Update collaboration status
    if (handoffId) {
      AICollaboration.updateRepairProgress(handoffId, 'repair_completed', repairTask.result)
    }

    return NextResponse.json({
      success: true,
      taskId: repairTask.id,
      handoffId: handoffId,
      status: repairTask.status,
      result: repairTask.result,
      analysis: repairTask.analysis,
      repairPlan: repairTask.repairPlan,
      filesModified: repairTask.filesModified,
      timestamp: repairTask.timestamp,
      collaboration: handoffId ? 'Oracle handoff acknowledged and completed' : 'Direct repair executed',
      message: 'Autonomous repair completed by Claude Sonnet 3.7 via AI collaboration'
    })

  } catch (error) {
    console.error('Claude Fixer API Error:', error)
    
    // If there was a handoff, escalate it
    const { handoffId } = await request.json().catch(() => ({}))
    if (handoffId) {
      AICollaboration.escalateToHuman(handoffId, `Claude repair failed: ${error}`)
    }
    
    return NextResponse.json({
      success: false,
      error: 'Claude Sonnet 3.7 repair service encountered an issue',
      fallback: 'Oracle will retry or escalate to manual review',
      handoffId: handoffId,
      escalated: handoffId ? true : false,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Get repair task status (for Oracle to check progress)
export async function PUT(request: NextRequest) {
  try {
    const { taskId } = await request.json()
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const status = ClaudeSonnet37.getRepairStatus(taskId)
    
    return NextResponse.json({
      taskId,
      status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Unable to retrieve repair status',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}