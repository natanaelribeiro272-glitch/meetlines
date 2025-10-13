import { useState, useEffect } from "react";
import { Plus, Loader2, Camera, Image as ImageIcon, Eye, SwitchCamera, X, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import StoryViewer from "./StoryViewer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserStory {
  user_id: string;
  user_name: string;
  user_avatar: string;
  stories: {
    id: string;
    user_id: string;
    image_url: string;
    created_at: string;
    user_name: string;
    user_avatar: string;
  }[];
  hasUnviewed: boolean;
}

interface StoriesBarProps {
  mode: 'nearby' | 'friends';
}

export default function StoriesBar({ mode }: StoriesBarProps) {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [currentUserStory, setCurrentUserStory] = useState<UserStory | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStories, setSelectedStories] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showStoryOptions, setShowStoryOptions] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    loadStories();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        () => {
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadStories = async () => {
    if (!user) return;

    let allowedUserIds: string[] = [user.id]; // Always include current user
    let allowedStoryOwners: string[] = []; // Users whose stories we can see

    if (mode === 'nearby') {
      // Get current user's location
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('user_id', user.id)
        .single();

      if (!myProfile?.latitude || !myProfile?.longitude) {
        setUserStories([]);
        setCurrentUserStory(null);
        return;
      }

      // Get nearby users (within 100m)
      const { data: nearbyProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!nearbyProfiles) {
        setUserStories([]);
        setCurrentUserStory(null);
        return;
      }

      // Calculate distances and filter nearby users (100m)
      const nearbyUserIds = nearbyProfiles
        .filter(profile => {
          if (profile.user_id === user.id) return true; // Always include current user
          
          const R = 6371000; // Earth radius in meters
          const lat1 = myProfile.latitude * Math.PI / 180;
          const lat2 = profile.latitude! * Math.PI / 180;
          const deltaLat = (profile.latitude! - myProfile.latitude) * Math.PI / 180;
          const deltaLon = (profile.longitude! - myProfile.longitude) * Math.PI / 180;

          const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                   Math.cos(lat1) * Math.cos(lat2) *
                   Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          return distance <= 100; // 100m
        })
        .map(p => p.user_id);
      
      allowedUserIds = nearbyUserIds;

      // Check story visibility settings for nearby users
      const { data: nearbySettings } = await supabase
        .from('profiles')
        .select('user_id, story_visible_to')
        .in('user_id', nearbyUserIds);

      // Filter who can show stories to nearby users
      allowedStoryOwners = nearbySettings
        ?.filter(s => s.story_visible_to === 'both' || s.story_visible_to === 'nearby_only')
        .map(s => s.user_id) || [];
      
      // Always include current user
      if (!allowedStoryOwners.includes(user.id)) {
        allowedStoryOwners.push(user.id);
      }

    } else if (mode === 'friends') {
      // Get accepted friends only
      const { data: friendshipsData } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (!friendshipsData || friendshipsData.length === 0) {
        setUserStories([]);
        setCurrentUserStory(null);
        return;
      }

      // Extract friend IDs
      const friendIds = friendshipsData.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      allowedUserIds = [user.id, ...friendIds];

      // Check story visibility settings for friends
      const { data: friendSettings } = await supabase
        .from('profiles')
        .select('user_id, story_visible_to')
        .in('user_id', [user.id, ...friendIds]);

      // Filter who can show stories to friends
      allowedStoryOwners = friendSettings
        ?.filter(s => s.story_visible_to === 'both' || s.story_visible_to === 'friends_only')
        .map(s => s.user_id) || [];
      
      // Always include current user
      if (!allowedStoryOwners.includes(user.id)) {
        allowedStoryOwners.push(user.id);
      }
    }

    if (allowedUserIds.length === 0 || allowedStoryOwners.length === 0) {
      setUserStories([]);
      setCurrentUserStory(null);
      return;
    }

    // Get stories from allowed users with proper visibility (not expired)
    const { data: storiesData } = await supabase
      .from('stories')
      .select('*')
      .in('user_id', allowedStoryOwners)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!storiesData || storiesData.length === 0) {
      setUserStories([]);
      setCurrentUserStory(null);
      return;
    }

    // Check which stories the user has viewed
    const { data: viewsData } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', user.id);

    const viewedStoryIds = new Set(viewsData?.map(v => v.story_id) || []);

    // Group stories by user
    const storiesByUser = new Map<string, any[]>();
    storiesData.forEach(story => {
      if (!storiesByUser.has(story.user_id)) {
        storiesByUser.set(story.user_id, []);
      }
      storiesByUser.get(story.user_id)!.push(story);
    });

    // Get user profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', Array.from(storiesByUser.keys()));

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Build user stories array
    const userStoriesArray: UserStory[] = [];
    let currentUserStoryData: UserStory | null = null;

    storiesByUser.forEach((stories, userId) => {
      const profile = profilesMap.get(userId);
      const hasUnviewed = stories.some(s => !viewedStoryIds.has(s.id));

      const userStory: UserStory = {
        user_id: userId,
        user_name: profile?.display_name || 'Usuário',
        user_avatar: profile?.avatar_url || '',
        stories: stories.map(s => ({
          ...s,
          user_name: profile?.display_name || 'Usuário',
          user_avatar: profile?.avatar_url || ''
        })),
        hasUnviewed
      };

      if (userId === user.id) {
        currentUserStoryData = userStory;
      } else {
        userStoriesArray.push(userStory);
      }
    });

    // Sort: unviewed first
    userStoriesArray.sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    setUserStories(userStoriesArray);
    setCurrentUserStory(currentUserStoryData);
  };

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    await uploadStoryFile(file);
    e.target.value = '';
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode },
        audio: false 
      });
      
      setCameraStream(stream);
      setShowCamera(true);
      setShowUploadOptions(false);
      setShowStoryOptions(false);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Erro ao acessar a câmera');
    }
  };

  const switchCamera = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: newFacingMode },
        audio: false 
      });
      setCameraStream(stream);
    } catch (error) {
      console.error('Error switching camera:', error);
      toast.error('Erro ao trocar câmera');
    }
  };

  const capturePhoto = async () => {
    if (!cameraStream) return;

    try {
      const video = document.getElementById('camera-preview') as HTMLVideoElement;
      if (!video) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Se for câmera frontal, inverter a imagem
      if (facingMode === 'user') {
        ctx?.translate(canvas.width, 0);
        ctx?.scale(-1, 1);
      }
      
      ctx?.drawImage(video, 0, 0);

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(imageDataUrl);
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Erro ao capturar foto');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const postCapturedPhoto = async () => {
    if (!capturedImage) return;

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Stop camera
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      
      setShowCamera(false);
      setCapturedImage(null);
      
      await uploadStoryFile(file);
    } catch (error) {
      console.error('Error posting photo:', error);
      toast.error('Erro ao postar foto');
    }
  };

  const openGallery = () => {
    const input = document.getElementById('story-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const uploadStoryFile = async (file: File) => {
    if (!user) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `stories/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      // Create story
      const { data: insertData, error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          image_url: publicUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Optimistically update UI so the + disappears and click opens viewer
      setCurrentUserStory(prev => {
        const base = prev ?? {
          user_id: user.id,
          user_name: user?.user_metadata?.display_name || 'Você',
          user_avatar: user?.user_metadata?.avatar_url || '',
          stories: [],
          hasUnviewed: true,
        };
        const newStories = [
          {
            id: insertData?.id || `${Date.now()}`,
            user_id: user.id,
            image_url: publicUrl,
            created_at: insertData?.created_at || new Date().toISOString(),
            user_name: base.user_name,
            user_avatar: base.user_avatar,
          },
          ...base.stories,
        ];
        return { ...base, stories: newStories, hasUnviewed: true };
      });

      toast.success('Story publicado!');
      loadStories();
    } catch (error) {
      console.error('Error uploading story:', error);
      toast.error('Erro ao publicar story');
    } finally {
      setUploading(false);
    }
  };

  const openStoryViewer = (stories: any[], index: number = 0) => {
    setSelectedStories(stories);
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="bg-card rounded-lg p-4 shadow-card mb-4">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {/* Current user - add story */}
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <div className="relative">
                {currentUserStory && currentUserStory.stories.length > 0 ? (
                  // Has story - show clickable circle with options
                  <div 
                    className="rounded-full p-[3px] bg-green-500 cursor-pointer"
                    onClick={handleCameraCapture}
                  >
                    <div className="bg-background rounded-full p-[2px]">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>Eu</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                ) : (
                  // No story - show upload button
                  <>
                    <div className="rounded-full p-[3px] bg-gray-600">
                      <div className="bg-background rounded-full p-[2px]">
                        <div 
                          onClick={handleCameraCapture}
                          className="cursor-pointer"
                        >
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback>Eu</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="absolute bottom-0 right-0 bg-primary rounded-full p-1 z-10 cursor-pointer"
                      onClick={handleCameraCapture}
                    >
                      {uploading ? (
                        <Loader2 className="h-3 w-3 text-white animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </>
                )}
              </div>
              <span className="text-xs text-muted-foreground text-center line-clamp-1">Seu story</span>
            </div>

            {/* Hidden file input - always in DOM */}
            <input
              id="story-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadStory}
              disabled={uploading}
            />

            {/* Other users' stories */}
            {userStories.map((userStory) => (
              <div
                key={userStory.user_id}
                className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer"
                onClick={() => openStoryViewer(userStory.stories, 0)}
              >
                <div className={`rounded-full p-[3px] ${
                  userStory.hasUnviewed 
                    ? 'bg-gradient-to-tr from-yellow-400 to-pink-600' 
                    : 'bg-gray-600'
                }`}>
                  <div className="bg-background rounded-full p-[2px]">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={userStory.user_avatar} />
                      <AvatarFallback>{userStory.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground text-center line-clamp-1 max-w-[70px]">
                  {userStory.user_name}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {selectedStories.length > 0 && (
        <StoryViewer
          stories={selectedStories}
          initialIndex={selectedIndex}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          onStoryDeleted={(wasLast) => {
            if (wasLast) {
              setCurrentUserStory(null);
            }
            setSelectedStories([]);
            loadStories();
          }}
        />
      )}

      {/* Story Options Dialog (when user already has a story) - REMOVED */}

      {/* Upload Options Dialog - REMOVED */}

      {/* Camera Preview Dialog */}
      <Dialog open={showCamera} onOpenChange={closeCamera}>
        <DialogContent className="max-w-full w-full h-full p-0 m-0 overflow-hidden bg-black border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Camera Preview or Captured Image */}
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <video
                id="camera-preview"
                autoPlay
                playsInline
                muted
                ref={(video) => {
                  if (video && cameraStream) {
                    video.srcObject = cameraStream;
                  }
                }}
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
            )}

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
              <button
                onClick={closeCamera}
                className="p-2 rounded-full hover:bg-white/10 transition-smooth"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              
              {!capturedImage && (
                <button
                  onClick={switchCamera}
                  className="p-2 rounded-full hover:bg-white/10 transition-smooth"
                >
                  <SwitchCamera className="h-6 w-6 text-white" />
                </button>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-8 bg-gradient-to-t from-black/70 to-transparent">
              {capturedImage ? (
                /* Post or Retake */
                <div className="flex justify-center items-center gap-8 px-8">
                  <Button
                    onClick={retakePhoto}
                    size="lg"
                    variant="ghost"
                    className="rounded-full w-16 h-16 bg-white/10 hover:bg-white/20 border border-white/30"
                  >
                    <X className="h-6 w-6 text-white" />
                  </Button>
                  <Button
                    onClick={postCapturedPhoto}
                    size="lg"
                    className="rounded-full w-16 h-16 bg-primary hover:bg-primary-glow"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Check className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              ) : (
                /* Capture and Gallery */
                <div className="flex justify-center items-center gap-8 px-8">
                  <button
                    onClick={openGallery}
                    className="w-12 h-12 rounded-lg border-2 border-white/50 bg-white/10 hover:bg-white/20 transition-smooth flex items-center justify-center"
                  >
                    <ImageIcon className="h-6 w-6 text-white" />
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white hover:bg-white/90 transition-smooth flex items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full border-4 border-black" />
                  </button>
                  <div className="w-12 h-12" /> {/* Spacer for symmetry */}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
