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
  LuClock,
  LuCheckCircle,
  LuCircle,
  LuTarget,
} from "react-icons/lu";

export default function Assessments() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [certId]);

  const fetchData = async () => {
    try {
      const [assessmentsRes, certRes] = await Promise.all([
        axios.get(`${API}/certifications/${certId}/assessments`, { withCredentials: true }),
        axios.get(`${API}/certifications/${certId}`, { withCredentials: true }),
      ]);
      setAssessments(assessmentsRes.data);
      setCertification(certRes.data);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      toast.error("Failed to load assessments");
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

  const domainTests = assessments.filter((a) => a.type === "domain");
  const fullExams = assessments.filter((a) => a.type === "full_exam");

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
          <h1 className="text-3xl font-bold mb-2">Assessments</h1>
          <p className="text-zinc-400">
            Test your knowledge and track your readiness for {certification?.name}
          </p>
        </div>

        {/* Domain Tests */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LuTarget className="w-5 h-5 text-cyan-400" />
            Domain Tests
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {domainTests.map((assessment) => (
              <div
                key={assessment.assessment_id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all"
                data-testid={`assessment-card-${assessment.assessment_id}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {assessment.status === "completed" ? (
                    <LuCheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <LuCircle className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold">{assessment.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{assessment.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {assessment.topics?.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1">
                      <LuClock className="w-4 h-4" />
                      {assessment.time_minutes} min
                    </span>
                    <span>Pass: {assessment.pass_threshold}%</span>
                  </div>
                  <Button
                    onClick={() => navigate(`/assessment/${assessment.assessment_id}`, { state: { certId } })}
                    size="sm"
                    className={assessment.status === "completed" 
                      ? "bg-zinc-800 hover:bg-zinc-700" 
                      : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                    }
                  >
                    {assessment.status === "completed" ? "Retake" : "Start"}
                    <LuArrowRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Practice Exams */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LuTarget className="w-5 h-5 text-indigo-400" />
            Full Practice Exams
          </h2>
          <div className="space-y-4">
            {fullExams.map((assessment) => (
              <div
                key={assessment.assessment_id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all"
                data-testid={`exam-card-${assessment.assessment_id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {assessment.status === "completed" ? (
                        <LuCheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <LuCircle className="w-5 h-5 text-zinc-600" />
                      )}
                      <h3 className="font-semibold text-lg">{assessment.title}</h3>
                      <Badge className="bg-indigo-500/20 text-indigo-400">Full Exam</Badge>
                    </div>
                    <p className="text-zinc-400 mb-3">{assessment.description}</p>
                    <div className="flex gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <LuClock className="w-4 h-4" />
                        {assessment.time_minutes} minutes
                      </span>
                      <span>Pass Threshold: {assessment.pass_threshold}%</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/assessment/${assessment.assessment_id}`, { state: { certId } })}
                    className={assessment.status === "completed" 
                      ? "bg-zinc-800 hover:bg-zinc-700" 
                      : "bg-indigo-600 hover:bg-indigo-500"
                    }
                  >
                    {assessment.status === "completed" ? "Retake Exam" : "Start Exam"}
                    <LuArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
