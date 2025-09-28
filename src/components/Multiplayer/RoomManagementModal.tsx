import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, UserPlus, Home } from "lucide-react";
import { useAppContext } from "@/contexts/Auth0Context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { GameRoom } from "@/types/multiplayer";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
  child_id: string;
  in_room?: boolean;
}

interface RoomManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoomManagementModal = ({ isOpen, onClose }: RoomManagementModalProps) => {
  const { selectedChild } = useAppContext();
  const { toast } = useToast();
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [customRoomName, setCustomRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  
  // Friend management states
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  useEffect(() => {
    if (!isOpen || !selectedChild) return;
    loadCurrentRoom();
    loadFriends();
  }, [isOpen, selectedChild]);

  const loadCurrentRoom = async () => {
    if (!selectedChild) return;

    try {
      // Check if child is in a room
      const { data: roomParticipant } = await supabase
        .from('room_participants')
        .select(`
          room_id,
          game_rooms(*)
        `)
        .eq('child_id', selectedChild.id)
        .single();

      if (roomParticipant?.game_rooms) {
        const room = roomParticipant.game_rooms as GameRoom;
        setCurrentRoom(room);
        setRoomCode(room.room_code);
        setActiveTab("room");
        loadRoomParticipants(room.id);
      } else {
        setCurrentRoom(null);
        setActiveTab("create");
      }
    } catch (error) {
      console.error('Error loading current room:', error);
      setCurrentRoom(null);
      setActiveTab("create");
    }
  };

  const loadRoomParticipants = async (roomId: string) => {
    try {
      const { data: participants } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId);

      if (participants) {
        const playerList: Player[] = participants.map(p => ({
          id: p.child_id || p.id,
          name: p.player_name,
          avatar: p.player_avatar || '👤',
          isAI: p.is_ai
        }));
        setPlayers(playerList);
      }
    } catch (error) {
      console.error('Error loading room participants:', error);
    }
  };

  const loadFriends = async () => {
    if (!selectedChild) return;

    try {
      setIsLoadingFriends(true);
      
      // Use edge function to fetch friends with names/avatars reliably
      const { data } = await supabase.functions.invoke('manage-friends', {
        body: {
          action: 'list_friends',
          child_id: selectedChild.id
        }
      });

      if (!data?.success) throw new Error(data?.error || 'Failed to load friends');

      const apiFriends: any[] = data.data || [];
      
      const friendsList = apiFriends.map((f) => ({
        id: f.id,
        child_id: f.child_id,
        name: f.name,
        avatar: f.avatar || '👤',
        status: f.status || 'offline',
        in_room: f.in_room || false
      } as Friend));

      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: 'Error',
        description: 'Failed to load friends',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const createRoom = async () => {
    if (!selectedChild) return;

    try {
      setIsCreating(true);
      
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'create_room',
          child_id: selectedChild.id,
          game_id: 'riddle', // Default game
          difficulty: 'easy', // Default difficulty
          room_name: customRoomName,
          invited_friends: selectedFriendIds
        }
      });

      if (data?.success) {
        toast({
          title: "Room Created!",
          description: `Room code: ${data.room_code}`,
        });
        setRoomCode(data.room_code);
        loadCurrentRoom();
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to create room",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!selectedChild || !joinRoomCode.trim()) return;

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
        toast({
          title: "Joined Room!",
          description: `Welcome to room ${joinRoomCode}`,
        });
        setJoinRoomCode("");
        loadCurrentRoom();
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to join room",
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
    if (!selectedChild || !currentRoom) return;

    try {
      setIsLeaving(true);
      
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'leave_room',
          child_id: selectedChild.id,
          room_id: currentRoom.id
        }
      });

      if (data?.success) {
        toast({
          title: "Left Room",
          description: "You have successfully left the room",
        });
        setCurrentRoom(null);
        setRoomCode("");
        setPlayers([]);
        setActiveTab("create");
        // Update child's in_room status
        await supabase
          .from('children_profiles')
          .update({ in_room: false })
          .eq('id', selectedChild.id);
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to leave room",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                  Play riddle on easy difficulty
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="room-name">Room Name (Optional)</Label>
                  <Input
                    id="room-name"
                    placeholder="Enter custom room name..."
                    value={customRoomName}
                    onChange={(e) => setCustomRoomName(e.target.value)}
                  />
                </div>

                {/* Friend Selection */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span className="text-sm font-medium">Add Friends</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={loadFriends}
                        disabled={isLoadingFriends}
                      >
                        🔄
                      </Button>
                    </div>

                    <div className="space-y-2 mb-3">
                      <Input
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8"
                      />
                    </div>

                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {friends.filter(friend => 
                        friend.name && friend.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((friend) => (
                        <div key={friend.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`friend-${friend.id}`}
                            checked={selectedFriendIds.includes(friend.child_id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFriendIds(prev => [...prev, friend.child_id]);
                              } else {
                                setSelectedFriendIds(prev => prev.filter(id => id !== friend.child_id));
                              }
                            }}
                            disabled={friend.in_room}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback>{friend.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <span className={`text-sm ${friend.in_room ? 'text-muted-foreground' : ''}`}>
                              {friend.name}
                            </span>
                            <Badge variant={
                              friend.in_room ? 'secondary' : 
                              friend.status === 'online' ? 'default' : 'outline'
                            } className="text-xs">
                              {friend.in_room ? 'In Room' : friend.status}
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {friends.length === 0 && !isLoadingFriends && (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-xs">No friends available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={createRoom} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? "Creating..." : "Create Room"}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  💡 If no friends join, an AI friend will play with you!
                </div>
              </div>
            </TabsContent>

            <TabsContent value="join" className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Join Room</h3>
                <p className="text-sm text-muted-foreground">
                  Enter a room code to join your friend's game
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="room-code">Room Code</Label>
                  <Input
                    id="room-code"
                    placeholder="Enter 6-character room code..."
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

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Game:</span>
                          <span className="capitalize">{currentRoom.game_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span className="capitalize">{currentRoom.difficulty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={currentRoom.status === 'waiting' ? 'secondary' : 'default'}>
                            {currentRoom.status}
                          </Badge>
                        </div>
                      </div>

                      <h4 className="font-medium mb-3">Players ({players.length}/4)</h4>
                      <div className="space-y-2">
                        {players.map((player) => (
                          <div key={player.id} className="flex items-center gap-3 p-2 bg-secondary/20 rounded-lg">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback>{player.name?.[0] || '?'}</AvatarFallback>
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
                      variant="destructive" 
                      onClick={leaveRoom}
                      disabled={isLeaving}
                      className="w-full"
                    >
                      {isLeaving ? "Leaving..." : "Leave Room"}
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    💡 More players can join during the game using the room code
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

export default RoomManagementModal;