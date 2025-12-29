import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  LuArrowLeft,
  LuCircleCheck,
  LuCircleX,
  LuArrowRight,
} from "react-icons/lu";

export default function AssessmentReview() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const certId = location.state?.certId;
  
  const [reviewData, setReviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview();
  }, [assessmentId]);

  const fetchReview = async () => {
    try {
      const response = await axios.get(
        `${API}/assessments/${assessmentId}/review`,
        { withCredentials: true }
      );
      setReviewData(response.data);
    } catch (error) {
      console.error("Error fetching review:", error);
      toast.error("Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !reviewData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const questions = reviewData.questions || [];
  const question = questions[currentQuestion];
  const correctCount = questions.filter(q => q.is_correct).length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(certId ? `/certification/${certId}/assessments` : "/hub")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Assessments
        </button>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{reviewData.title}</h1>
              <p className="text-zinc-400">Review Mode - See correct answers</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{reviewData.user_score}%</div>
                <div className="text-xs text-zinc-500">Your Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{correctCount}/{questions.length}</div>
                <div className="text-xs text-zinc-500">Correct</div>
              </div>
              <Badge className={reviewData.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}>
                {reviewData.passed ? "Passed" : "Failed"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-zinc-500">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <Badge variant="outline">{question?.topic}</Badge>
          </div>

          <h2 className="text-xl font-semibold mb-6">{question?.question}</h2>

          <div className="space-y-3">
            {question?.options?.map((option, index) => {
              const isCorrect = option === question.correct_answer;
              const isUserAnswer = option === question.user_answer;
              const showCorrect = isCorrect;
              const showWrong = isUserAnswer && !isCorrect;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    showCorrect
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : showWrong
                      ? "bg-rose-500/10 border-rose-500/30"
                      : "bg-zinc-800/50 border-zinc-700"
                  }`}
                  data-testid={`option-${index}`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {showCorrect && <LuCircleCheck className="w-5 h-5 text-emerald-400" />}
                    {showWrong && <LuCircleX className="w-5 h-5 text-rose-400" />}
                    {!showCorrect && !showWrong && (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                    )}
                  </div>
                  <span className={`flex-1 ${showCorrect ? "text-emerald-300" : showWrong ? "text-rose-300" : ""}`}>
                    {option}
                  </span>
                  {isUserAnswer && (
                    <Badge variant="outline" className="text-xs">
                      Your Answer
                    </Badge>
                  )}
                  {isCorrect && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                      Correct Answer
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {question?.is_correct === false && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <h4 className="font-semibold text-amber-400 mb-2">Explanation</h4>
              <p className="text-zinc-400 text-sm">
                The correct answer is "{question.correct_answer}". Review this topic to strengthen your understanding.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
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

          <Button
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === questions.length - 1}
            className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
            data-testid="next-question"
          >
            Next
            <LuArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Question Navigator */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400 mb-3">Question Navigator</div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-mono text-sm transition-all ${
                  currentQuestion === index
                    ? "bg-cyan-500 text-zinc-950"
                    : q.is_correct
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
                data-testid={`nav-question-${index}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
