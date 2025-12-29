import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  LuDownload,
  LuShare2,
  LuTwitter,
  LuLinkedin,
  LuCopy,
  LuCheck,
  LuArrowLeft,
  LuAward,
} from "react-icons/lu";

export default function CertificateView() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  const fetchCertificate = async () => {
    try {
      const response = await axios.get(
        `${API}/certificates/public/${certificateId}`,
        { withCredentials: true }
      );
      setCertificate(response.data);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      toast.error("Certificate not found");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(
        `${API}/certificates/${certificateId}/download`,
        { 
          withCredentials: true,
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SkillTrack365_${certificate.cert_code}_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Certificate downloaded!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download certificate");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/certificate/${certificateId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`I just earned my ${certificate.vendor} ${certificate.cert_name} certification on SkillTrack365! 🎉 #${certificate.vendor} #CloudCertification`);
    const url = encodeURIComponent(`${window.location.origin}/certificate/${certificateId}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(`${window.location.origin}/certificate/${certificateId}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Certificate Not Found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const issuedDate = certificate.issued_at 
    ? new Date(certificate.issued_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'N/A';

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        {/* Certificate Card */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden">
          {/* Header Decoration */}
          <div className="h-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500"></div>
          
          <div className="p-8 md:p-12 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">S3</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">SKILLTRACK365</h1>
            <p className="text-zinc-500 mb-8">Certificate of Completion</p>

            <p className="text-zinc-400 mb-4">This certifies that</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{certificate.user_name}</h2>

            <p className="text-zinc-400 mb-4">has successfully completed the certification path for</p>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <LuAward className="w-8 h-8 text-amber-400" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {certificate.vendor} {certificate.cert_name}
              </h3>
            </div>
            <p className="text-zinc-500 mb-8">({certificate.cert_code})</p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{certificate.readiness_percentage}%</div>
                <div className="text-xs text-zinc-500">Readiness</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{certificate.labs_completed}</div>
                <div className="text-xs text-zinc-500">Labs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{certificate.assessments_passed}</div>
                <div className="text-xs text-zinc-500">Assessments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{certificate.projects_completed}</div>
                <div className="text-xs text-zinc-500">Projects</div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="border-t border-zinc-700 pt-6">
              <p className="text-sm text-zinc-500">Certificate ID: {certificate.certificate_id}</p>
              <p className="text-sm text-zinc-500">Issued: {issuedDate}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
            data-testid="download-btn"
          >
            <LuDownload className="w-4 h-4 mr-2" />
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
          
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="border-zinc-700"
            data-testid="copy-link-btn"
          >
            {copied ? <LuCheck className="w-4 h-4 mr-2" /> : <LuCopy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>

          <Button
            onClick={handleShareTwitter}
            variant="outline"
            className="border-zinc-700"
            data-testid="share-twitter-btn"
          >
            <LuTwitter className="w-4 h-4 mr-2" />
            Share on X
          </Button>

          <Button
            onClick={handleShareLinkedIn}
            variant="outline"
            className="border-zinc-700"
            data-testid="share-linkedin-btn"
          >
            <LuLinkedin className="w-4 h-4 mr-2" />
            Share on LinkedIn
          </Button>
        </div>
      </div>
    </div>
  );
}
