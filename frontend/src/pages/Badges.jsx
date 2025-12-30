import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import Layout from "../components/Layout";
import { Progress } from "../components/ui/progress";
import {
  LuTerminal,
  LuFileText,
  LuFolder,
  LuAward,
  LuStar,
  LuCloud,
  LuFlame,
  LuZap,
  LuMessageSquare,
  LuHeart,
  LuLock,
} from "react-icons/lu";

const iconMap = {
  "terminal": LuTerminal,
  "file-text": LuFileText,
  "folder": LuFolder,
  "award": LuAward,
  "star": LuStar,
  "cloud": LuCloud,
  "flame": LuFlame,
  "zap": LuZap,
  "message": LuMessageSquare,
  "heart": LuHeart,
};

export default function Badges() {
  const [badgesData, setBadgesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await axios.get(`${API}/badges`, { withCredentials: true });
      setBadgesData(response.data);
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast.error("Failed to load badges");
    } finally {
      setLoading(false);
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

  const earned = badgesData?.earned || [];
  const available = badgesData?.available || [];
  const stats = badgesData?.stats || {};

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Achievement Badges</h1>
          <p className="text-zinc-400">
            Earn badges by completing labs, assessments, and projects
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400">{stats.xp?.toLocaleString() || 0}</div>
            <div className="text-sm text-zinc-500">Total XP</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{earned.length}</div>
            <div className="text-sm text-zinc-500">Badges Earned</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{stats.labs || 0}</div>
            <div className="text-sm text-zinc-500">Labs Completed</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-indigo-400">{stats.certificates || 0}</div>
            <div className="text-sm text-zinc-500">Certificates</div>
          </div>
        </div>

        {/* Earned Badges */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LuAward className="text-amber-400" />
            Earned Badges ({earned.length})
          </h2>
          {earned.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earned.map((badge) => {
                const Icon = iconMap[badge.icon] || LuAward;
                return (
                  <div
                    key={badge.badge_id}
                    className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 text-center"
                  >
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-amber-300">{badge.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 text-center">
              <LuAward className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">Complete activities to earn your first badge!</p>
            </div>
          )}
        </div>

        {/* Available Badges */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LuLock className="text-zinc-500" />
            Available Badges ({available.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {available.map((badge) => {
              const Icon = iconMap[badge.icon] || LuAward;
              const progressPercent = (badge.progress / badge.progress_max) * 100;
              return (
                <div
                  key={badge.badge_id}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 relative">
                    <Icon className="w-8 h-8 text-zinc-500" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center">
                      <LuLock className="w-3 h-3 text-zinc-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-zinc-300">{badge.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{badge.description}</p>
                  <div className="mt-3">
                    <Progress value={progressPercent} className="h-1.5" />
                    <p className="text-xs text-zinc-500 mt-1">
                      {badge.progress} / {badge.progress_max}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
