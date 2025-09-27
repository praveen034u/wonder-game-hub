import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface FriendRequest {
  id: string;
  requester: {
    id: string;
    name: string;
    avatar: string;
  };
  created_at: string;
}

interface SearchResult {
  id: string;
  name: string;
  avatar: string;
}

interface FriendsPanelProps {
  onInviteFriend: (friendId: string) => void;
}

const FriendsPanel = ({ onInviteFriend }: FriendsPanelProps) => {
  const { selectedChild } = useAppContext();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      loadFriends();
      loadFriendRequests();
    }
  }, [selectedChild]);

  const loadFriends = async () => {
    if (!selectedChild?.id) return;

    try {
      setIsLoading(true);
      
      // Get friendships where current child is involved
      const { data: friendships, error } = await supabase
        .from('friends')
        .select('*')
        .or(`requester_id.eq.${selectedChild.id},addressee_id.eq.${selectedChild.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Get friend profiles for each friendship
      const friendsList: Friend[] = [];
      
      for (const friendship of friendships || []) {
        const friendId = friendship.requester_id === selectedChild.id 
          ? friendship.addressee_id 
          : friendship.requester_id;
        
        const { data: friendProfile, error: profileError } = await supabase
          .from('children_profiles')
          .select('id, name, avatar')
          .eq('id', friendId)
          .single();

        if (!profileError && friendProfile) {
          friendsList.push({
            id: friendship.id,
            name: friendProfile.name,
            avatar: friendProfile.avatar || '👤',
            status: 'offline' as const, // In real app, would check online status
            child_id: friendProfile.id
          });
        }
      }

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

  const loadFriendRequests = async () => {
    if (!selectedChild?.id) return;

    try {
      const { data } = await supabase.functions.invoke('manage-friends', {
        body: {
          action: 'get_friend_requests',
          child_id: selectedChild.id
        }
      });

      if (data?.success) {
        setFriendRequests(data.data);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const searchChildren = async () => {
    if (!selectedChild?.id || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const { data } = await supabase.functions.invoke('manage-friends', {
        body: {
          action: 'search_children',
          child_id: selectedChild.id,
          search_query: searchQuery
        }
      });

      if (data?.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching children:', error);
      toast({
        title: "Error",
        description: "Failed to search for friends",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (friendChildId: string) => {
    if (!selectedChild?.id) return;

    try {
      setIsLoading(true);
      const { data } = await supabase.functions.invoke('manage-friends', {
        body: {
          action: 'send_friend_request',
          child_id: selectedChild.id,
          friend_child_id: friendChildId
        }
      });

      if (data?.success) {
        toast({
          title: "Friend Request Sent",
          description: "Your friend request has been sent!",
        });
        setSearchQuery("");
        setSearchResults([]);
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to send friend request",
          variant: "destructive",
        });
      }
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

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      setIsLoading(true);
      const { data } = await supabase.functions.invoke('manage-friends', {
        body: {
          action: action === 'accept' ? 'accept_friend_request' : 'decline_friend_request',
          friend_request_id: requestId
        }
      });

      if (data?.success) {
        toast({
          title: action === 'accept' ? "Friend Request Accepted" : "Friend Request Declined",
          description: action === 'accept' ? "You are now friends!" : "Friend request declined",
        });
        loadFriendRequests();
        if (action === 'accept') {
          loadFriends();
        }
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast({
        title: "Error",
        description: "Failed to handle friend request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchChildren();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'in-game': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👥 Friends
          <Badge variant="secondary">{friends.length}</Badge>
          {friendRequests.length > 0 && (
            <Badge variant="destructive">{friendRequests.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 h-full">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            <ScrollArea className="h-60">
              <div className="space-y-2">
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
                
                {friends.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No friends yet!</p>
                    <p className="text-xs">Search and add friends to play together</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={request.requester.avatar} />
                        <AvatarFallback>{request.requester.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{request.requester.name}</p>
                        <p className="text-xs text-muted-foreground">wants to be friends</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFriendRequest(request.id, 'accept')}
                        disabled={isLoading}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFriendRequest(request.id, 'decline')}
                        disabled={isLoading}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
                
                {friendRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No friend requests</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <ScrollArea className="h-60">
              <div className="space-y-2">
                {isSearching && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Searching...</p>
                  </div>
                )}
                
                {!isSearching && searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={result.avatar} />
                        <AvatarFallback>{result.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{result.name}</p>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(result.id)}
                      disabled={isLoading}
                    >
                      Add Friend
                    </Button>
                  </div>
                ))}
                
                {!isSearching && searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No users found</p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                )}
                
                {!searchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Search for friends by name</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FriendsPanel;