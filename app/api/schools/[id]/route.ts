import { type NextRequest, NextResponse } from "next/server"

// This route is deprecated - school data is managed client-side via localStorage
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(
    { success: false, error: "School lookup is handled client-side. Use localStorage directly." },
    { status: 410 }
  )
}
