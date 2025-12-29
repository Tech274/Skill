import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Button } from "../components/ui/button";
import { LuArrowLeft } from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/hub");
    }
  }, [user, navigate]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/hub";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
          data-testid="back-to-home"
        >
          <LuArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        {/* Login card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S3</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to SkillTrack365</h1>
            <p className="text-zinc-400">Sign in to continue your certification journey</p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 border-zinc-700 hover:bg-white/5 text-base font-medium"
            data-testid="google-login-btn"
          >
            <FcGoogle className="w-5 h-5 mr-3" />
            Continue with Google
          </Button>

          <div className="mt-6 text-center text-sm text-zinc-500">
            By signing in, you agree to our{" "}
            <a href="#" className="text-cyan-400 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-cyan-400 hover:underline">Privacy Policy</a>
          </div>
        </div>

        {/* Features list */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500 mb-4">Get access to:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="bg-zinc-900/50 border border-zinc-800 px-3 py-1.5 rounded-full">
              50+ Cloud Labs
            </span>
            <span className="bg-zinc-900/50 border border-zinc-800 px-3 py-1.5 rounded-full">
              Practice Exams
            </span>
            <span className="bg-zinc-900/50 border border-zinc-800 px-3 py-1.5 rounded-full">
              Real Projects
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
