import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const { pathname } = new URL(req.url)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // ─── AUTHENTICATION ───
    const authHeader = req.headers.get('Authorization')
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') ?? '')

    // ─── ROUTES ───

    // Toggle Like
    if (pathname.endsWith('/toggle-like') && req.method === 'POST') {
      if (!user) throw new Error('Unauthorized')
      const { postId } = await req.json()

      const { data: existing } = await supabase.from('PostLike').select().match({ postId, userId: user.id }).single()

      if (existing) {
        await supabase.from('PostLike').delete().match({ postId, userId: user.id })
        await supabase.rpc('decrement_like_count', { post_id: postId })
        return new Response(JSON.stringify({ liked: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        await supabase.from('PostLike').insert({ postId, userId: user.id })
        await supabase.rpc('increment_like_count', { post_id: postId })
        return new Response(JSON.stringify({ liked: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // Default 404
    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
