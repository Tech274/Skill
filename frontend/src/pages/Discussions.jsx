import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  LuArrowLeft,
  LuMessageSquare,
  LuHeart,
  LuPlus,
  LuClock,
  LuUser,
} from "react-icons/lu";

export default function Discussions() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState({ posts: [], total: 0, page: 1, pages: 1 });
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [certId]);

  const fetchData = async () => {
    try {
      const [discussionsRes, certRes] = await Promise.all([
        axios.get(`${API}/discussions/${certId}`, { withCredentials: true }),
        axios.get(`${API}/certifications/${certId}`, { withCredentials: true }),
      ]);
      setDiscussions(discussionsRes.data);
      setCertification(certRes.data);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      toast.error("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/discussions`,
        { cert_id: certId, ...newPost },
        { withCredentials: true }
      );
      toast.success("Post created!");
      setNewPostOpen(false);
      setNewPost({ title: "", content: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Discussion Forum</h1>
            <p className="text-zinc-400">
              {certification?.name} • {discussions.total} discussions
            </p>
          </div>
          
          <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950" data-testid="new-post-btn">
                <LuPlus className="w-4 h-4 mr-2" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>Start a Discussion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Title</label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="What's your question or topic?"
                    className="bg-zinc-800 border-zinc-700"
                    data-testid="post-title-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Content</label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Describe your question or share your thoughts..."
                    className="bg-zinc-800 border-zinc-700 min-h-[150px]"
                    data-testid="post-content-input"
                  />
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={submitting}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                  data-testid="submit-post-btn"
                >
                  {submitting ? "Creating..." : "Post Discussion"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Discussion List */}
        <div className="space-y-4">
          {discussions.posts.map((post) => (
            <div
              key={post.post_id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all cursor-pointer"
              onClick={() => navigate(`/discussions/post/${post.post_id}`)}
              data-testid={`discussion-${post.post_id}`}
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={post.user_picture} alt={post.user_name} />
                  <AvatarFallback className="bg-zinc-800 text-sm">{getInitials(post.user_name)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">{post.title}</h3>
                  <p className="text-zinc-400 text-sm line-clamp-2 mb-3">{post.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1">
                      <LuUser className="w-4 h-4" />
                      {post.user_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <LuClock className="w-4 h-4" />
                      {formatDate(post.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <LuMessageSquare className="w-4 h-4" />
                      {post.reply_count} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <LuHeart className="w-4 h-4" />
                      {post.likes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {discussions.posts.length === 0 && (
            <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-xl">
              <LuMessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 mb-2">No discussions yet</p>
              <p className="text-sm text-zinc-500">Be the first to start a conversation!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
