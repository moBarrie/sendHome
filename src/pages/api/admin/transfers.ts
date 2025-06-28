import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create server-side client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Fetching all transfers for admin...");

    // Fetch all transfers with user profile info, ordered by created_at DESC
    const { data: transfers, error } = await supabaseAdmin
      .from("transfers")
      .select(`
        *,
        profiles (
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transfers:", error);
      return res.status(500).json({ 
        error: "Failed to fetch transfers",
        details: error.message 
      });
    }

    console.log(`Found ${transfers?.length || 0} transfers`);

    return res.status(200).json({
      transfers: transfers || [],
      total: transfers?.length || 0,
    });
  } catch (error) {
    console.error("Admin transfers API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
