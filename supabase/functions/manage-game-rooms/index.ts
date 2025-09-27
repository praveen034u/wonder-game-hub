import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Friends data
const AI_FRIENDS = [
  { name: "Robo", avatar: "🤖", personality: "logical" },
  { name: "Spark", avatar: "⚡", personality: "energetic" },
  { name: "Luna", avatar: "🌙", personality: "calm" },
  { name: "Dash", avatar: "💨", personality: "speedy" },
  { name: "Pixel", avatar: "📱", personality: "techy" }
];

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      throw new Error('No authorization token provided');
    }

    // Set the auth token for RLS
    supabase.auth.setSession({ access_token: authToken, refresh_token: '' });

    const { 
      action, 
      child_id, 
      game_id, 
      difficulty, 
      room_name, 
      room_code, 
      friend_ids = [],
      room_id 
    } = await req.json();

    console.log('Received request:', { action, child_id, game_id, room_code });

    switch (action) {
      case 'create_room':
        const roomCode = generateRoomCode();
        const finalRoomName = room_name || `${game_id} Room`;

        // Create the game room
        const { data: newRoom, error: roomError } = await supabase
          .from('game_rooms')
          .insert({
            room_code: roomCode,
            host_child_id: child_id,
            game_id,
            difficulty,
            max_players: 4,
            current_players: 1,
            status: 'waiting'
          })
          .select()
          .single();

        if (roomError) throw roomError;

        // Get host info
        const { data: hostProfile } = await supabase
          .from('children_profiles')
          .select('name, avatar')
          .eq('id', child_id)
          .single();

        // Add host as participant
        await supabase
          .from('room_participants')
          .insert({
            room_id: newRoom.id,
            child_id: child_id,
            player_name: hostProfile?.name || 'Host',
            player_avatar: hostProfile?.avatar || '👤',
            is_ai: false
          });

        // If no friends available, add AI player
        if (friend_ids.length === 0) {
          const aiFriend = AI_FRIENDS[Math.floor(Math.random() * AI_FRIENDS.length)];
          
          await supabase
            .from('room_participants')
            .insert({
              room_id: newRoom.id,
              player_name: aiFriend.name,
              player_avatar: aiFriend.avatar,
              is_ai: true
            });

          await supabase
            .from('game_rooms')
            .update({ 
              current_players: 2,
              has_ai_player: true,
              ai_player_name: aiFriend.name,
              ai_player_avatar: aiFriend.avatar
            })
            .eq('id', newRoom.id);
        }

        return new Response(
          JSON.stringify({ success: true, data: { ...newRoom, room_code: roomCode } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'join_room':
        // Find room by code
        const { data: room, error: findError } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('room_code', room_code)
          .eq('status', 'waiting')
          .single();

        if (findError || !room) {
          return new Response(
            JSON.stringify({ success: false, error: 'Room not found or not available' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (room.current_players >= room.max_players) {
          return new Response(
            JSON.stringify({ success: false, error: 'Room is full' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get player info
        const { data: playerProfile } = await supabase
          .from('children_profiles')
          .select('name, avatar')
          .eq('id', child_id)
          .single();

        // Add player to room
        await supabase
          .from('room_participants')
          .insert({
            room_id: room.id,
            child_id: child_id,
            player_name: playerProfile?.name || 'Player',
            player_avatar: playerProfile?.avatar || '👤',
            is_ai: false
          });

        // Update room player count
        await supabase
          .from('game_rooms')
          .update({ current_players: room.current_players + 1 })
          .eq('id', room.id);

        return new Response(
          JSON.stringify({ success: true, data: room }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'leave_room':
        // Remove player from room
        const { error: leaveError } = await supabase
          .from('room_participants')
          .delete()
          .eq('room_id', room_id)
          .eq('child_id', child_id);

        if (leaveError) throw leaveError;

        // Get updated room info
        const { data: updatedRoom } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('id', room_id)
          .single();

        if (updatedRoom) {
          const newPlayerCount = updatedRoom.current_players - 1;
          
          if (newPlayerCount <= 0 || updatedRoom.host_child_id === child_id) {
            // Delete room if empty or host left
            await supabase
              .from('game_rooms')
              .delete()
              .eq('id', room_id);
          } else {
            // Update player count
            await supabase
              .from('game_rooms')
              .update({ current_players: newPlayerCount })
              .eq('id', room_id);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'invite_friends':
        // Send invitations to friends (could be expanded with notification system)
        const invitations = friend_ids.map((friendId: string) => ({
          room_id: room_id,
          invited_child_id: friendId,
          invited_by: child_id,
          status: 'pending'
        }));

        // For now, just return success - in a real app, you'd store invitations
        console.log('Invitations would be sent:', invitations);

        return new Response(
          JSON.stringify({ success: true, invitations_sent: friend_ids.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_room_participants':
        const { data: participants, error: participantsError } = await supabase
          .from('room_participants')
          .select('*')
          .eq('room_id', room_id);

        if (participantsError) throw participantsError;

        return new Response(
          JSON.stringify({ success: true, data: participants || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in manage-game-rooms function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});