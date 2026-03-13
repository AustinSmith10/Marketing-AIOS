import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return Response.json({ message: "Export handled client-side" });
}

// TODO: For server-side PDF generation, implement here using pdfkit

