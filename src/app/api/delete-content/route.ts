import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("content").delete().eq("id", id).select();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ success: true });
}
