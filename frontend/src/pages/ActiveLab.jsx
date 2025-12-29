import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import {
  LuArrowLeft,
  LuClock,
  LuCircleCheck,
  LuCircle,
  LuTerminal,
  LuChevronRight,
  LuBookmark,
  LuStickyNote,
  LuSave,
} from "react-icons/lu";

export default function ActiveLab() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lab, setLab] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: "system", text: "Initializing cloud environment..." },
    { type: "system", text: "Connected to AWS Console (Simulated)" },
    { type: "prompt", text: "$ " },
  ]);
  const [inputValue, setInputValue] = useState("");
  const terminalRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchLab();
    fetchBookmarkAndNotes();
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [labId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const fetchLab = async () => {
    try {
      const response = await axios.get(`${API}/labs/${labId}`, { withCredentials: true });
      setLab(response.data);
    } catch (error) {
      console.error("Error fetching lab:", error);
      toast.error("Failed to load lab");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkAndNotes = async () => {
    try {
      const [bookmarksRes, noteRes] = await Promise.all([
        axios.get(`${API}/bookmarks`, { withCredentials: true }),
        axios.get(`${API}/notes/${labId}`, { withCredentials: true }),
      ]);
      
      const isBookmarked = bookmarksRes.data.some(b => b.lab_id === labId);
      setBookmarked(isBookmarked);
      setNotes(noteRes.data?.content || "");
    } catch (error) {
      console.error("Error fetching bookmark/notes:", error);
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

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await axios.post(
        `${API}/notes`,
        { lab_id: labId, content: notes },
        { withCredentials: true }
      );
      toast.success("Notes saved!");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTerminalInput = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const command = inputValue.trim();
      setTerminalOutput((prev) => [
        ...prev.slice(0, -1),
        { type: "input", text: `$ ${command}` },
      ]);

      // Simulate command responses
      setTimeout(() => {
        let response;
        if (command.includes("aws") || command.includes("create") || command.includes("deploy")) {
          response = { type: "success", text: "✓ Command executed successfully" };
        } else if (command === "help") {
          response = { type: "info", text: "Available commands: aws, create, deploy, status, help" };
        } else if (command === "status") {
          response = { type: "info", text: `Lab progress: ${completedSteps.length}/${lab?.instructions?.length || 0} steps completed` };
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

  const markStepComplete = (stepIndex) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
      setTerminalOutput((prev) => [
        ...prev.slice(0, -1),
        { type: "success", text: `✓ Step ${stepIndex + 1} completed: ${lab.instructions[stepIndex].title}` },
        { type: "prompt", text: "$ " },
      ]);
      toast.success(`Step ${stepIndex + 1} completed!`);
    }
  };

  const handleCompleteLab = async () => {
    setCompleting(true);
    try {
      await axios.post(
        `${API}/labs/complete`,
        { lab_id: labId, cert_id: lab.cert_id },
        { withCredentials: true }
      );
      toast.success("Lab completed successfully!");
      navigate(`/certification/${lab.cert_id}`);
    } catch (error) {
      console.error("Error completing lab:", error);
      toast.error("Failed to complete lab");
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !lab) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const progress = lab.instructions?.length 
    ? (completedSteps.length / lab.instructions.length) * 100 
    : 0;
  const allStepsComplete = completedSteps.length === lab.instructions?.length;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top Bar */}
      <div className="h-16 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/lab/${labId}`)}
            className="p-2 hover:bg-white/5 rounded-lg"
            data-testid="exit-lab"
          >
            <LuArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold truncate max-w-md">{lab.title}</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <LuClock className="w-3 h-3" />
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Bookmark Button */}
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

          {/* Notes Button */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-lg transition-colors ${
              showNotes ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-white/5 text-zinc-400"
            }`}
            data-testid="notes-btn"
            title="Toggle notes"
          >
            <LuStickyNote className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-zinc-500">Progress</span>
            <Progress value={progress} className="w-32 h-2" />
            <span className="text-sm font-mono text-cyan-400">{Math.round(progress)}%</span>
          </div>
          
          <Button
            onClick={handleCompleteLab}
            disabled={!allStepsComplete || completing}
            className={allStepsComplete 
              ? "bg-emerald-500 hover:bg-emerald-400 text-white" 
              : "bg-zinc-800"
            }
            data-testid="complete-lab-btn"
          >
            {completing ? "Completing..." : "Complete Lab"}
          </Button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="split-screen">
        {/* Left Panel - Instructions */}
        <div className="bg-zinc-900/30 border-r border-zinc-800 overflow-y-auto">
          <div className="p-6">
            {/* Notes Section (Collapsible) */}
            {showNotes && (
              <div className="mb-6 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-cyan-400 flex items-center gap-2">
                    <LuStickyNote className="w-4 h-4" />
                    Your Notes
                  </h3>
                  <Button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                    data-testid="save-notes-btn"
                  >
                    <LuSave className="w-4 h-4 mr-1" />
                    {savingNotes ? "Saving..." : "Save"}
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes about this lab..."
                  className="min-h-[120px] bg-zinc-900/50 border-zinc-700 resize-none"
                  data-testid="notes-textarea"
                />
              </div>
            )}

            <h2 className="text-lg font-semibold mb-4">Lab Instructions</h2>
            
            <div className="space-y-4">
              {lab.instructions?.map((instruction, index) => {
                const isCompleted = completedSteps.includes(index);
                const isCurrent = currentStep === index;
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-cyan-500/10 border-cyan-500/30"
                        : isCompleted
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
                    }`}
                    onClick={() => setCurrentStep(index)}
                    data-testid={`instruction-step-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted ? "bg-emerald-500" : isCurrent ? "bg-cyan-500" : "bg-zinc-700"
                      }`}>
                        {isCompleted ? (
                          <LuCircleCheck className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-sm font-bold text-white">{instruction.step}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{instruction.title}</h3>
                        <p className="text-sm text-zinc-400 mb-2">{instruction.content}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {instruction.check}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {isCurrent && !isCompleted && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          markStepComplete(index);
                        }}
                        size="sm"
                        className="mt-3 w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                        data-testid={`mark-complete-${index}`}
                      >
                        Mark as Complete
                        <LuChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                );
              })}
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
            <span className="ml-4 text-sm text-zinc-400 font-mono">Cloud Console (Simulated)</span>
          </div>

          {/* Terminal Content */}
          <div
            ref={terminalRef}
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
                Simulated Cloud Environment
              </span>
              <span>Type "help" for available commands</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
