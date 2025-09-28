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
      room_id,
      request_id,
      approve,
      invitation_id
    } = await req.json();

    console.log('Received request:', { action, child_id, game_id, room_code });

    switch (action) {
      case 'create_room':
        // Check if user is already in any active room using the room_id column
        const { data: userProfile } = await supabase
          .from('children_profiles')
          .select('room_id')
          .eq('id', child_id)
          .single();

        if (userProfile?.room_id) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'You are currently in another room. Please leave that room first.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

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

        // Set host as in room
        await supabase
          .from('children_profiles')
          .update({ room_id: newRoom.id } as any)
          .eq('id', child_id);

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
        // Check if user is already in any active room using the room_id column
        const { data: joiningUserProfile } = await supabase
          .from('children_profiles')
          .select('room_id')
          .eq('id', child_id)
          .single();

        if (joiningUserProfile?.room_id) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'You are currently in another room. Please leave that room first.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

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

        // Set player as in room
        await supabase
          .from('children_profiles')
          .update({ room_id: room.id } as any)
          .eq('id', child_id);

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

        // Set player as not in room
        await supabase
          .from('children_profiles')
          .update({ room_id: null } as any)
          .eq('id', child_id);

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
            
            // Set all remaining participants as not in room
            const { data: remainingParticipants } = await supabase
              .from('room_participants')
              .select('child_id')
              .eq('room_id', room_id)
              .not('child_id', 'is', null);

            if (remainingParticipants && remainingParticipants.length > 0) {
              const participantIds = remainingParticipants.map(p => p.child_id);
              await supabase
                .from('children_profiles')
                .update({ room_id: null } as any)
                .in('id', participantIds);
            }
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
        // Get host info for the invitations
        const { data: inviteHostProfile } = await supabase
          .from('children_profiles')
          .select('name, avatar')
          .eq('id', child_id)
          .single();

        const { data: roomInfo } = await supabase
          .from('game_rooms')
          .select('room_code, game_id, difficulty')
          .eq('id', room_id)
          .single();

        if (!inviteHostProfile || !roomInfo) {
          return new Response(
            JSON.stringify({ success: false, error: 'Host or room not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create join requests for each invited friend
        const invitations = [];
        for (const friendId of friend_ids) {
          const { data: inviteRequest } = await supabase
            .from('join_requests')
            .insert({
              room_code: roomInfo.room_code,
              room_id: room_id,
              child_id: friendId,
              player_name: inviteHostProfile.name || 'Host',
              player_avatar: inviteHostProfile.avatar || '👤',
              status: 'pending'
            })
            .select()
            .single();

          if (inviteRequest) {
            invitations.push(inviteRequest);
          }
        }

        return new Response(
          JSON.stringify({ success: true, invitations_sent: invitations.length }),
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

      case 'request_to_join':
        // Check if room exists and is active
        const { data: targetRoom, error: targetRoomError } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('room_code', room_code)
          .single();

        if (targetRoomError || !targetRoom) {
          return new Response(
            JSON.stringify({ success: false, error: 'Room not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get requester info
        const { data: requesterProfile } = await supabase
          .from('children_profiles')
          .select('name, avatar')
          .eq('id', child_id)
          .single();

        // Create join request
        const { data: newRequest, error: requestError } = await supabase
          .from('join_requests')
          .insert({
            room_code,
            room_id: targetRoom.id,
            child_id,
            player_name: requesterProfile?.name || 'Player',
            player_avatar: requesterProfile?.avatar || '👤',
            status: 'pending'
          })
          .select()
          .single();

        if (requestError) throw requestError;

        return new Response(
          JSON.stringify({ success: true, data: newRequest }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'handle_join_request':
        // Use already parsed request_id and approve from top-level destructuring
        
        // Get the join request
        const { data: joinRequest } = await supabase
          .from('join_requests')
          .select('*')
          .eq('id', request_id)
          .single();

        if (!joinRequest) {
          return new Response(
            JSON.stringify({ success: false, error: 'Request not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update request status
        await supabase
          .from('join_requests')
          .update({ status: approve ? 'approved' : 'denied' })
          .eq('id', request_id);

        if (approve) {
          // Get room info
          const { data: roomForJoin } = await supabase
            .from('game_rooms')
            .select('*')
            .eq('room_code', joinRequest.room_code)
            .single();

          if (roomForJoin && roomForJoin.current_players < roomForJoin.max_players) {
            // Get the accepting player's profile information (not the host's info from join request)
            const { data: acceptingPlayerProfile } = await supabase
              .from('children_profiles')
              .select('name, avatar')
              .eq('id', joinRequest.child_id)
              .single();

            // Add player to room with their actual profile info
            const { data: newParticipant } = await supabase
              .from('room_participants')
              .insert({
                room_id: roomForJoin.id,
                child_id: joinRequest.child_id,
                player_name: acceptingPlayerProfile?.name || 'Player',
                player_avatar: acceptingPlayerProfile?.avatar || '👤',
                is_ai: false
              })
              .select()
              .single();

            // Set player as in room
            await supabase
              .from('children_profiles')
              .update({ room_id: roomForJoin.id } as any)
              .eq('id', joinRequest.child_id);

            // Update room player count
            await supabase
              .from('game_rooms')
              .update({ current_players: roomForJoin.current_players + 1 })
              .eq('id', roomForJoin.id);

            return new Response(
              JSON.stringify({ 
                success: true, 
                player: newParticipant,
                room: roomForJoin,
                room_id: roomForJoin.id
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'close_room':
        // When host closes the room, set all participants' room_id to null
        const { data: allRoomParticipants } = await supabase
          .from('room_participants')
          .select('child_id')
          .eq('room_id', room_id);
        
        if (allRoomParticipants && allRoomParticipants.length > 0) {
          const participantIds = allRoomParticipants.map(p => p.child_id).filter(Boolean);
          if (participantIds.length > 0) {
            await supabase
              .from('children_profiles')
              .update({ room_id: null } as any)
              .in('id', participantIds);
          }
        }
        
        // Delete the room
        await supabase.from('game_rooms').delete().eq('id', room_id);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_pending_invitations':
        // Get pending join requests for the child using room_id foreign key
        const { data: pendingInvitations, error: invitationsError } = await supabase
          .from('join_requests')
          .select(`
            id,
            room_code,
            room_id,
            player_name,
            player_avatar,
            created_at,
            game_rooms!join_requests_room_id_fkey(game_id, difficulty, host_child_id, status)
          `)
          .eq('child_id', child_id)
          .eq('status', 'pending')
          .eq('game_rooms.status', 'waiting');

        if (invitationsError) throw invitationsError;

        return new Response(
          JSON.stringify({ success: true, data: pendingInvitations || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'accept_invitation':
        // Use already parsed invitation_id from top-level destructuring
        
        // Get the invitation details
        const { data: invitation } = await supabase
          .from('join_requests')
          .select(`
            *,
            game_rooms!inner(*)
          `)
          .eq('id', invitation_id)
          .eq('child_id', child_id)
          .eq('status', 'pending')
          .single();

        if (!invitation) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invitation not found or already processed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if user is already in a room
        const { data: userRoomStatus } = await supabase
          .from('children_profiles')
          .select('room_id')
          .eq('id', child_id)
          .single();

        if (userRoomStatus?.room_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'You are already in a room' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const roomData = invitation.game_rooms;
        
        // Check if room has space
        if (roomData.current_players >= roomData.max_players) {
          // Update invitation status to denied
          await supabase
            .from('join_requests')
            .update({ status: 'denied' })
            .eq('id', invitation_id);

          return new Response(
            JSON.stringify({ success: false, error: 'Room is full' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Add player to room
        const { data: newParticipant } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomData.id,
            child_id: child_id,
            player_name: invitation.player_name,
            player_avatar: invitation.player_avatar,
            is_ai: false
          })
          .select()
          .single();

        // Set player as in room
        await supabase
          .from('children_profiles')
          .update({ room_id: roomData.id } as any)
          .eq('id', child_id);

        // Update room player count
        await supabase
          .from('game_rooms')
          .update({ current_players: roomData.current_players + 1 })
          .eq('id', roomData.id);

        // Update invitation status to approved
        await supabase
          .from('join_requests')
          .update({ status: 'approved' })
          .eq('id', invitation_id);

        // Deny all other pending invitations for this user
        await supabase
          .from('join_requests')
          .update({ status: 'denied' })
          .eq('child_id', child_id)
          .eq('status', 'pending')
          .neq('id', invitation_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { 
              room_id: roomData.id,
              room_code: roomData.room_code,
              participant: newParticipant 
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'decline_invitation':
        const declineId = invitation_id; // Use already parsed invitation_id
        
        // Update invitation status to denied
        const { error: declineError } = await supabase
          .from('join_requests')
          .update({ status: 'denied' })
          .eq('id', declineId)
          .eq('child_id', child_id)
          .eq('status', 'pending');

        if (declineError) throw declineError;

        return new Response(
          JSON.stringify({ success: true }),
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