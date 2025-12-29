import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import {
  LuArrowLeft,
  LuHeart,
  LuClock,
  LuSend,
} from "react-icons/lu";

export default function DiscussionPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState({ post: null, replies: [] });
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [postId]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/discussions/post/${postId}`, { withCredentials: true });
      setData(response.data);
    } catch (error) {
      console.error("Error fetching discussion:", error);
      toast.error("Failed to load discussion");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/discussions/reply`,
        { post_id: postId, content: replyContent },
        { withCredentials: true }
      );
      toast.success("Reply posted!");
      setReplyContent("");
      fetchData();
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async () => {
    setLiking(true);
    try {
      await axios.post(`${API}/discussions/${postId}/like`, {}, { withCredentials: true });
      setData({
        ...data,
        post: { ...data.post, likes: data.post.likes + 1 }
      });
    } catch (error) {
      console.error("Error liking post:", error);
    } finally {
      setLiking(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading || !data.post) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const { post, replies } = data;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Discussions
        </button>

        {/* Main Post */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-12 h-12 shrink-0">
              <AvatarImage src={post.user_picture} alt={post.user_name} />
              <AvatarFallback className="bg-zinc-800">{getInitials(post.user_name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold mb-1">{post.title}</h1>
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <span>{post.user_name}</span>
                <span className="flex items-center gap-1">
                  <LuClock className="w-4 h-4" />
                  {formatDate(post.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none mb-4">
            <p className="text-zinc-300 whitespace-pre-wrap">{post.content}</p>
          </div>
          
          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            <Button
              onClick={handleLikePost}
              disabled={liking}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-rose-400"
              data-testid="like-post-btn"
            >
              <LuHeart className={`w-4 h-4 mr-1 ${post.likes > 0 ? "fill-rose-400 text-rose-400" : ""}`} />
              {post.likes} likes
            </Button>
          </div>
        </div>

        {/* Reply Form */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={user?.picture} alt={user?.name} />
              <AvatarFallback className="bg-zinc-800">{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="bg-zinc-800 border-zinc-700 mb-2"
                data-testid="reply-input"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitReply}
                  disabled={submitting || !replyContent.trim()}
                  className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                  data-testid="submit-reply-btn"
                >
                  <LuSend className="w-4 h-4 mr-2" />
                  {submitting ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{replies.length} Replies</h2>
          
          {replies.map((reply) => (
            <div
              key={reply.reply_id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4"
              data-testid={`reply-${reply.reply_id}`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={reply.user_picture} alt={reply.user_name} />
                  <AvatarFallback className="bg-zinc-800 text-sm">{getInitials(reply.user_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{reply.user_name}</span>
                    <span className="text-xs text-zinc-500">{formatDate(reply.created_at)}</span>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}

          {replies.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              No replies yet. Be the first to respond!
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
