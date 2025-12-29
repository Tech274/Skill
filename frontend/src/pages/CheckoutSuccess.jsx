import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { LuCircleCheck, LuLoaderCircle, LuCircleX } from "react-icons/lu";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState("loading");
  const [attempts, setAttempts] = useState(0);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    } else {
      setStatus("error");
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    if (attempts >= 10) {
      setStatus("pending");
      return;
    }

    try {
      const response = await axios.get(
        `${API}/checkout/status/${sessionId}`,
        { withCredentials: true }
      );

      if (response.data.payment_status === "paid") {
        setStatus("success");
        toast.success("Payment successful!");
        
        // Refresh user data
        try {
          const userRes = await axios.get(`${API}/auth/me`, { withCredentials: true });
          setUser(userRes.data);
        } catch (e) {
          console.error("Error refreshing user:", e);
        }
      } else if (response.data.status === "expired") {
        setStatus("error");
      } else {
        setAttempts((prev) => prev + 1);
        setTimeout(pollPaymentStatus, 2000);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setAttempts((prev) => prev + 1);
      setTimeout(pollPaymentStatus, 2000);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto text-center py-16">
        {status === "loading" && (
          <>
            <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <LuLoaderCircle className="w-10 h-10 text-cyan-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Processing Payment...</h1>
            <p className="text-zinc-400">
              Please wait while we confirm your payment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <LuCircleCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-zinc-400 mb-8">
              Welcome to Premium! You now have full access to all certifications, labs, assessments, and projects.
            </p>
            <Button
              onClick={() => navigate("/hub")}
              className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
              data-testid="go-to-hub-btn"
            >
              Start Learning
            </Button>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-20 h-20 bg-amber-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <LuLoaderCircle className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Payment Processing</h1>
            <p className="text-zinc-400 mb-8">
              Your payment is being processed. This may take a few minutes. Check your email for confirmation.
            </p>
            <Button
              onClick={() => navigate("/hub")}
              variant="outline"
              className="border-zinc-700"
            >
              Go to Hub
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 bg-rose-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <LuCircleX className="w-10 h-10 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
            <p className="text-zinc-400 mb-8">
              Something went wrong with your payment. Please try again.
            </p>
            <Button
              onClick={() => navigate("/checkout")}
              className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
            >
              Try Again
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
}
