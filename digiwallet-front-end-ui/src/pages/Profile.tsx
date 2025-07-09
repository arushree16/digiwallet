import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optionally fetch fresh profile data from backend if needed
    if (user) {
      setProfile(user);
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your unique user information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="font-semibold">User ID:</span>
              <span className="ml-2 text-blue-700 select-all">{profile._id || profile.id}</span>
            </div>
            <div>
              <span className="font-semibold">Username:</span>
              <span className="ml-2">{profile.username}</span>
            </div>
            <div>
              <span className="font-semibold">Email:</span>
              <span className="ml-2">{profile.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
