import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  LuArrowLeft,
  LuClock,
  LuCircleCheck,
  LuTarget,
  LuBookOpen,
  LuPlay,
  LuBookmark,
} from "react-icons/lu";

export default function LabDetail() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetchLab();
    fetchBookmark();
  }, [labId]);

  const fetchLab = async () => {
    try {
      const response = await axios.get(`${API}/labs/${labId}`, { withCredentials: true });
      setLab(response.data);
    } catch (error) {
      console.error("Error fetching lab:", error);
      toast.error("Failed to load lab details");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmark = async () => {
    try {
      const response = await axios.get(`${API}/bookmarks`, { withCredentials: true });
      const isBookmarked = response.data.some(b => b.lab_id === labId);
      setBookmarked(isBookmarked);
    } catch (error) {
      console.error("Error fetching bookmark:", error);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      await axios.post(
        `${API}/bookmarks`,
        { lab_id: labId, bookmarked: !bookmarked },
        { withCredentials: true }
      );
      setBookmarked(!bookmarked);
      toast.success(bookmarked ? "Bookmark removed" : "Lab bookmarked!");
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  if (loading || !lab) {
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
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Lab Header */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-cyan-500/20 text-cyan-400">{lab.difficulty}</Badge>
              <Badge variant="outline">{lab.exam_domain}</Badge>
            </div>
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                bookmarked ? "bg-amber-500/20 text-amber-400" : "hover:bg-white/5 text-zinc-400"
              }`}
              data-testid="bookmark-btn"
              title={bookmarked ? "Remove bookmark" : "Bookmark this lab"}
            >
              <LuBookmark className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`} />
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{lab.title}</h1>
          <p className="text-zinc-400 mb-4">{lab.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <LuClock className="w-4 h-4" />
              <span>{lab.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <LuTarget className="w-4 h-4" />
              <span>{lab.skill_trained}</span>
            </div>
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LuBookOpen className="w-5 h-5 text-cyan-400" />
            What You'll Learn
          </h2>
          <ul className="space-y-3">
            {lab.instructions?.map((instruction, index) => (
              <li key={index} className="flex items-start gap-3">
                <LuCircleCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-zinc-300">{instruction.title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prerequisites */}
        {lab.prerequisites?.length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Prerequisites</h2>
            <ul className="space-y-2">
              {lab.prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-center gap-2 text-zinc-400">
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                  {prereq}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lab Steps Preview */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Lab Steps</h2>
          <div className="space-y-3">
            {lab.instructions?.map((instruction, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg"
              >
                <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-mono">{instruction.step}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{instruction.title}</div>
                  <div className="text-sm text-zinc-500">{instruction.check}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Lab Button */}
        <Button
          onClick={() => navigate(`/lab/${labId}/active`)}
          size="lg"
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold h-14 text-lg glow-cyan"
          data-testid="start-lab-btn"
        >
          <LuPlay className="w-5 h-5 mr-2" />
          Start Lab
        </Button>
      </div>
    </Layout>
  );
}
