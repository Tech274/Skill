import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  LuArrowRight,
  LuTerminal,
  LuFileText,
  LuFolderKanban,
  LuTarget,
  LuTrendingUp,
  LuZap,
  LuAlertTriangle,
  LuSparkles,
  LuMap,
} from "react-icons/lu";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";

const vendorIcons = {
  AWS: FaAws,
  Azure: VscAzure,
  GCP: SiGooglecloud,
  DevOps: LuTerminal,
};

const vendorColors = {
  AWS: "#FF9900",
  Azure: "#0078D4",
  GCP: "#4285F4",
  DevOps: "#22C55E",
};

// Helper to get domain score color
const getDomainColor = (score) => {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
};

const getDomainTextColor = (score) => {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashRes, engageRes] = await Promise.all([
        axios.get(`${API}/dashboard`, { withCredentials: true }),
        axios.get(`${API}/engagement/status`, { withCredentials: true }).catch(() => null)
      ]);
      
      setDashboardData(dashRes.data);
      if (engageRes) setEngagement(engageRes.data);
      
      // Fetch recommendations for first certification
      const certs = dashRes.data?.certifications || [];
      if (certs.length > 0) {
        const recRes = await axios.get(`${API}/recommendations/${certs[0].cert_id}`, { withCredentials: true });
        setRecommendations(recRes.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard");
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

  const stats = dashboardData?.stats || {};
  const certifications = dashboardData?.certifications || [];

  // Prepare chart data
  const barChartData = certifications.map((cert) => ({
    name: cert.cert_name?.split(" ").slice(0, 2).join(" ") || "Unknown",
    readiness: cert.readiness_percentage || 0,
    vendor: cert.vendor,
  }));

  const radialData = [
    {
      name: "Labs",
      value: stats.total_labs_completed || 0,
      fill: "#22D3EE",
    },
    {
      name: "Assessments",
      value: stats.total_assessments_passed || 0,
      fill: "#818CF8",
    },
    {
      name: "Projects",
      value: stats.total_projects_completed || 0,
      fill: "#34D399",
    },
  ];

  // Calculate overall readiness
  const overallReadiness = certifications.length > 0
    ? Math.round(certifications.reduce((sum, cert) => sum + (cert.readiness_percentage || 0), 0) / certifications.length)
    : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Skilltrack Dashboard</h1>
          <p className="text-zinc-400">
            Track your certification progress and skill development
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <LuTerminal className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-sm text-zinc-400">Labs Completed</span>
            </div>
            <div className="text-3xl font-bold">{stats.total_labs_completed || 0}</div>
          </div>
          
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <LuFileText className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-sm text-zinc-400">Assessments Passed</span>
            </div>
            <div className="text-3xl font-bold">{stats.total_assessments_passed || 0}</div>
          </div>
          
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <LuFolderKanban className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-zinc-400">Projects Completed</span>
            </div>
            <div className="text-3xl font-bold">{stats.total_projects_completed || 0}</div>
          </div>
          
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <LuTarget className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-zinc-400">Certifications</span>
            </div>
            <div className="text-3xl font-bold">{stats.certifications_in_progress || 0}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Readiness */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LuTarget className="w-5 h-5 text-cyan-400" />
              Overall Readiness
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="hsl(240 3.7% 15.9%)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="hsl(187 100% 42%)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${overallReadiness * 4.4} 440`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">{overallReadiness}%</div>
                    <div className="text-xs text-zinc-500">Average</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certification Readiness Chart */}
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LuTrendingUp className="w-5 h-5 text-indigo-400" />
              Certification Readiness
            </h3>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="readiness" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-zinc-500">
                No certification progress yet
              </div>
            )}
          </div>
        </div>

        {/* Certifications List */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Active Certifications</h3>
            <Button
              onClick={() => navigate("/hub")}
              variant="outline"
              size="sm"
              className="border-zinc-700"
            >
              View All
              <LuArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {certifications.length > 0 ? (
            <div className="space-y-4">
              {certifications.map((cert) => {
                const VendorIcon = vendorIcons[cert.vendor] || LuTerminal;
                const vendorColor = vendorColors[cert.vendor] || "#22C55E";
                
                return (
                  <div
                    key={cert.cert_id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
                    onClick={() => navigate(`/certification/${cert.cert_id}`)}
                    data-testid={`dash-cert-${cert.cert_id}`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${vendorColor}20` }}
                    >
                      <VendorIcon className="w-5 h-5" style={{ color: vendorColor }} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{cert.cert_name}</h4>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {cert.vendor}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-zinc-500">
                        <span>{cert.labs_completed}/{cert.labs_total} labs</span>
                        <span>{cert.assessments_passed}/{cert.assessments_total} assessments</span>
                        <span>{cert.projects_completed}/{cert.projects_total} projects</span>
                      </div>
                    </div>

                    <div className="sm:w-32 sm:text-right">
                      <div className="text-lg font-bold text-cyan-400 font-mono">
                        {cert.readiness_percentage}%
                      </div>
                      <Progress value={cert.readiness_percentage} className="h-1.5 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <LuZap className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 mb-4">No certifications started yet</p>
              <Button
                onClick={() => navigate("/hub")}
                className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
              >
                Browse Certifications
                <LuArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Next Best Action */}
        {certifications.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <LuSparkles className="w-5 h-5 text-cyan-400" />
                  Smart Next Action
                </h3>
                {recommendations ? (
                  <div>
                    <p className="text-zinc-400 mb-2">
                      {recommendations.action_reason}
                    </p>
                    {recommendations.primary_action === "lab" && recommendations.next_lab && (
                      <div className="flex items-center gap-2 text-sm text-cyan-300">
                        <LuTerminal className="w-4 h-4" />
                        <span>Recommended: {recommendations.next_lab.title}</span>
                      </div>
                    )}
                    {recommendations.primary_action === "assessment" && recommendations.next_assessment && (
                      <div className="flex items-center gap-2 text-sm text-indigo-300">
                        <LuFileText className="w-4 h-4" />
                        <span>Recommended: {recommendations.next_assessment.title}</span>
                      </div>
                    )}
                    {recommendations.primary_action === "project" && recommendations.next_project && (
                      <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <LuFolderKanban className="w-4 h-4" />
                        <span>Recommended: {recommendations.next_project.title}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-400">
                    {certifications[0]?.labs_completed < certifications[0]?.labs_total
                      ? `Complete more labs for ${certifications[0]?.cert_name} to build practical skills.`
                      : certifications[0]?.assessments_passed < certifications[0]?.assessments_total
                      ? `Take an assessment for ${certifications[0]?.cert_name} to validate your knowledge.`
                      : `Start a project for ${certifications[0]?.cert_name} to prove your capabilities.`
                    }
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(`/certification/${certifications[0]?.cert_id}/roadmap`)}
                  variant="outline"
                  className="border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  <LuMap className="w-4 h-4 mr-2" />
                  View Roadmap
                </Button>
                <Button
                  onClick={() => {
                    if (recommendations?.primary_action === "lab" && recommendations.next_lab) {
                      navigate(`/lab/${recommendations.next_lab.lab_id}`);
                    } else if (recommendations?.primary_action === "assessment" && recommendations.next_assessment) {
                      navigate(`/assessment/${recommendations.next_assessment.assessment_id}`, { state: { certId: certifications[0]?.cert_id } });
                    } else if (recommendations?.primary_action === "project" && recommendations.next_project) {
                      navigate(`/project/${recommendations.next_project.project_id}`, { state: { certId: certifications[0]?.cert_id } });
                    } else {
                      navigate(`/certification/${certifications[0]?.cert_id}`);
                    }
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shrink-0"
                >
                  Start Now
                  <LuArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Skill Gap Heatmap */}
        {recommendations && Object.keys(recommendations.domain_scores || {}).length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LuTarget className="w-5 h-5 text-amber-400" />
              Skill Gap Heatmap
              <Badge variant="outline" className="text-xs ml-2">
                {recommendations.certification?.name}
              </Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(recommendations.domain_scores).map(([domain, score]) => (
                <div
                  key={domain}
                  className="p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-all"
                  onClick={() => navigate(`/certification/${recommendations.certification?.cert_id}/labs`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate pr-2">{domain}</span>
                    <span className={`text-sm font-bold ${getDomainTextColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getDomainColor(score)} transition-all`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  {score < 40 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-red-400">
                      <LuAlertTriangle className="w-3 h-3" />
                      Needs attention
                    </div>
                  )}
                </div>
              ))}
            </div>
            {recommendations.weak_domains?.length > 0 && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-300">
                  <LuAlertTriangle className="w-4 h-4 inline mr-2" />
                  Focus areas: {recommendations.weak_domains.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Engagement Nudges */}
        {engagement?.nudges?.length > 0 && (
          <div className="mt-6 space-y-3">
            {engagement.nudges.slice(0, 2).map((nudge, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  nudge.priority === "high"
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-zinc-900/40 border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{nudge.title}</h4>
                    <p className="text-sm text-zinc-400">{nudge.message}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (nudge.cert_id) {
                        navigate(`/certification/${nudge.cert_id}`);
                      } else {
                        navigate("/hub");
                      }
                    }}
                    className={nudge.priority === "high" ? "bg-amber-500 hover:bg-amber-400 text-zinc-950" : ""}
                  >
                    {nudge.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
