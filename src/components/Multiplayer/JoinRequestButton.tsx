import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/contexts/Auth0Context";
import { useToast } from "@/hooks/use-toast";

interface JoinRequestButtonProps {
  className?: string;
}

const JoinRequestButton = ({ className }: JoinRequestButtonProps) => {
  const { selectedChild } = useAppContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

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
        setIsOpen(false);
        setRoomCode("");
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

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        🚪 Request to Join Game
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Join Game</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Enter the room code of an active game to request to join during gameplay.
            </div>
            
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
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinRequestButton;