import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { playerId } = await req.json()

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onesignalPlayerId: playerId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving OneSignal player ID:', error)
    return NextResponse.json({ error: 'Failed to save player ID' }, { status: 500 })
  }
}
