import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../../lib/auth";
import { requireAuth } from "@/middleware/requireAuth";
import { prisma } from "../../../../lib/prisma";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const authUser = requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, nome: true, email: true, role: true },
  });

  return NextResponse.json({ user }, { headers: corsHeaders() });
}