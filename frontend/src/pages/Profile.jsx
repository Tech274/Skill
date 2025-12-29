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
  LuAward,
  LuDownload,
  LuShare2,
  LuTerminal,
  LuFileText,
  LuFolderKanban,
  LuCrown,
} from "react-icons/lu";
import { SiAmazonwebservices, SiMicrosoftazure, SiGooglecloud } from "react-icons/si";

const vendorIcons = {
  AWS: SiAmazonwebservices,
  Azure: SiMicrosoftazure,
  GCP: SiGooglecloud,
  DevOps: LuTerminal,
};

const vendorColors = {
  AWS: "#FF9900",
  Azure: "#0078D4",
  GCP: "#4285F4",
  DevOps: "#22C55E",
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`, { withCredentials: true });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const stats = dashboardData?.stats || {};
  const certifications = dashboardData?.certifications || [];
  const completedCerts = certifications.filter((c) => c.readiness_percentage >= 80);

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
        {/* Profile Header */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user?.picture} alt={user?.name} />
              <AvatarFallback className="bg-zinc-800 text-2xl">{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                {user?.subscription_status === "premium" && (
                  <Badge className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-0">
                    <LuCrown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-zinc-400">{user?.email}</p>
            </div>

            <div className="flex gap-2">
              {user?.subscription_status !== "premium" && (
                <Button
                  onClick={() => navigate("/checkout")}
                  className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                >
                  Upgrade to Premium
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-zinc-700"
                data-testid="logout-btn"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <LuTerminal className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total_labs_completed || 0}</div>
            <div className="text-sm text-zinc-500">Labs</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <LuFileText className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total_assessments_passed || 0}</div>
            <div className="text-sm text-zinc-500">Assessments</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <LuFolderKanban className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total_projects_completed || 0}</div>
            <div className="text-sm text-zinc-500">Projects</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <LuAward className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{completedCerts.length}</div>
            <div className="text-sm text-zinc-500">Certificates</div>
          </div>
        </div>

        {/* Earned Certificates */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LuAward className="w-5 h-5 text-amber-400" />
            Earned Certificates
          </h2>
          
          {completedCerts.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {completedCerts.map((cert) => {
                const VendorIcon = vendorIcons[cert.vendor] || LuTerminal;
                const vendorColor = vendorColors[cert.vendor] || "#22C55E";
                
                return (
                  <div
                    key={cert.cert_id}
                    className="bg-gradient-to-br from-amber-500/10 to-zinc-900/50 border border-amber-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${vendorColor}20` }}
                      >
                        <VendorIcon className="w-5 h-5" style={{ color: vendorColor }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{cert.cert_name}</h3>
                        <p className="text-xs text-zinc-500">{cert.vendor}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-500/20 text-amber-400">
                        {cert.readiness_percentage}% Ready
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <LuDownload className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <LuShare2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <LuAward className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 mb-2">No certificates earned yet</p>
              <p className="text-sm text-zinc-500">
                Achieve 80%+ readiness on a certification to earn your certificate
              </p>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Badges</h2>
          
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {/* First Lab Badge */}
            <div className={`text-center ${stats.total_labs_completed > 0 ? "" : "opacity-40"}`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <LuTerminal className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-xs text-zinc-400">First Lab</p>
            </div>
            
            {/* Lab Expert Badge */}
            <div className={`text-center ${stats.total_labs_completed >= 10 ? "" : "opacity-40"}`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <LuTerminal className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-xs text-zinc-400">Lab Expert</p>
            </div>
            
            {/* Assessment Ace Badge */}
            <div className={`text-center ${stats.total_assessments_passed >= 5 ? "" : "opacity-40"}`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <LuFileText className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-xs text-zinc-400">Assessment Ace</p>
            </div>
            
            {/* Project Builder Badge */}
            <div className={`text-center ${stats.total_projects_completed > 0 ? "" : "opacity-40"}`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <LuFolderKanban className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-xs text-zinc-400">Builder</p>
            </div>
            
            {/* Multi-Cloud Badge */}
            <div className={`text-center ${stats.certifications_in_progress >= 3 ? "" : "opacity-40"}`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
                <LuAward className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-xs text-zinc-400">Multi-Cloud</p>
            </div>
            
            {/* Premium Badge */}
            <div className={`text-center ${user?.subscription_status === "premium" ? "" : "opacity-40"}`}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                <LuCrown className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-xs text-zinc-400">Premium</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
