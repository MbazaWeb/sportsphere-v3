import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { content, postType, mediaUrls, hashtags, location, isBreaking } = await req.json()

    // 1. Create the post in DB
    const { data: post, error: postError } = await supabase
      .from('Post')
      .insert({
        userId: user.id,
        content,
        postType: postType || 'post',
        mediaUrls: JSON.stringify(mediaUrls || []),
        hashtags: JSON.stringify(hashtags || []),
        location,
        isBreaking: !!isBreaking
      })
      .select()
      .single()

    if (postError) throw postError

    // 2. Increment user post count
    await supabase.rpc('increment_post_count', { user_id: user.id })

    return new Response(JSON.stringify(post), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
