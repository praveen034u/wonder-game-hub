import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/contexts/Auth0Context";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Clock, CheckCircle2, XCircle } from "lucide-react";

interface JoinRequestButtonProps {
  className?: string;
}

interface PendingInvitation {
  id: string;
  room_code: string;
  player_name: string;
  player_avatar: string;
  created_at: string;
  game_rooms: {
    game_id: string;
    difficulty: string;
    host_child_id: string;
    status: string;
  };
}

const JoinRequestButton = ({ className }: JoinRequestButtonProps) => {
  const { selectedChild } = useAppContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchPendingInvitations = async () => {
    if (!selectedChild?.id) return;

    try {
      setIsLoading(true);
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'get_pending_invitations',
          child_id: selectedChild.id
        }
      });

      if (data?.success) {
        setPendingInvitations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChild?.id) {
      fetchPendingInvitations();
    }
  }, [selectedChild?.id]);

  const handleJoinRequest = async () => {
    if (!selectedChild?.id || !roomCode.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a child profile and enter a room code",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRequesting(true);
      
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'request_to_join',
          child_id: selectedChild.id,
          room_code: roomCode.toUpperCase()
        }
      });

      if (data?.success) {
        toast({
          title: "Request Sent!",
          description: "Your join request has been sent to the room host",
        });
        setShowManualEntry(false);
        setRoomCode("");
        fetchPendingInvitations(); // Refresh invitations
      } else {
        toast({
          title: "Request Failed",
          description: data?.error || "Failed to send join request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!selectedChild?.id) return;

    try {
      setIsProcessing(invitationId);
      
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'accept_invitation',
          child_id: selectedChild.id,
          invitation_id: invitationId
        }
      });

      if (data?.success) {
        toast({
          title: "Joined Room!",
          description: `Successfully joined room ${data.data.room_code}`,
        });
        setIsOpen(false);
        fetchPendingInvitations(); // Refresh to remove accepted invitation
      } else {
        toast({
          title: "Failed to Join",
          description: data?.error || "Failed to join room",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!selectedChild?.id) return;

    try {
      setIsProcessing(invitationId);
      
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'decline_invitation',
          child_id: selectedChild.id,
          invitation_id: invitationId
        }
      });

      if (data?.success) {
        toast({
          title: "Invitation Declined",
          description: "You have declined the room invitation",
        });
        fetchPendingInvitations(); // Refresh to remove declined invitation
      } else {
        toast({
          title: "Error",
          description: "Failed to decline invitation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`${className} relative`}
      >
        🚪 Room Invitations
        {pendingInvitations.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {pendingInvitations.length}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Room Invitations</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchPendingInvitations}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading invitations...</p>
              </div>
            ) : pendingInvitations.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  You have {pendingInvitations.length} pending room invitation{pendingInvitations.length !== 1 ? 's' : ''}. 
                  You can only accept one invitation.
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{invitation.player_avatar}</div>
                        <div className="flex-1">
                          <p className="font-semibold">{invitation.game_rooms.game_id}</p>
                          <p className="text-sm text-muted-foreground">
                            Room: {invitation.room_code} • {invitation.game_rooms.difficulty}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(invitation.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          disabled={isProcessing === invitation.id}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {isProcessing === invitation.id ? "Joining..." : "Accept"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          disabled={isProcessing === invitation.id}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No pending invitations</p>
                <Button
                  variant="outline"
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="w-full"
                >
                  {showManualEntry ? "Hide Manual Entry" : "Request to Join with Room Code"}
                </Button>
              </div>
            )}

            {(showManualEntry || pendingInvitations.length === 0) && (
              <>
                {pendingInvitations.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Or enter a room code manually:
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="room-code-request">Room Code</Label>
                  <Input
                    id="room-code-request"
                    placeholder="Enter 6-digit room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleJoinRequest}
                    disabled={!roomCode.trim() || isRequesting}
                    className="flex-1"
                  >
                    {isRequesting ? "Sending..." : "Send Request"}
                  </Button>
                  {pendingInvitations.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowManualEntry(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            )}

            {(pendingInvitations.length > 0 && !showManualEntry) && (
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinRequestButton;