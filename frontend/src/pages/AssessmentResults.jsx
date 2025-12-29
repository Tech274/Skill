import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  LuCircleCheck,
  LuCircleX,
  LuArrowRight,
  LuTrendingUp,
  LuTarget,
  LuRefreshCw,
  LuEye,
} from "react-icons/lu";

export default function AssessmentResults() {
  const { assessmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results;
  const certId = location.state?.certId;

  if (!results) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-zinc-400 mb-4">No results available</p>
          <Button onClick={() => navigate("/hub")}>Back to Hub</Button>
        </div>
      </Layout>
    );
  }

  const { score, passed, correct, total, weak_areas, pass_threshold } = results;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Results Header */}
        <div className={`rounded-2xl p-8 mb-6 text-center ${
          passed 
            ? "bg-gradient-to-b from-emerald-500/20 to-zinc-900/40 border border-emerald-500/30" 
            : "bg-gradient-to-b from-rose-500/20 to-zinc-900/40 border border-rose-500/30"
        }`}>
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            passed ? "bg-emerald-500/20" : "bg-rose-500/20"
          }`}>
            {passed ? (
              <LuCircleCheck className="w-10 h-10 text-emerald-400" />
            ) : (
              <LuCircleX className="w-10 h-10 text-rose-400" />
            )}
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            {passed ? "Congratulations!" : "Keep Practicing!"}
          </h1>
          <p className="text-zinc-400">
            {passed 
              ? "You've passed this assessment. Great job!"
              : "You didn't pass this time, but don't give up!"
            }
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-1 ${
                passed ? "text-emerald-400" : "text-rose-400"
              }`}>
                {score}%
              </div>
              <div className="text-sm text-zinc-500">Your Score</div>
            </div>
            <div className="text-center border-x border-zinc-800">
              <div className="text-4xl font-bold mb-1 text-zinc-300">
                {correct}/{total}
              </div>
              <div className="text-sm text-zinc-500">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-1 text-zinc-500">
                {pass_threshold}%
              </div>
              <div className="text-sm text-zinc-500">Pass Threshold</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-400">Score Progress</span>
              <span className={passed ? "text-emerald-400" : "text-rose-400"}>
                {passed ? "Passed" : `${pass_threshold - score}% below threshold`}
              </span>
            </div>
            <div className="relative">
              <Progress value={score} className="h-3" />
              <div 
                className="absolute top-0 h-3 w-0.5 bg-zinc-400"
                style={{ left: `${pass_threshold}%` }}
              />
            </div>
          </div>
        </div>

        {/* Weak Areas */}
        {weak_areas?.length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LuTarget className="w-5 h-5 text-amber-400" />
              Areas to Improve
            </h2>
            <div className="flex flex-wrap gap-2">
              {weak_areas.map((area, index) => (
                <Badge 
                  key={index} 
                  className="bg-amber-500/20 text-amber-400 border-amber-500/30"
                >
                  {area}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-zinc-400 mt-4">
              We recommend revisiting these topics through labs and study materials before retaking the assessment.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate(`/assessment/${assessmentId}/review`, { state: { certId } })}
            variant="outline"
            className="flex-1 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
            data-testid="review-btn"
          >
            <LuEye className="w-4 h-4 mr-2" />
            Review Answers
          </Button>
          
          <Button
            onClick={() => navigate(`/assessment/${assessmentId}`, { state: { certId } })}
            variant="outline"
            className="flex-1 border-zinc-700"
            data-testid="retake-btn"
          >
            <LuRefreshCw className="w-4 h-4 mr-2" />
            Retake Assessment
          </Button>
          
          {certId && (
            <Button
              onClick={() => navigate(`/certification/${certId}`)}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
              data-testid="back-to-cert-btn"
            >
              Back to Certification
              <LuArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <LuTrendingUp className="w-5 h-5 text-cyan-400" />
            Recommended Next Steps
          </h3>
          <ul className="space-y-3">
            {!passed && weak_areas?.length > 0 && (
              <li className="flex items-start gap-3 text-zinc-400">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-sm">1</div>
                <span>Review the weak areas identified above through labs and documentation</span>
              </li>
            )}
            <li className="flex items-start gap-3 text-zinc-400">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 text-sm">{!passed && weak_areas?.length > 0 ? 2 : 1}</div>
              <span>Complete more hands-on Cloud Labs to reinforce your knowledge</span>
            </li>
            <li className="flex items-start gap-3 text-zinc-400">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-sm">{!passed && weak_areas?.length > 0 ? 3 : 2}</div>
              <span>Take on a real-world project to apply your skills</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
