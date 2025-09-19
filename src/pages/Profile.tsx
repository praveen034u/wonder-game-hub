import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { ChildProfile } from '@/types';
import { StorageService } from '@/lib/storage';
import { User, LogOut } from 'lucide-react';

const AVATARS = ['🦄', '🐸', '🦋', '🐱', '🐶', '🦊', '🐯', '🐻'];
const AGE_GROUPS = [
  { value: 'toddler', label: '2-3 years (Toddler)' },
  { value: 'preschool', label: '4-5 years (Preschool)' },
  { value: 'elementary', label: '6-8 years (Elementary)' },
  { value: 'tween', label: '9-12 years (Tween)' }
];

const Profile = () => {
  const { user, activeProfile, setActiveProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [avatar, setAvatar] = useState('🦄');
  const [isEditing, setIsEditing] = useState(!activeProfile);

  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name);
      setAgeGroup(activeProfile.ageGroup);
      setAvatar(activeProfile.avatar);
    }
  }, [activeProfile]);

  const handleSave = () => {
    if (!user || !name.trim() || !ageGroup) return;

    const profile: ChildProfile = {
      id: activeProfile?.id || `profile_${Date.now()}`,
      userId: user.id,
      name: name.trim(),
      ageGroup: ageGroup as any,
      avatar,
      createdAt: activeProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setActiveProfile(profile);
    setIsEditing(false);
    
    if (!activeProfile) {
      navigate('/modes');
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-fredoka font-bold text-primary">My Profile</h1>
        <Button variant="outline" onClick={logout} size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center text-4xl shadow-soft">
              {avatar}
            </div>
            <CardTitle className="font-fredoka">
              {isEditing ? 'Set Up Profile' : `Hello, ${name}! 👋`}
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

                <Button 
                  variant="fun" 
                  size="kid" 
                  className="w-full"
                  onClick={handleSave}
                  disabled={!name.trim() || !ageGroup}
                >
                  {activeProfile ? '💾 Save Changes' : '🚀 Start Playing!'}
                </Button>
              </>
            ) : (
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