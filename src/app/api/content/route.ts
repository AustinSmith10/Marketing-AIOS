import { NextRequest } from "next/server";

export async function GET() {
  return Response.json({ message: "Content stored client-side" });
}

export async function POST(req: NextRequest) {
  return Response.json({ message: "Content stored client-side" });
}

// TODO: Replace with Vercel Postgres when scaling beyond localStorage

