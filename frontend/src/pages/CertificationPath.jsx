import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  LuArrowRight,
  LuArrowLeft,
  LuTerminal,
  LuFileText,
  LuFolderKanban,
  LuTarget,
  LuClock,
  LuCircleCheck,
  LuCircle,
} from "react-icons/lu";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";

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

export default function CertificationPath() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [certification, setCertification] = useState(null);
  const [progress, setProgress] = useState(null);
  const [labs, setLabs] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [certId]);

  const fetchData = async () => {
    try {
      const [certRes, progressRes, labsRes, assessmentsRes, projectsRes] = await Promise.all([
        axios.get(`${API}/certifications/${certId}`, { withCredentials: true }),
        axios.get(`${API}/progress/${certId}`, { withCredentials: true }),
        axios.get(`${API}/certifications/${certId}/labs`, { withCredentials: true }),
        axios.get(`${API}/certifications/${certId}/assessments`, { withCredentials: true }),
        axios.get(`${API}/certifications/${certId}/projects`, { withCredentials: true }),
      ]);
      
      setCertification(certRes.data);
      setProgress(progressRes.data);
      setLabs(labsRes.data);
      setAssessments(assessmentsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load certification data");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !certification) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const VendorIcon = vendorIcons[certification.vendor] || LuTerminal;
  const vendorColor = vendorColors[certification.vendor] || "#22C55E";
  const readiness = progress?.readiness_percentage || 0;
  const labsCompleted = progress?.labs_completed?.length || 0;
  const assessmentsPassed = progress?.assessments_completed?.filter(a => a.passed)?.length || 0;
  const projectsCompleted = progress?.projects_completed?.length || 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/hub")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          data-testid="back-to-hub"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Certification Hub
        </button>

        {/* Header */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${vendorColor}20` }}
            >
              <VendorIcon className="w-8 h-8" style={{ color: vendorColor }} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-zinc-500">{certification.vendor}</span>
                <span className="text-sm text-zinc-600">•</span>
                <span className="text-sm text-zinc-500">{certification.code}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{certification.name}</h1>
              <p className="text-zinc-400 max-w-2xl">{certification.description}</p>
            </div>

            <div className="lg:text-right">
              <div className="text-sm text-zinc-400 mb-1">Certification Readiness</div>
              <div className="text-4xl font-bold text-cyan-400 font-mono">{readiness}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <Progress value={readiness} className="h-3" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <LuTerminal className="w-4 h-4" />
                <span className="text-sm">Labs</span>
              </div>
              <div className="text-xl font-bold">
                {labsCompleted} / {certification.labs_count}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <LuFileText className="w-4 h-4" />
                <span className="text-sm">Assessments</span>
              </div>
              <div className="text-xl font-bold">
                {assessmentsPassed} / {certification.assessments_count}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <LuFolderKanban className="w-4 h-4" />
                <span className="text-sm">Projects</span>
              </div>
              <div className="text-xl font-bold">
                {projectsCompleted} / {certification.projects_count}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <LuTarget className="w-4 h-4" />
                <span className="text-sm">Domains</span>
              </div>
              <div className="text-xl font-bold">{certification.exam_domains?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="labs" data-testid="tab-labs">Cloud Labs</TabsTrigger>
            <TabsTrigger value="assessments" data-testid="tab-assessments">Assessments</TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
            <TabsTrigger value="readiness" data-testid="tab-readiness">Readiness</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Exam Domains */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Exam Domains</h3>
                <div className="space-y-4">
                  {certification.exam_domains?.map((domain, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{domain.name}</span>
                        <span className="text-sm text-zinc-500">{domain.weight}%</span>
                      </div>
                      <Progress value={domain.weight} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Impact */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Career Impact</h3>
                <div className="space-y-3">
                  {certification.job_roles?.map((role) => (
                    <div
                      key={role}
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <LuCircleCheck className="w-5 h-5 text-emerald-400" />
                      <span>{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => navigate(`/certification/${certId}/roadmap`)}
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold"
                data-testid="view-roadmap-btn"
              >
                <LuTarget className="w-4 h-4 mr-2" />
                View Roadmap
              </Button>
              <Button
                onClick={() => navigate(`/certification/${certId}/labs`)}
                variant="outline"
                className="border-zinc-700"
                data-testid="start-labs-btn"
              >
                <LuTerminal className="w-4 h-4 mr-2" />
                Start Cloud Labs
              </Button>
              <Button
                onClick={() => navigate(`/certification/${certId}/assessments`)}
                variant="outline"
                className="border-zinc-700"
                data-testid="start-assessments-btn"
              >
                <LuFileText className="w-4 h-4 mr-2" />
                Take Assessments
              </Button>
              <Button
                onClick={() => navigate(`/certification/${certId}/projects`)}
                variant="outline"
                className="border-zinc-700"
                data-testid="start-projects-btn"
              >
                <LuFolderKanban className="w-4 h-4 mr-2" />
                View Projects
              </Button>
            </div>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs" className="space-y-4">
            {labs.map((lab) => (
              <div
                key={lab.lab_id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all"
                data-testid={`lab-item-${lab.lab_id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {lab.status === "completed" ? (
                        <LuCircleCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <LuCircle className="w-5 h-5 text-zinc-600" />
                      )}
                      <h4 className="font-semibold">{lab.title}</h4>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{lab.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {lab.exam_domain}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <LuClock className="w-3 h-3 mr-1" />
                        {lab.duration_minutes} min
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/lab/${lab.lab_id}`)}
                    variant={lab.status === "completed" ? "outline" : "default"}
                    className={lab.status !== "completed" ? "bg-cyan-500 hover:bg-cyan-400 text-zinc-950" : ""}
                  >
                    {lab.status === "completed" ? "Review Lab" : "Launch Lab"}
                    <LuArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-4">
            {assessments.map((assessment) => (
              <div
                key={assessment.assessment_id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all"
                data-testid={`assessment-item-${assessment.assessment_id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {assessment.status === "completed" ? (
                        <LuCircleCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <LuCircle className="w-5 h-5 text-zinc-600" />
                      )}
                      <h4 className="font-semibold">{assessment.title}</h4>
                      <Badge className={assessment.type === "full_exam" ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800"}>
                        {assessment.type === "full_exam" ? "Full Exam" : "Domain Test"}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{assessment.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <LuClock className="w-3 h-3 mr-1" />
                        {assessment.time_minutes} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Pass: {assessment.pass_threshold}%
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/assessment/${assessment.assessment_id}`, { state: { certId } })}
                    variant={assessment.status === "completed" ? "outline" : "default"}
                    className={assessment.status !== "completed" ? "bg-cyan-500 hover:bg-cyan-400 text-zinc-950" : ""}
                  >
                    {assessment.status === "completed" ? "Retake" : "Start Assessment"}
                    <LuArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all"
                data-testid={`project-item-${project.project_id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {project.status === "completed" ? (
                        <LuCircleCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <LuCircle className="w-5 h-5 text-zinc-600" />
                      )}
                      <h4 className="font-semibold">{project.title}</h4>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies?.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/project/${project.project_id}`, { state: { certId } })}
                    variant={project.status === "completed" ? "outline" : "default"}
                    className={project.status !== "completed" ? "bg-cyan-500 hover:bg-cyan-400 text-zinc-950" : ""}
                  >
                    {project.status === "completed" ? "Review" : "Start Project"}
                    <LuArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Readiness Tab */}
          <TabsContent value="readiness" className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Your Readiness Score</h3>
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="hsl(240 3.7% 15.9%)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="hsl(187 100% 42%)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${readiness * 5.02} 502`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-cyan-400">{readiness}%</div>
                      <div className="text-sm text-zinc-500">Ready</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                {readiness < 50 && (
                  <p className="text-zinc-400">
                    Keep practicing! Complete more labs and assessments to improve your readiness.
                  </p>
                )}
                {readiness >= 50 && readiness < 80 && (
                  <p className="text-zinc-400">
                    Good progress! Focus on your weak areas and complete more projects.
                  </p>
                )}
                {readiness >= 80 && (
                  <p className="text-emerald-400">
                    Excellent! You're almost ready for the exam. Review any remaining weak areas.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
