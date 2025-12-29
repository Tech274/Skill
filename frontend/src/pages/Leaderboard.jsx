import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  LuTrophy,
  LuMedal,
  LuAward,
  LuFlame,
  LuTerminal,
  LuFileText,
  LuFolderKanban,
  LuArrowUp,
  LuArrowDown,
  LuMinus,
} from "react-icons/lu";

const rankColors = {
  1: "from-amber-400 to-yellow-600",
  2: "from-zinc-300 to-zinc-500",
  3: "from-amber-600 to-amber-800",
};

const rankIcons = {
  1: LuTrophy,
  2: LuMedal,
  3: LuAward,
};

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leaderboardRes, myRankRes] = await Promise.all([
        axios.get(`${API}/leaderboard`, { withCredentials: true }),
        axios.get(`${API}/leaderboard/me`, { withCredentials: true }),
      ]);
      setLeaderboard(leaderboardRes.data);
      setMyRank(myRankRes.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatXP = (xp) => {
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-zinc-400">
            Top learners ranked by XP earned through labs, assessments, and projects
          </p>
        </div>

        {/* My Rank Card */}
        {myRank && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={myRank.picture} alt={myRank.name} />
                    <AvatarFallback className="bg-zinc-800 text-xl">{getInitials(myRank.name)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-zinc-950">
                    #{myRank.rank}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{myRank.name}</h3>
                  <p className="text-zinc-400">Your current ranking</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">{formatXP(myRank.xp)}</div>
                  <div className="text-xs text-zinc-500">Total XP</div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">{myRank.labs_completed}</div>
                    <div className="text-xs text-zinc-500">Labs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{myRank.assessments_passed}</div>
                    <div className="text-xs text-zinc-500">Tests</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{myRank.projects_completed}</div>
                    <div className="text-xs text-zinc-500">Projects</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{myRank.certificates_earned}</div>
                    <div className="text-xs text-zinc-500">Certs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* XP Guide */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <LuFlame className="w-4 h-4 text-amber-400" />
            XP Rewards
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <LuTerminal className="w-4 h-4 text-cyan-400" />
              <span className="text-zinc-400">Lab: <span className="text-white">100 XP</span></span>
            </div>
            <div className="flex items-center gap-2">
              <LuFileText className="w-4 h-4 text-indigo-400" />
              <span className="text-zinc-400">Assessment: <span className="text-white">150 XP</span></span>
            </div>
            <div className="flex items-center gap-2">
              <LuFolderKanban className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-400">Project: <span className="text-white">200 XP</span></span>
            </div>
            <div className="flex items-center gap-2">
              <LuAward className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-400">Certificate: <span className="text-white">500 XP</span></span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-end justify-center gap-4">
                {/* 2nd Place */}
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2 ring-2 ring-zinc-400">
                    <AvatarImage src={leaderboard[1]?.picture} alt={leaderboard[1]?.name} />
                    <AvatarFallback className="bg-zinc-800">{getInitials(leaderboard[1]?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="bg-gradient-to-b from-zinc-400 to-zinc-600 w-16 h-20 rounded-t-lg mx-auto flex items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-900">2</span>
                  </div>
                  <p className="text-sm font-semibold mt-2 truncate max-w-[80px]">{leaderboard[1]?.name?.split(" ")[0]}</p>
                  <p className="text-xs text-zinc-500">{formatXP(leaderboard[1]?.xp)} XP</p>
                </div>
                
                {/* 1st Place */}
                <div className="text-center">
                  <div className="relative">
                    <Avatar className="w-20 h-20 mx-auto mb-2 ring-4 ring-amber-400">
                      <AvatarImage src={leaderboard[0]?.picture} alt={leaderboard[0]?.name} />
                      <AvatarFallback className="bg-zinc-800 text-xl">{getInitials(leaderboard[0]?.name)}</AvatarFallback>
                    </Avatar>
                    <LuTrophy className="absolute -top-2 -right-2 w-8 h-8 text-amber-400" />
                  </div>
                  <div className="bg-gradient-to-b from-amber-400 to-amber-600 w-20 h-28 rounded-t-lg mx-auto flex items-center justify-center">
                    <span className="text-3xl font-bold text-zinc-900">1</span>
                  </div>
                  <p className="text-sm font-semibold mt-2 truncate max-w-[100px]">{leaderboard[0]?.name?.split(" ")[0]}</p>
                  <p className="text-xs text-cyan-400">{formatXP(leaderboard[0]?.xp)} XP</p>
                </div>
                
                {/* 3rd Place */}
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2 ring-2 ring-amber-700">
                    <AvatarImage src={leaderboard[2]?.picture} alt={leaderboard[2]?.name} />
                    <AvatarFallback className="bg-zinc-800">{getInitials(leaderboard[2]?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="bg-gradient-to-b from-amber-700 to-amber-900 w-16 h-16 rounded-t-lg mx-auto flex items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-200">3</span>
                  </div>
                  <p className="text-sm font-semibold mt-2 truncate max-w-[80px]">{leaderboard[2]?.name?.split(" ")[0]}</p>
                  <p className="text-xs text-zinc-500">{formatXP(leaderboard[2]?.xp)} XP</p>
                </div>
              </div>
            </div>
          )}

          {/* Rest of Leaderboard */}
          <div className="divide-y divide-zinc-800">
            {leaderboard.slice(3).map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 hover:bg-zinc-800/30 transition-colors ${
                  entry.user_id === user?.user_id ? "bg-cyan-500/5" : ""
                }`}
                data-testid={`leaderboard-entry-${entry.rank}`}
              >
                <div className="w-8 text-center font-mono text-zinc-500">
                  {entry.rank}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.picture} alt={entry.name} />
                  <AvatarFallback className="bg-zinc-800 text-sm">{getInitials(entry.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.name}</div>
                  <div className="text-xs text-zinc-500">
                    {entry.labs_completed} labs • {entry.assessments_passed} tests • {entry.projects_completed} projects
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyan-400">{formatXP(entry.xp)} XP</div>
                  {entry.certificates_earned > 0 && (
                    <div className="flex items-center justify-end gap-1 text-xs text-amber-400">
                      <LuAward className="w-3 h-3" />
                      {entry.certificates_earned}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-12">
              <LuTrophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No rankings yet</p>
              <p className="text-sm text-zinc-500">Complete labs and assessments to climb the leaderboard!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
