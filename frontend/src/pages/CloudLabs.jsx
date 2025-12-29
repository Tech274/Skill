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
} from "react-icons/lu";

const difficultyColors = {
  Beginner: "bg-emerald-500/20 text-emerald-400",
  Intermediate: "bg-amber-500/20 text-amber-400",
  Advanced: "bg-rose-500/20 text-rose-400",
};

export default function CloudLabs() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [certification, setCertification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [certId]);

  const fetchData = async () => {
    try {
      const [labsRes, certRes] = await Promise.all([
        axios.get(`${API}/certifications/${certId}/labs`, { withCredentials: true }),
        axios.get(`${API}/certifications/${certId}`, { withCredentials: true }),
      ]);
      setLabs(labsRes.data);
      setCertification(certRes.data);
    } catch (error) {
      console.error("Error fetching labs:", error);
      toast.error("Failed to load labs");
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
          <h1 className="text-3xl font-bold mb-2">Cloud Labs</h1>
          <p className="text-zinc-400">
            Hands-on labs to build practical skills for {certification?.name}
          </p>
        </div>

        {/* Labs Grid */}
        <div className="space-y-4">
          {labs.map((lab, index) => (
            <div
              key={lab.lab_id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all"
              data-testid={`lab-card-${lab.lab_id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                    {lab.status === "completed" ? (
                      <LuCheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <span className="text-lg font-bold text-zinc-500">{index + 1}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{lab.title}</h3>
                    <Badge className={difficultyColors[lab.difficulty]}>
                      {lab.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">{lab.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {lab.skill_trained}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {lab.exam_domain}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <LuClock className="w-3 h-3 mr-1" />
                      {lab.duration_minutes} min
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/lab/${lab.lab_id}`)}
                    className={lab.status === "completed" 
                      ? "bg-zinc-800 hover:bg-zinc-700" 
                      : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                    }
                    data-testid={`launch-lab-${lab.lab_id}`}
                  >
                    {lab.status === "completed" ? "Review" : "Launch Lab"}
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
