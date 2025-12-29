import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../App";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  LuArrowRight,
  LuTerminal,
  LuGraduationCap,
  LuTrophy,
  LuTarget,
  LuCheckCircle,
  LuZap,
} from "react-icons/lu";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";

const features = [
  {
    icon: LuGraduationCap,
    title: "Certification Paths",
    description: "Structured learning paths mapped directly to exam objectives",
    color: "text-cyan-400",
  },
  {
    icon: LuTerminal,
    title: "Cloud Labs",
    description: "Hands-on labs in real cloud environments with guided instructions",
    color: "text-indigo-400",
  },
  {
    icon: LuTarget,
    title: "Practice Assessments",
    description: "Domain tests and full practice exams with instant feedback",
    color: "text-emerald-400",
  },
  {
    icon: LuTrophy,
    title: "Real Projects",
    description: "Build portfolio-worthy projects that prove your skills",
    color: "text-amber-400",
  },
];

const certifications = [
  { vendor: "AWS", name: "Solutions Architect", color: "#FF9900", icon: FaAws },
  { vendor: "Azure", name: "Administrator", color: "#0078D4", icon: VscAzure },
  { vendor: "GCP", name: "Cloud Engineer", color: "#4285F4", icon: SiGooglecloud },
];

const stats = [
  { value: "50+", label: "Cloud Labs" },
  { value: "200+", label: "Practice Questions" },
  { value: "25+", label: "Projects" },
  { value: "95%", label: "Pass Rate" },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate("/hub");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S3</span>
              </div>
              <span className="font-bold text-lg">SkillTrack<span className="text-cyan-400">365</span></span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <Button
                  onClick={() => navigate("/hub")}
                  className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold"
                  data-testid="go-to-hub-btn"
                >
                  Go to Hub
                  <LuArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Link to="/login" className="text-zinc-400 hover:text-white transition-colors" data-testid="login-link">
                    Log in
                  </Link>
                  <Button
                    onClick={handleGetStarted}
                    className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold"
                    data-testid="get-started-btn"
                  >
                    Get Started
                    <LuArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1">
              <LuZap className="w-3 h-3 mr-1" />
              Certification-First Learning Platform
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              From Zero to{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Cloud Certified
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Master AWS, Azure, and GCP with hands-on Cloud Labs, real-world Projects, 
              and comprehensive Assessments mapped directly to certification exams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-8 py-6 text-lg glow-cyan"
                data-testid="hero-cta-btn"
              >
                Start Your Journey
                <LuArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-700 hover:bg-white/5 px-8 py-6 text-lg"
              >
                View Certifications
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-cyan-400">{stat.value}</div>
                  <div className="text-sm text-zinc-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-20 px-4 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Industry-Leading Certifications
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Prepare for the most in-demand cloud certifications with our comprehensive paths
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.vendor}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group card-hover"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${cert.color}20` }}
                  >
                    <cert.icon className="w-6 h-6" style={{ color: cert.color }} />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">{cert.vendor}</div>
                    <div className="font-semibold">{cert.name}</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <LuCheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Hands-on Labs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LuCheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Practice Exams</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LuCheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Real Projects</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Our certification-first approach ensures you build real skills, not just memorize answers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Certified?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Join thousands of professionals who have accelerated their cloud careers with SkillTrack365
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-8 py-6 text-lg glow-cyan"
            data-testid="footer-cta-btn"
          >
            Start Free Trial
            <LuArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">S3</span>
            </div>
            <span className="text-sm text-zinc-500">SkillTrack365 © 2025</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
