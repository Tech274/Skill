import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  LuArrowLeft,
  LuPlay,
  LuClock,
  LuCircleCheck,
  LuCircle,
  LuVideo,
} from "react-icons/lu";

export default function Videos() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [certification, setCertification] = useState(null);
  const [progress, setProgress] = useState({ watched_videos: [], progress_percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    fetchData();
  }, [certId]);

  const fetchData = async () => {
    try {
      const [videosRes, certRes, progressRes] = await Promise.all([
        axios.get(`${API}/videos/${certId}`, { withCredentials: true }),
        axios.get(`${API}/certifications/${certId}`, { withCredentials: true }),
        axios.get(`${API}/videos/${certId}/progress`, { withCredentials: true }),
      ]);
      setVideos(videosRes.data);
      setCertification(certRes.data);
      setProgress(progressRes.data);
      
      // Auto-select first unwatched video
      const firstUnwatched = videosRes.data.find(v => !progressRes.data.watched_videos.includes(v.video_id));
      if (firstUnwatched) {
        setSelectedVideo(firstUnwatched);
      } else if (videosRes.data.length > 0) {
        setSelectedVideo(videosRes.data[0]);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (videoId) => {
    setMarkingComplete(true);
    try {
      await axios.post(`${API}/videos/${videoId}/complete`, {}, { withCredentials: true });
      toast.success("Video marked as complete!");
      
      // Update progress
      const progressRes = await axios.get(`${API}/videos/${certId}/progress`, { withCredentials: true });
      setProgress(progressRes.data);
    } catch (error) {
      console.error("Error marking video complete:", error);
      toast.error("Failed to mark video complete");
    } finally {
      setMarkingComplete(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const isWatched = (videoId) => progress.watched_videos.includes(videoId);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/certification/${certId}`)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to {certification?.name}
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Video Lessons</h1>
          <div className="flex items-center gap-4">
            <p className="text-zinc-400">{certification?.name}</p>
            <Badge variant="outline">
              {progress.watched_count}/{progress.total_count} watched
            </Badge>
          </div>
          <div className="mt-2">
            <Progress value={progress.progress_percentage} className="h-2 w-64" />
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-xl">
            <LuVideo className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No video content available yet</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {selectedVideo && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Video Embed */}
                  <div className="aspect-video bg-zinc-950">
                    <iframe
                      src={selectedVideo.youtube_url}
                      title={selectedVideo.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  
                  {/* Video Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h2 className="text-xl font-bold mb-1">{selectedVideo.title}</h2>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                          <span className="flex items-center gap-1">
                            <LuClock className="w-4 h-4" />
                            {selectedVideo.duration_minutes} min
                          </span>
                          {isWatched(selectedVideo.video_id) && (
                            <Badge className="bg-emerald-500/20 text-emerald-400">
                              <LuCircleCheck className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {!isWatched(selectedVideo.video_id) && (
                        <Button
                          onClick={() => handleMarkComplete(selectedVideo.video_id)}
                          disabled={markingComplete}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white"
                          data-testid="mark-complete-btn"
                        >
                          <LuCircleCheck className="w-4 h-4 mr-2" />
                          {markingComplete ? "Marking..." : "Mark Complete"}
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-zinc-400">{selectedVideo.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video List */}
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">All Videos</h3>
              {videos.map((video, index) => {
                const watched = isWatched(video.video_id);
                const isSelected = selectedVideo?.video_id === video.video_id;
                
                return (
                  <div
                    key={video.video_id}
                    onClick={() => setSelectedVideo(video)}
                    className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-cyan-500/10 border border-cyan-500/30"
                        : "bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700"
                    }`}
                    data-testid={`video-item-${video.video_id}`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                          <LuPlay className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>
                      {watched && (
                        <div className="absolute top-1 right-1">
                          <LuCircleCheck className="w-5 h-5 text-emerald-400 bg-zinc-900 rounded-full" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{video.duration_minutes} min</span>
                        <span>•</span>
                        <span>Video {index + 1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
