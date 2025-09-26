import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/contexts/Auth0Context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
  child_id: string;
}

interface FriendsPanelProps {
  onInviteFriend: (friendId: string) => void;
}

const FriendsPanel = ({ onInviteFriend }: FriendsPanelProps) => {
  const { selectedChild } = useAppContext();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      loadFriends();
    }
  }, [selectedChild]);

  const loadFriends = async () => {
    if (!selectedChild?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          requester:children_profiles!friends_requester_id_fkey(id, name, avatar),
          addressee:children_profiles!friends_addressee_id_fkey(id, name, avatar)
        `)
        .or(`requester_id.eq.${selectedChild.id},addressee_id.eq.${selectedChild.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const friendsList = data?.map(friendship => {
        const friend = friendship.requester_id === selectedChild.id 
          ? friendship.addressee 
          : friendship.requester;
        
        return {
          id: friendship.id,
          name: friend.name,
          avatar: friend.avatar || '👤',
          status: 'offline' as const, // In real app, would check online status
          child_id: friend.id
        };
      }) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!selectedChild?.id || !searchQuery.trim()) return;

    try {
      setIsLoading(true);
      
      // In a real app, you'd search for users by username/email
      // For now, we'll show a message
      toast({
        title: "Friend Request",
        description: "Friend request feature coming soon! For now, you can play with AI friends.",
      });
      
      setSearchQuery("");
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'in-game': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👥 Friends
          <Badge variant="secondary">{friends.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Friend */}
        <div className="flex gap-2">
          <Input
            placeholder="Search for friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={sendFriendRequest}
            disabled={!searchQuery.trim() || isLoading}
            size="sm"
          >
            Add
          </Button>
        </div>

        {/* Friends List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback>{friend.name[0]}</AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(friend.status)}`}
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{friend.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{friend.status}</p>
                </div>
              </div>
              
              {friend.status === 'online' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onInviteFriend(friend.child_id)}
                >
                  Invite
                </Button>
              )}
            </div>
          ))}
          
          {friends.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No friends yet!</p>
              <p className="text-xs">Add friends to play together</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsPanel;