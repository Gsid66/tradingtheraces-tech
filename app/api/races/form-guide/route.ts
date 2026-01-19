import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const track = searchParams. get('track')
    
    if (!date || !track) {
      return NextResponse.json(
        { error: 'Date and track parameters required' },
        { status: 400 }
      )
    }
    
    const apiUrl = process.env.RACING_DATA_API_URL
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'RACING_DATA_API_URL not configured' },
        { status: 500 }
      )
    }
    
    console.log(`🏇 Fetching form guide:  ${track} on ${date}`)
    
    const response = await fetch(
      `${apiUrl}/api/form-guide?date=${date}&track=${encodeURIComponent(track)}`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      console.error('❌ Failed to fetch form guide.  Status:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch form guide', status: response.status },
        { status: 500 }
      )
    }
    
    const data = await response.json()
    console.log('✅ Form guide data received')
    
    return NextResponse.json(data)
    
  } catch (error:  any) {
    console.error('💥 Error in /api/races/form-guide:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form guide', message:  error.message },
      { status: 500 }
    )
  }
}