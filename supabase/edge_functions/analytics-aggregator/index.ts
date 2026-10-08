// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This serves as a reference Edge Function for Insight One background tasks.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

interface WebhookPayload {
  tenant_id: number;
  client_id?: number;
  action: "sync_metrics" | "generate_summary";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment configurations");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WebhookPayload = await req.json();

    if (!body.tenant_id) {
      return new Response(
        JSON.stringify({
          is_success: false,
          data: null,
          paging: { total_records: 0, page_size: 0, page_index: 0 },
          message: "tenant_id is required for multi-tenant isolation",
          status_code: 400,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Call database RPC to aggregate metrics safely via security definer function
    const { data, error } = await supabase.rpc("fn_engagement_list", {
      p_client_id: body.client_id || null,
      p_platform: null,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        is_success: true,
        data: data?.data || [],
        paging: { total_records: Array.isArray(data?.data) ? data.data.length : 0, page_size: 0, page_index: 0 },
        message: "Metrics synchronized successfully",
        status_code: 200,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        is_success: false,
        data: null,
        paging: { total_records: 0, page_size: 0, page_index: 0 },
        message: err.message || "Internal server error occurred",
        status_code: 500,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
