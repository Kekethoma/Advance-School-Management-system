import { type NextRequest, NextResponse } from "next/server"

// This route is deprecated - school registration is now handled client-side via localStorage
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "School registration is handled client-side." },
    { status: 410 }
  )
}
