import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  LuArrowRight,
  LuTerminal,
  LuFileText,
  LuFolderKanban,
  LuTrophy,
} from "react-icons/lu";
import { SiAmazonwebservices, SiMicrosoftazure, SiGooglecloud } from "react-icons/si";
import { motion } from "framer-motion";

const vendorIcons = {
  AWS: SiAmazonwebservices,
  Azure: SiMicrosoftazure,
  GCP: SiGooglecloud,
  DevOps: LuTerminal,
};

const vendorColors = {
  AWS: "#FF9900",
  Azure: "#0078D4",
  GCP: "#4285F4",
  DevOps: "#22C55E",
};

const difficultyColors = {
  Beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function CertificationHub() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Seed data first
      await axios.post(`${API}/seed`, {}, { withCredentials: true });
      
      // Get certifications
      const certRes = await axios.get(`${API}/certifications`, { withCredentials: true });
      setCertifications(certRes.data);

      // Get progress for each certification
      const progressMap = {};
      for (const cert of certRes.data) {
        try {
          const progRes = await axios.get(`${API}/progress/${cert.cert_id}`, { withCredentials: true });
          progressMap[cert.cert_id] = progRes.data;
        } catch (e) {
          progressMap[cert.cert_id] = { readiness_percentage: 0 };
        }
      }
      setProgress(progressMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load certifications");
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Certification Hub</h1>
          <p className="text-zinc-400">
            Choose your certification path and start building real cloud skills
          </p>
        </div>

        {/* Certification Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert, index) => {
            const VendorIcon = vendorIcons[cert.vendor] || LuTerminal;
            const vendorColor = vendorColors[cert.vendor] || "#22C55E";
            const certProgress = progress[cert.cert_id] || { readiness_percentage: 0 };

            return (
              <motion.div
                key={cert.cert_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all card-hover group"
                data-testid={`cert-card-${cert.cert_id}`}
              >
                {/* Card Header with Image */}
                <div className="h-32 relative overflow-hidden">
                  <img
                    src={cert.image_url}
                    alt={cert.name}
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${vendorColor}20` }}
                    >
                      <VendorIcon className="w-5 h-5" style={{ color: vendorColor }} />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className={difficultyColors[cert.difficulty]}>
                      {cert.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="text-sm text-zinc-500 mb-1">{cert.vendor} • {cert.code}</div>
                  <h3 className="text-lg font-semibold mb-3">{cert.name}</h3>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                    <div className="flex items-center gap-1">
                      <LuTerminal className="w-4 h-4" />
                      <span>{cert.labs_count} Labs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <LuFileText className="w-4 h-4" />
                      <span>{cert.assessments_count} Tests</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <LuFolderKanban className="w-4 h-4" />
                      <span>{cert.projects_count} Projects</span>
                    </div>
                  </div>

                  {/* Job Roles */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {cert.job_roles.slice(0, 2).map((role) => (
                      <span
                        key={role}
                        className="text-xs bg-zinc-800/50 text-zinc-400 px-2 py-1 rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                  {/* Readiness Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-zinc-400">Certification Readiness</span>
                      <span className="font-mono text-cyan-400">
                        {certProgress.readiness_percentage}%
                      </span>
                    </div>
                    <Progress value={certProgress.readiness_percentage} className="h-2" />
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => navigate(`/certification/${cert.cert_id}`)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                    data-testid={`start-cert-${cert.cert_id}`}
                  >
                    {certProgress.readiness_percentage > 0 ? (
                      <>
                        Continue Path
                        <LuArrowRight className="ml-2 w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Start Certification Path
                        <LuArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
