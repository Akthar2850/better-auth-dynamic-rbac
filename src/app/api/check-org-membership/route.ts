import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const member = sqlite
    .prepare("SELECT id FROM member WHERE userId = ?")
    .get(userId);

  return NextResponse.json({ hasOrg: !!member });
}
