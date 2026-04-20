import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workspaceName, files } = await req.json();

    // simple simulation of a build/deploy
    await new Promise(r => setTimeout(r, 1500));

    if (!workspaceName || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files to deploy' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const slug = workspaceName.toLowerCase().replace(/\s+/g, '-') || 'project';
    const url = `https://${slug}-${Date.now().toString(36)}.lovable.app`;
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error('deploy function error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
