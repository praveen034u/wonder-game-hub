import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppAuth, useAppContext } from '@/contexts/Auth0Context';
import { LogoutButton } from '@/components/Auth/LogoutButton';
import { User, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AVATARS = ['🦄', '🐸', '🦋', '🐱', '🐶', '🦊', '🐯', '🐻'];
const AGE_GROUPS = [
  { value: 'toddler', label: '2-3 years (Toddler)' },
  { value: 'preschool', label: '4-5 years (Preschool)' },
  { value: 'elementary', label: '6-8 years (Elementary)' },
  { value: 'tween', label: '9-12 years (Tween)' }
];

const Profile = () => {
  const { user } = useAppAuth();
  const { parentProfile, selectedChild, setSelectedChild, childrenProfiles, refreshProfiles } = useAppContext();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [avatar, setAvatar] = useState('🦄');
  const [isEditing, setIsEditing] = useState(!selectedChild);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      setName(selectedChild.name);
      setAgeGroup(selectedChild.age_group);
      setAvatar(selectedChild.avatar || '🦄');
    }
  }, [selectedChild]);

  const handleSave = async () => {
    if (!user?.sub || !name.trim() || !ageGroup || !parentProfile) return;

    setIsLoading(true);
    try {
      const profileData = {
        name: name.trim(),
        age_group: ageGroup,
        avatar,
        parent_id: parentProfile.id
      };

      const { data, error } = await supabase.functions.invoke('manage-profiles', {
        body: {
          action: selectedChild ? 'update_child' : 'create_child',
          auth0_user_id: user.sub,
          profile_data: selectedChild ? { ...profileData, id: selectedChild.id } : profileData
        }
      });

      if (error) throw error;

      await refreshProfiles();
      
      if (!selectedChild && data) {
        // Set the newly created child as selected
        setSelectedChild(data);
      }
      
      setIsEditing(false);
      
      if (!selectedChild) {
        // First time profile creation - redirect to modes
        navigate('/modes');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-fredoka font-bold text-primary">My Profile</h1>
        <LogoutButton />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Existing Children List */}
        {!isEditing && childrenProfiles.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-fredoka text-center">My Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {childrenProfiles.map(child => (
                  <div 
                    key={child.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedChild?.id === child.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedChild(child)}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-3xl">{child.avatar || '👤'}</div>
                      <h3 className="font-fredoka font-bold">{child.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{child.age_group}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChild(child);
                          setIsEditing(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center space-y-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setName('');
                    setAgeGroup('');
                    setAvatar('🦄');
                    setSelectedChild(null);
                    setIsEditing(true);
                  }}
                >
                  ➕ Add Another Child
                </Button>
                <Button 
                  variant="fun" 
                  size="kid" 
                  className="w-full"
                  onClick={() => navigate('/modes')}
                >
                  🎮 Play Games & Stories
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center text-4xl shadow-soft">
              {avatar}
            </div>
            <CardTitle className="font-fredoka">
              {isEditing ? (selectedChild ? 'Edit Profile' : 'Add New Child') : `Hello, ${name}! 👋`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label className="font-comic font-bold">Child's Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="h-12 text-lg font-comic rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-comic font-bold">Age Group</Label>
                  <Select value={ageGroup} onValueChange={setAgeGroup}>
                    <SelectTrigger className="h-12 text-lg font-comic rounded-xl">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_GROUPS.map(group => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-comic font-bold">Choose Avatar</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATARS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`w-12 h-12 text-2xl rounded-xl border-2 transition-all ${
                          avatar === emoji 
                            ? 'border-primary bg-primary/10 scale-110' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="fun" 
                    size="kid" 
                    className="flex-1"
                    onClick={handleSave}
                    disabled={!name.trim() || !ageGroup || isLoading}
                  >
                    {isLoading ? '💾 Saving...' : (selectedChild ? '💾 Save Changes' : '🚀 Create Profile')}
                  </Button>
                  {childrenProfiles.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        if (!selectedChild && childrenProfiles.length > 0) {
                          setSelectedChild(childrenProfiles[0]);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            ) : selectedChild && (
              <div className="space-y-4 text-center">
                <p className="font-comic text-lg">Ready for more adventures?</p>
                <div className="space-y-3">
                  <Button 
                    variant="fun" 
                    size="kid" 
                    className="w-full"
                    onClick={() => navigate('/modes')}
                  >
                    🎮 Play Games & Stories
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default"
                    onClick={() => setIsEditing(true)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;