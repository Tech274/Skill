import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  LuArrowRight,
  LuArrowLeft,
  LuCircleCheck,
  LuCircle,
  LuCode,
} from "react-icons/lu";

const difficultyColors = {
  Beginner: "bg-emerald-500/20 text-emerald-400",
  Intermediate: "bg-amber-500/20 text-amber-400",
  Advanced: "bg-rose-500/20 text-rose-400",
};

export default function Projects() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [certId]);

  const fetchData = async () => {
    try {
      const [projectsRes, certRes] = await Promise.all([
        axios.get(`${API}/certifications/${certId}/projects`, { withCredentials: true }),
        axios.get(`${API}/certifications/${certId}`, { withCredentials: true }),
      ]);
      setProjects(projectsRes.data);
      setCertification(certRes.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/certification/${certId}`)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          data-testid="back-to-cert"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to {certification?.name}
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-zinc-400">
            Build real-world projects to prove your skills for {certification?.name}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.project_id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all"
              data-testid={`project-card-${project.project_id}`}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {project.status === "completed" ? (
                      <LuCircleCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <LuCode className="w-5 h-5 text-cyan-400" />
                    )}
                    <h3 className="font-semibold text-xl">{project.title}</h3>
                    <Badge className={difficultyColors[project.difficulty]}>
                      {project.difficulty}
                    </Badge>
                  </div>
                  
                  <p className="text-zinc-400 mb-4">{project.description}</p>
                  
                  <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-2">Business Scenario</h4>
                    <p className="text-sm text-zinc-400">{project.business_scenario}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies?.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-zinc-300 mb-2">Skills Validated</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.skills_validated?.map((skill) => (
                        <Badge key={skill} className="bg-cyan-500/20 text-cyan-400 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between lg:w-48">
                  <Button
                    onClick={() => navigate(`/project/${project.project_id}`, { state: { certId } })}
                    className={project.status === "completed" 
                      ? "bg-zinc-800 hover:bg-zinc-700" 
                      : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                    }
                    data-testid={`start-project-${project.project_id}`}
                  >
                    {project.status === "completed" ? "Review Project" : "Start Project"}
                    <LuArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
