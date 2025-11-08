import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const auth0UserIdSchema = z.string().min(1).regex(/^auth0\|/, "Invalid Auth0 user ID format");
const emailSchema = z.string().email("Invalid email format");
const nameSchema = z.string().min(1).max(100, "Name must be 1-100 characters");
const avatarSchema = z.string().max(50, "Avatar must be max 50 characters").optional();
const ageGroupSchema = z.enum(['3-5', '6-8', '9-12'], { errorMap: () => ({ message: "Age group must be 3-5, 6-8, or 9-12" }) });
const uuidSchema = z.string().uuid("Invalid UUID format");

const createParentSchema = z.object({
  auth0_user_id: auth0UserIdSchema,
  profile_data: z.object({
    email: emailSchema,
    name: nameSchema.optional()
  })
});

const createChildSchema = z.object({
  auth0_user_id: auth0UserIdSchema,
  profile_data: z.object({
    parent_id: uuidSchema,
    name: nameSchema,
    age_group: ageGroupSchema,
    avatar: avatarSchema
  })
});

const updateChildSchema = z.object({
  auth0_user_id: auth0UserIdSchema,
  profile_data: z.object({
    child_id: uuidSchema
  }).passthrough() // Allow other update fields
});

const deleteChildSchema = z.object({
  auth0_user_id: auth0UserIdSchema,
  profile_data: z.object({
    child_id: uuidSchema
  })
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const requestBody = await req.json();
    const { action, auth0_user_id, profile_data, child_id } = requestBody;

    // Validate auth0_user_id for all actions
    if (!auth0_user_id || typeof auth0_user_id !== 'string') {
      throw new Error("auth0_user_id is required");
    }

    // Set the Auth0 user ID for RLS policies
    await supabaseClient.rpc('set_config', {
      setting: 'app.current_auth0_user_id',
      value: auth0_user_id
    });

    // Create parent profile (server-side, avoids RLS issues from client)
    if (action === 'create_parent') {
      const validated = createParentSchema.parse(requestBody);
      const { email, name } = validated.profile_data;

      // First check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabaseClient
        .from('parent_profiles')
        .select('*')
        .eq('auth0_user_id', validated.auth0_user_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        // Profile already exists, return it
        return new Response(JSON.stringify({ success: true, data: existingProfile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create new profile if it doesn't exist
      const { data, error } = await supabaseClient
        .from('parent_profiles')
        .insert({
          auth0_user_id: validated.auth0_user_id,
          email,
          name: name || email
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_child') {
      const validated = createChildSchema.parse(requestBody);
      const { parent_id, name, age_group, avatar } = validated.profile_data;
      
      const { data, error } = await supabaseClient
        .from('children_profiles')
        .insert({
          parent_id,
          name,
          age_group,
          avatar
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_child') {
      const validated = updateChildSchema.parse(requestBody);
      const { child_id, ...updateData } = validated.profile_data;
      
      const { data, error } = await supabaseClient
        .from('children_profiles')
        .update(updateData)
        .eq('id', child_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_child') {
      const validated = deleteChildSchema.parse(requestBody);
      const { child_id } = validated.profile_data;
      
      const { error } = await supabaseClient
        .from('children_profiles')
        .delete()
        .eq('id', child_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_parent') {
      auth0UserIdSchema.parse(auth0_user_id);
      
      const { data, error } = await supabaseClient
        .from('parent_profiles')
        .select('*')
        .eq('auth0_user_id', auth0_user_id)
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_children') {
      const parentId = profile_data?.parent_id;
      uuidSchema.parse(parentId);
      
      const { data, error } = await supabaseClient
        .from('children_profiles')
        .select('*')
        .eq('parent_id', parentId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'set_child_online_status') {
      uuidSchema.parse(child_id);
      const isOnline = z.boolean().parse(profile_data?.is_online);
      
      // Update child's online status
      const { data: statusUpdate, error: statusError } = await supabaseClient
        .from('children_profiles')
        .update({ 
          is_online: isOnline,
          last_seen_at: new Date().toISOString()
        })
        .eq('id', child_id)
        .select()
        .single();

      if (statusError) throw statusError;

      return new Response(
        JSON.stringify({ success: true, data: statusUpdate }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_in_room_status') {
      uuidSchema.parse(child_id);
      const inRoom = z.boolean().parse(profile_data?.in_room);
      
      // Update child's in_room status
      const { data, error } = await supabaseClient
        .from('children_profiles')
        .update({ in_room: inRoom })
        .eq('id', child_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manage-profiles function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});