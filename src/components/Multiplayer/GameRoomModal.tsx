import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, UserPlus } from "lucide-react";
import { useAppContext } from "@/contexts/Auth0Context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface OnlineUser {
  id: string;
  name: string;
  avatar: string;
  is_online: boolean;
  status: 'online' | 'offline' | 'in-game';
  in_room?: boolean;
}

interface GameRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  difficulty: string;
  onStartGame: (roomId: string) => void;
  invitedFriendIds?: string[];
}

const GameRoomModal = ({ isOpen, onClose, gameId, difficulty, onStartGame, invitedFriendIds = [] }: GameRoomModalProps) => {
  const { selectedChild, childrenProfiles, setSelectedChild, refreshProfiles } = useAppContext();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [customRoomName, setCustomRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("create");
  
  // Friend management states
  const [friends, setFriends] = useState<Friend[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Auto-select the first child if none is selected
    if (!selectedChild && childrenProfiles.length > 0) {
      setSelectedChild(childrenProfiles[0]);
      return; // initialize will run when selectedChild updates
    }
    if (selectedChild) {
      initializeRoom();
      loadFriendsAndUsers();
    }
  }, [isOpen, selectedChild, childrenProfiles, setSelectedChild]);

  useEffect(() => {
    if (invitedFriendIds.length > 0) {
      setSelectedFriendIds(invitedFriendIds);
      loadInvitedFriends();
    }
  }, [invitedFriendIds]);

  useEffect(() => {
    if (isOpen && childrenProfiles.length === 0) {
      refreshProfiles();
    }
  }, [isOpen, childrenProfiles.length, refreshProfiles]);

  const initializeRoom = () => {
    if (!selectedChild) return;
    
    setPlayers([{
      id: selectedChild.id,
      name: selectedChild.name,
      avatar: selectedChild.avatar || '👤',
      isAI: false
    }]);
  };

  const loadFriendsAndUsers = async () => {
    if (!selectedChild?.id) return;

    try {
      setIsLoadingFriends(true);

      // Load friends
      const { data: friendsData } = await supabase.functions.invoke('manage-friends', {
        body: {
          action: 'list_friends',
          child_id: selectedChild.id
        }
      });

      if (friendsData?.success) {
        setFriends(friendsData.data || []);
      }

      // Load online users
      const { data: usersData } = await supabase.functions.invoke('manage-friends', {
        body: {
          action: 'list_all_children', 
          child_id: selectedChild.id
        }
      });

      if (usersData?.success) {
        setOnlineUsers((usersData.data || []).sort((a: OnlineUser, b: OnlineUser) => {
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
          if (a.status === 'in-game' && b.status === 'offline') return -1;
          if (a.status === 'offline' && b.status === 'in-game') return 1;
          return 0;
        }));
      }
    } catch (error) {
      console.error('Error loading friends and users:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const loadInvitedFriends = async () => {
    if (!selectedChild?.id || invitedFriendIds.length === 0) return;

    try {
      const { data } = await supabase.functions.invoke('manage-friends', {
        body: {
          action: 'get_friends_by_ids',
          child_id: selectedChild.id,
          friend_ids: invitedFriendIds
        }
      });

      if (data?.success) {
        setInvitedFriends(data.data || []);
      }
    } catch (error) {
      console.error('Error loading invited friends:', error);
    }
  };

  const createGameRoom = async () => {
    console.log('Create room clicked, selectedChild:', selectedChild, 'childrenProfiles:', childrenProfiles);
    const activeChild = selectedChild || childrenProfiles[0];
    if (!activeChild?.id) {
      toast({
        title: "No Child Profile",
        description: "Please create a child profile first to create a room",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const allSelectedFriends = [...invitedFriendIds.filter(Boolean), ...selectedFriendIds];
      const uniqueFriendIds = [...new Set(allSelectedFriends)];
      
      const { data } = await supabase.functions.invoke('manage-game-rooms', {
        body: {
          action: 'create_room',
          child_id: activeChild.id,
          game_id: gameId,
          difficulty,
          room_name: customRoomName,
          friend_ids: uniqueFriendIds
        }
      });

      if (data?.success) {
        const room = data.data;
        setCurrentRoom(room);
        setRoomCode(room.room_code);
        setPlayers([{
          id: activeChild.id,
          name: activeChild.name,
          avatar: activeChild.avatar || '👤',
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

        // Invite friends if any were selected
        if (uniqueFriendIds.length > 0) {
          await supabase.functions.invoke('manage-game-rooms', {
            body: {
              action: 'invite_friends',
              room_id: room.id,
              child_id: activeChild.id,
              friend_ids: uniqueFriendIds
            }
          });
          toast({ title: 'Invites Sent', description: `Invited ${uniqueFriendIds.length} friend(s)` });
        }

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
    console.log('Join room clicked, selectedChild:', selectedChild, 'childrenProfiles:', childrenProfiles, 'roomCode:', joinRoomCode);
    
    const activeChild = selectedChild || childrenProfiles[0];
    if (!activeChild?.id) {
      toast({
        title: "No Child Profile",
        description: "Please create a child profile first to join a room",
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
          child_id: activeChild.id,
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

                {/* Invited Friends Display */}
                {invitedFriends.length > 0 && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Invited Friends ({invitedFriends.length})</span>
                      </div>
                      <div className="space-y-2">
                        {invitedFriends.map((friend) => (
                          <div key={friend.id} className="flex items-center gap-2 text-sm">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback>{friend.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <span>{friend.name}</span>
                            <Badge variant={friend.status === 'online' ? 'default' : friend.status === 'in-game' ? 'secondary' : 'outline'} className="text-xs">
                              {friend.status === 'in-game' || friend.in_room ? 'In Room' : friend.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                        onClick={loadFriendsAndUsers}
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
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback>{friend.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{friend.name}</span>
                            <Badge variant={friend.status === 'online' ? 'default' : friend.status === 'in-game' ? 'secondary' : 'outline'} className="text-xs">
                              {friend.status === 'in-game' || friend.in_room ? 'In Room' : friend.status}
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {/* Online Users */}
                      {onlineUsers.filter(user => 
                        user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                        !friends.some(f => f.child_id === user.id) &&
                        user.id !== selectedChild?.id
                      ).map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedFriendIds.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFriendIds(prev => [...prev, user.id]);
                              } else {
                                setSelectedFriendIds(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                            disabled={user.status === 'in-game' || user.in_room}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <span className={`text-sm ${user.status === 'in-game' || user.in_room ? 'text-muted-foreground' : ''}`}>
                              {user.name}
                            </span>
                            <Badge variant={user.status === 'online' ? 'default' : user.status === 'in-game' ? 'secondary' : 'outline'} className="text-xs">
                              {user.status === 'in-game' || user.in_room ? 'In Room' : user.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedFriendIds.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {selectedFriendIds.length} friend(s) selected to invite
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                      disabled={players.length < 1}
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
                    💡 Can start with AI friend! More players can join during the game
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