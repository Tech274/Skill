import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import {
  LuArrowLeft,
  LuArrowRight,
  LuClock,
  LuFlag,
} from "react-icons/lu";

export default function AssessmentTake() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const certId = location.state?.certId;
  
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchAssessment = async () => {
    try {
      const response = await axios.get(`${API}/assessments/${assessmentId}`, { withCredentials: true });
      setAssessment(response.data);
      setTimeLeft(response.data.time_minutes * 60);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      toast.error("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (!certId) {
      toast.error("Missing certification ID");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/assessments/submit`,
        {
          assessment_id: assessmentId,
          cert_id: certId,
          answers,
        },
        { withCredentials: true }
      );
      
      navigate(`/assessment/${assessmentId}/results`, { 
        state: { 
          results: response.data,
          certId 
        } 
      });
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast.error("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !assessment) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const isLowTime = timeLeft < 60;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="h-16 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
                navigate(`/certification/${certId}/assessments`);
              }
            }}
            className="p-2 hover:bg-white/5 rounded-lg"
            data-testid="exit-assessment"
          >
            <LuArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold">{assessment.title}</h1>
            <div className="text-sm text-zinc-500">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            isLowTime ? "bg-rose-500/20 text-rose-400" : "bg-zinc-800"
          }`}>
            <LuClock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
          <div className="hidden md:block text-sm text-zinc-500">
            {answeredCount}/{questions.length} answered
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Question */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-zinc-500">Topic: {question?.topic}</span>
          </div>
          
          <h2 className="text-xl font-semibold mb-6">{question?.question}</h2>

          <RadioGroup
            value={answers[question?.id] || ""}
            onValueChange={(value) => handleAnswer(question.id, value)}
            className="space-y-3"
          >
            {question?.options?.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  answers[question.id] === option
                    ? "bg-cyan-500/10 border-cyan-500/30"
                    : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
                }`}
                onClick={() => handleAnswer(question.id, option)}
                data-testid={`option-${index}`}
              >
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            variant="outline"
            className="border-zinc-700"
            data-testid="prev-question"
          >
            <LuArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                data-testid="next-question"
              >
                Next
                <LuArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-500 hover:bg-emerald-400 text-white"
                data-testid="submit-assessment"
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
                <LuFlag className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-8 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400 mb-3">Question Navigator</div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-mono text-sm transition-all ${
                  currentQuestion === index
                    ? "bg-cyan-500 text-zinc-950"
                    : answers[q.id]
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
                data-testid={`nav-question-${index}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
