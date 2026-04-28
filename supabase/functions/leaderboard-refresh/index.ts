import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Titan scores: sum of volume_score per user
  const { data: titanScores } = await supabase
    .from("titan_sessions")
    .select("user_id, volume_score");

  // Zenith scores: sum of focus_score per user
  const { data: zenithScores } = await supabase
    .from("zenith_sessions")
    .select("user_id, focus_score");

  // Aggregate titan scores
  const titanMap: Record<string, number> = {};
  titanScores?.forEach((s: any) => {
    titanMap[s.user_id] = (titanMap[s.user_id] || 0) + s.volume_score;
  });

  // Aggregate zenith scores
  const zenithMap: Record<string, number> = {};
  zenithScores?.forEach((s: any) => {
    zenithMap[s.user_id] = (zenithMap[s.user_id] || 0) + s.focus_score;
  });

  // Get all profiles for neural_id lookup
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, neural_id");
  const profileMap: Record<string, string> = {};
  profiles?.forEach((p: any) => { profileMap[p.id] = p.neural_id; });

  // Build upsert rows for titan
  const titanRows = Object.entries(titanMap)
    .sort(([, a], [, b]) => b - a)
    .map(([user_id, score], idx) => ({
      user_id,
      neural_id: profileMap[user_id] || "UNKNOWN",
      mode: "titan",
      category: "global",
      score,
      rank: idx + 1,
      updated_at: new Date().toISOString(),
    }));

  // Build upsert rows for zenith
  const zenithRows = Object.entries(zenithMap)
    .sort(([, a], [, b]) => b - a)
    .map(([user_id, score], idx) => ({
      user_id,
      neural_id: profileMap[user_id] || "UNKNOWN",
      mode: "zenith",
      category: "global",
      score,
      rank: idx + 1,
      updated_at: new Date().toISOString(),
    }));

  await supabase
    .from("leaderboard_cache")
    .upsert([...titanRows, ...zenithRows], {
      onConflict: "user_id,mode,category",
    });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
