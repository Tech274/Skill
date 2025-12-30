import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCircleCheck,
  LuCircle,
  LuTarget,
  LuTerminal,
  LuFileText,
  LuFolderKanban,
  LuTrophy,
  LuMapPin,
  LuClock,
} from "react-icons/lu";

export default function CertificationRoadmap() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState(null);

  useEffect(() => {
    fetchRoadmap();
  }, [certId]);

  const fetchRoadmap = async () => {
    try {
      const response = await axios.get(`${API}/roadmap/${certId}`, { withCredentials: true });
      setRoadmapData(response.data);
      // Auto-expand current stage
      const currentStage = response.data?.overall_progress?.current_stage || 1;
      setExpandedStage(currentStage);
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      toast.error("Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !roadmapData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const { certification, stages, overall_progress } = roadmapData;
  const stageIcons = {
    domains: LuTarget,
    labs: LuTerminal,
    assessments: LuFileText,
    projects: LuFolderKanban,
    readiness: LuTrophy,
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/certification/${certId}`)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Certification
        </button>

        {/* Header */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <LuMapPin className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{certification.name}</h1>
              <p className="text-zinc-400">{certification.vendor} Certification Roadmap</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Progress value={overall_progress.readiness} className="flex-1 h-3" />
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {overall_progress.readiness}%
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            Currently on Stage {overall_progress.current_stage} of {stages.length}
          </p>
        </div>

        {/* Roadmap Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-zinc-800"></div>
          
          {stages.map((stage, index) => {
            const StageIcon = stageIcons[stage.type] || LuTarget;
            const isExpanded = expandedStage === stage.stage;
            const isCompleted = stage.completed;
            const isCurrent = overall_progress.current_stage === stage.stage;
            
            return (
              <div key={stage.stage} className="relative pl-20 pb-8">
                {/* Stage indicator */}
                <div
                  className={`absolute left-4 w-8 h-8 rounded-full flex items-center justify-center z-10 
                    ${isCompleted ? "bg-emerald-500" : isCurrent ? "bg-cyan-500" : "bg-zinc-800"}
                    cursor-pointer transition-all hover:scale-110`}
                  onClick={() => setExpandedStage(isExpanded ? null : stage.stage)}
                >
                  {isCompleted ? (
                    <LuCircleCheck className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-sm font-bold text-white">{stage.stage}</span>
                  )}
                </div>

                {/* Stage Card */}
                <div
                  className={`bg-zinc-900/40 border rounded-xl overflow-hidden transition-all
                    ${isCurrent ? "border-cyan-500/50" : isCompleted ? "border-emerald-500/30" : "border-zinc-800"}`}
                >
                  {/* Stage Header */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50"
                    onClick={() => setExpandedStage(isExpanded ? null : stage.stage)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                        ${isCompleted ? "bg-emerald-500/20" : isCurrent ? "bg-cyan-500/20" : "bg-zinc-800"}`}
                      >
                        <StageIcon className={`w-5 h-5 ${isCompleted ? "text-emerald-400" : isCurrent ? "text-cyan-400" : "text-zinc-500"}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {stage.title}
                          {isCompleted && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Complete</Badge>
                          )}
                          {isCurrent && !isCompleted && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">In Progress</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-zinc-500">{stage.description}</p>
                      </div>
                    </div>
                    <LuArrowRight className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800 p-4">
                      {/* Domains */}
                      {stage.type === "domains" && (
                        <div className="space-y-3">
                          {stage.items?.map((domain, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                              <span className="text-sm">{domain.name}</span>
                              <Badge variant="outline">{domain.weight}%</Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Labs */}
                      {stage.type === "labs" && (
                        <div className="space-y-4">
                          {stage.domains?.map((domain) => (
                            <div key={domain.domain}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{domain.domain}</span>
                                <span className="text-xs text-zinc-500">
                                  {domain.completed_count}/{domain.total_count} ({domain.progress}%)
                                </span>
                              </div>
                              <Progress value={domain.progress} className="h-1.5 mb-2" />
                              <div className="space-y-2">
                                {domain.labs?.map((lab) => (
                                  <div
                                    key={lab.lab_id}
                                    className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg text-sm cursor-pointer hover:bg-zinc-800/60"
                                    onClick={() => navigate(`/lab/${lab.lab_id}`)}
                                  >
                                    <div className="flex items-center gap-2">
                                      {lab.completed ? (
                                        <LuCircleCheck className="w-4 h-4 text-emerald-400" />
                                      ) : (
                                        <LuCircle className="w-4 h-4 text-zinc-600" />
                                      )}
                                      <span className={lab.completed ? "text-zinc-400" : ""}>{lab.title}</span>
                                    </div>
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                      <LuClock className="w-3 h-3" /> {lab.duration_minutes}m
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          <Button
                            onClick={() => navigate(`/certification/${certId}/labs`)}
                            className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                          >
                            Go to Labs <LuArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Assessments */}
                      {stage.type === "assessments" && (
                        <div className="space-y-2">
                          {stage.items?.map((assessment) => (
                            <div
                              key={assessment.assessment_id}
                              className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg cursor-pointer hover:bg-zinc-800/60"
                              onClick={() => navigate(`/assessment/${assessment.assessment_id}`, { state: { certId } })}
                            >
                              <div className="flex items-center gap-2">
                                {assessment.passed ? (
                                  <LuCircleCheck className="w-4 h-4 text-emerald-400" />
                                ) : assessment.completed ? (
                                  <LuCircle className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <LuCircle className="w-4 h-4 text-zinc-600" />
                                )}
                                <span>{assessment.title}</span>
                                {assessment.passed && (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                    {assessment.score}%
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {assessment.type === "full_exam" ? "Full Exam" : "Domain Test"}
                              </Badge>
                            </div>
                          ))}
                          <Button
                            onClick={() => navigate(`/certification/${certId}/assessments`)}
                            variant="outline"
                            className="w-full mt-2 border-zinc-700"
                          >
                            View All Assessments <LuArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Projects */}
                      {stage.type === "projects" && (
                        <div className="space-y-2">
                          {stage.items?.map((project) => (
                            <div
                              key={project.project_id}
                              className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg cursor-pointer hover:bg-zinc-800/60"
                              onClick={() => navigate(`/project/${project.project_id}`, { state: { certId } })}
                            >
                              <div className="flex items-center gap-2">
                                {project.completed ? (
                                  <LuCircleCheck className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <LuCircle className="w-4 h-4 text-zinc-600" />
                                )}
                                <span>{project.title}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">{project.difficulty}</Badge>
                            </div>
                          ))}
                          <Button
                            onClick={() => navigate(`/certification/${certId}/projects`)}
                            variant="outline"
                            className="w-full mt-2 border-zinc-700"
                          >
                            View All Projects <LuArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Readiness */}
                      {stage.type === "readiness" && (
                        <div className="text-center py-4">
                          <div className="relative w-32 h-32 mx-auto mb-4">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke="hsl(240 3.7% 15.9%)"
                                strokeWidth="8"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke={stage.readiness_percentage >= 80 ? "#10B981" : "#22D3EE"}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${stage.readiness_percentage * 3.52} 352`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${stage.readiness_percentage >= 80 ? "text-emerald-400" : "text-cyan-400"}`}>
                                  {stage.readiness_percentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                          {stage.readiness_percentage >= 80 ? (
                            <p className="text-emerald-400 font-medium">
                              You&apos;re ready for the certification exam!
                            </p>
                          ) : (
                            <p className="text-zinc-400">
                              Complete more activities to reach 80% readiness
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
