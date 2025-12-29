import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  LuArrowLeft,
  LuCircleCheck,
  LuCircle,
  LuTerminal,
  LuFileText,
  LuChevronRight,
} from "react-icons/lu";

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const certId = location.state?.certId;
  
  const [project, setProject] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: "system", text: "Project environment initialized..." },
    { type: "system", text: "Cloud resources ready." },
    { type: "prompt", text: "$ " },
  ]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`, { withCredentials: true });
      setProject(response.data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleTerminalInput = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const command = inputValue.trim();
      setTerminalOutput((prev) => [
        ...prev.slice(0, -1),
        { type: "input", text: `$ ${command}` },
      ]);

      setTimeout(() => {
        let response;
        if (command.includes("deploy") || command.includes("create")) {
          response = { type: "success", text: "✓ Resource deployed successfully" };
        } else if (command === "help") {
          response = { type: "info", text: "Commands: create, deploy, status, test, help" };
        } else if (command === "status") {
          response = { type: "info", text: `Tasks completed: ${completedTasks.length}/${project?.tasks?.length || 0}` };
        } else {
          response = { type: "output", text: `Executing: ${command}...` };
        }
        
        setTerminalOutput((prev) => [
          ...prev,
          response,
          { type: "prompt", text: "$ " },
        ]);
      }, 500);

      setInputValue("");
    }
  };

  const markTaskComplete = (taskId) => {
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks([...completedTasks, taskId]);
      toast.success("Task marked as complete!");
    }
  };

  const handleSubmitProject = async () => {
    if (!certId) {
      toast.error("Missing certification ID");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/projects/complete`,
        { project_id: projectId, cert_id: certId },
        { withCredentials: true }
      );
      toast.success("Project completed successfully!");
      navigate(`/certification/${certId}`);
    } catch (error) {
      console.error("Error submitting project:", error);
      toast.error("Failed to submit project");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const progress = project.tasks?.length 
    ? (completedTasks.length / project.tasks.length) * 100 
    : 0;
  const allTasksComplete = completedTasks.length === project.tasks?.length;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top Bar */}
      <div className="h-16 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/5 rounded-lg"
            data-testid="exit-project"
          >
            <LuArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold truncate max-w-md">{project.title}</h1>
            <div className="text-sm text-zinc-500">{project.difficulty}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-zinc-500">Progress</span>
            <Progress value={progress} className="w-32 h-2" />
            <span className="text-sm font-mono text-cyan-400">{Math.round(progress)}%</span>
          </div>
          
          <Button
            onClick={handleSubmitProject}
            disabled={!allTasksComplete || submitting}
            className={allTasksComplete 
              ? "bg-emerald-500 hover:bg-emerald-400 text-white" 
              : "bg-zinc-800"
            }
            data-testid="submit-project-btn"
          >
            {submitting ? "Submitting..." : "Submit Project"}
          </Button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="split-screen">
        {/* Left Panel - Project Brief */}
        <div className="bg-zinc-900/30 border-r border-zinc-800 overflow-y-auto">
          <div className="p-6">
            {/* Project Brief */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <LuFileText className="w-5 h-5 text-cyan-400" />
                Project Brief
              </h2>
              <p className="text-zinc-400 text-sm mb-4">{project.business_scenario}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies?.map((tech) => (
                  <Badge key={tech} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Tasks</h2>
              <div className="space-y-3">
                {project.tasks?.map((task) => {
                  const isCompleted = completedTasks.includes(task.id);
                  
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-zinc-800/50 border-zinc-700"
                      }`}
                      data-testid={`task-${task.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? "bg-emerald-500" : "bg-zinc-700"
                        }`}>
                          {isCompleted ? (
                            <LuCircleCheck className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs font-bold text-white">{task.id}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{task.title}</h3>
                          <p className="text-xs text-zinc-400 mt-1">{task.description}</p>
                        </div>
                      </div>

                      {!isCompleted && (
                        <Button
                          onClick={() => markTaskComplete(task.id)}
                          size="sm"
                          className="mt-3 w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                          data-testid={`complete-task-${task.id}`}
                        >
                          Mark Complete
                          <LuChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Deliverables</h2>
              <ul className="space-y-2">
                {project.deliverables?.map((deliverable, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-zinc-400">
                    <LuCircle className="w-2 h-2 text-zinc-600" />
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Panel - Terminal */}
        <div className="bg-zinc-950 flex flex-col">
          {/* Terminal Header */}
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500" />
            <div className="terminal-dot bg-yellow-500" />
            <div className="terminal-dot bg-green-500" />
            <span className="ml-4 text-sm text-zinc-400 font-mono">Project Environment (Simulated)</span>
          </div>

          {/* Terminal Content */}
          <div
            className="flex-1 p-4 overflow-y-auto font-mono text-sm"
            data-testid="terminal-output"
          >
            {terminalOutput.map((line, index) => (
              <div
                key={index}
                className={`mb-1 ${
                  line.type === "success"
                    ? "text-emerald-400"
                    : line.type === "error"
                    ? "text-rose-400"
                    : line.type === "info"
                    ? "text-cyan-400"
                    : line.type === "system"
                    ? "text-zinc-500"
                    : "text-zinc-300"
                }`}
              >
                {line.text}
                {line.type === "prompt" && (
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleTerminalInput}
                    className="bg-transparent border-none outline-none text-white ml-0 w-full"
                    autoFocus
                    data-testid="terminal-input"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Terminal Footer */}
          <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500">
            <div className="flex items-center justify-between">
              <span>
                <LuTerminal className="w-3 h-3 inline mr-1" />
                Simulated Environment
              </span>
              <span>Type "help" for available commands</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
