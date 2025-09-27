import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/Auth0Context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
}

interface GameRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  difficulty: string;
  onStartGame: (roomId: string) => void;
}

const GameRoomModal = ({ isOpen, onClose, gameId, difficulty, onStartGame }: GameRoomModalProps) => {
  const { selectedChild } = useAppContext();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [customRoomName, setCustomRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    if (isOpen && selectedChild) {
      initializeRoom();
    }
  }, [isOpen, selectedChild]);

  const initializeRoom = () => {
    if (!selectedChild) return;
    
    setPlayers([{
      id: selectedChild.id,
      name: selectedChild.name,
      avatar: selectedChild.avatar || '👤',
      isAI: false
    }]);
  };

  const createGameRoom = async () => {
    console.log('Create room clicked, selectedChild:', selectedChild);
    
    if (!selectedChild?.id) {
      toast({
        title: "No Child Profile",
        description: "Please select a child profile first to create a room",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'create_room',
          child_id: selectedChild.id,
          game_id: gameId,
          difficulty: difficulty,
          room_name: customRoomName
        }
      });

      if (data?.success) {
        const room = data.data;
        setCurrentRoom(room);
        setRoomCode(room.room_code);
        setPlayers([{
          id: selectedChild.id,
          name: selectedChild.name,
          avatar: selectedChild.avatar || '👤',
          isAI: false
        }]);

        // Add AI player if created
        if (room.has_ai_player) {
          setPlayers(prev => [...prev, {
            id: 'ai-1',
            name: room.ai_player_name,
            avatar: room.ai_player_avatar,
            isAI: true
          }]);
        }

        toast({
          title: "Room Created!",
          description: `Room code: ${room.room_code}`,
        });
        setActiveTab("room");
      } else {
        throw new Error(data?.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create game room",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    console.log('Join room clicked, selectedChild:', selectedChild, 'roomCode:', joinRoomCode);
    
    if (!selectedChild?.id) {
      toast({
        title: "No Child Profile",
        description: "Please select a child profile first to join a room",
        variant: "destructive",
      });
      return;
    }
    
    if (!joinRoomCode.trim()) {
      toast({
        title: "Missing Room Code",
        description: "Please enter a room code to join",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsJoining(true);
      
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'join_room',
          child_id: selectedChild.id,
          room_code: joinRoomCode.toUpperCase()
        }
      });

      if (data?.success) {
        const room = data.data;
        setCurrentRoom(room);
        setRoomCode(room.room_code);
        
        // Load all participants
        const { data: participantsData } = await supabase.functions.invoke('manage-game-rooms', {
          body: {
            action: 'get_room_participants',
            room_id: room.id
          }
        });

        if (participantsData?.success) {
          const participantPlayers = participantsData.data.map((p: any) => ({
            id: p.child_id || p.id,
            name: p.player_name,
            avatar: p.player_avatar,
            isAI: p.is_ai
          }));
          setPlayers(participantPlayers);
        }

        toast({
          title: "Joined Room!",
          description: `Welcome to room ${room.room_code}`,
        });
        setActiveTab("room");
      } else {
        toast({
          title: "Failed to Join",
          description: data?.error || "Room not found or full",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom || !selectedChild?.id) return;

    try {
      await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'leave_room',
          room_id: currentRoom.id,
          child_id: selectedChild.id
        }
      });

      setCurrentRoom(null);
      setRoomCode("");
      setPlayers([]);
      setActiveTab("create");
      
      toast({
        title: "Left Room",
        description: "You have left the game room",
      });
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>🎮 Multiplayer Game</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="join">Join</TabsTrigger>
              <TabsTrigger value="room" disabled={!currentRoom}>Room</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Create New Room</h3>
                <p className="text-sm text-muted-foreground">
                  Play {gameId} on {difficulty} difficulty
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name (Optional)</Label>
                  <Input
                    id="room-name"
                    placeholder="Enter custom room name..."
                    value={customRoomName}
                    onChange={(e) => setCustomRoomName(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={createGameRoom} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? "Creating..." : "Create Room"}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  🤖 If no friends join, an AI friend will play with you!
                </div>
              </div>
            </TabsContent>

            <TabsContent value="join" className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Join Existing Room</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the room code shared by your friend
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-code">Room Code</Label>
                  <Input
                    id="room-code"
                    placeholder="Enter 6-digit room code"
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={joinRoom} 
                  disabled={!joinRoomCode.trim() || isJoining}
                  className="w-full"
                >
                  {isJoining ? "Joining..." : "Join Room"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="room" className="space-y-4">
              {currentRoom && (
                <>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Room: {roomCode}</h3>
                    <p className="text-sm text-muted-foreground">
                      Share this code with friends to invite them!
                    </p>
                  </div>

                  {/* Players List */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Players ({players.length}/4)</h4>
                      <div className="space-y-2">
                        {players.map((player) => (
                          <div key={player.id} className="flex items-center gap-3 p-2 bg-secondary/20 rounded-lg">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback>{player.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="flex-1 font-medium">{player.name}</span>
                            {player.isAI && <Badge variant="secondary">AI</Badge>}
                            {player.id === selectedChild?.id && <Badge variant="default">You</Badge>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => onStartGame(roomCode)}
                      className="flex-1"
                      disabled={players.length < 2}
                    >
                      Start Game ({players.length} players)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={leaveRoom}
                    >
                      Leave Room
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    💡 Need at least 2 players to start the game
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameRoomModal;