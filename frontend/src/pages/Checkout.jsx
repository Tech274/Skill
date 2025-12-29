import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  LuCheck,
  LuZap,
  LuInfinity,
  LuShield,
  LuStar,
} from "react-icons/lu";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: 29.99,
    period: "/month",
    description: "Perfect for getting started",
    popular: false,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 199.99,
    period: "/year",
    description: "Save $159.89 annually",
    popular: true,
    savings: "44%",
  },
];

const features = [
  { icon: LuInfinity, text: "Unlimited access to all certification paths" },
  { icon: LuZap, text: "All Cloud Labs with simulated environments" },
  { icon: LuShield, text: "Full practice exams and assessments" },
  { icon: LuStar, text: "Real-world projects with guidance" },
];

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/checkout/create`,
        {
          plan: selectedPlan,
          origin_url: window.location.origin,
        },
        { withCredentials: true }
      );
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to initiate checkout");
    } finally {
      setLoading(false);
    }
  };

  if (user?.subscription_status === "premium") {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <LuCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">You're Already Premium!</h1>
          <p className="text-zinc-400 mb-8">
            You have full access to all certifications, labs, assessments, and projects.
          </p>
          <Button
            onClick={() => navigate("/hub")}
            className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
          >
            Go to Certification Hub
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            <LuZap className="w-3 h-3 mr-1" />
            Upgrade to Premium
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Get unlimited access to all certification paths, cloud labs, assessments, and projects
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative bg-zinc-900/40 border rounded-xl p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "border-cyan-500/50 ring-2 ring-cyan-500/20"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
              data-testid={`plan-${plan.id}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-zinc-950">
                  Most Popular
                </Badge>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                {plan.savings && (
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    Save {plan.savings}
                  </Badge>
                )}
              </div>
              
              <div className="mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-zinc-500">{plan.period}</span>
              </div>
              
              <p className="text-sm text-zinc-400 mb-4">{plan.description}</p>
              
              <div className={`w-5 h-5 rounded-full border-2 ml-auto ${
                selectedPlan === plan.id
                  ? "border-cyan-500 bg-cyan-500"
                  : "border-zinc-600"
              }`}>
                {selectedPlan === plan.id && (
                  <LuCheck className="w-4 h-4 text-zinc-950" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">What's Included</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-zinc-300">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          disabled={loading}
          size="lg"
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold h-14 text-lg glow-cyan"
          data-testid="checkout-btn"
        >
          {loading ? "Processing..." : `Subscribe for $${plans.find(p => p.id === selectedPlan)?.price}${plans.find(p => p.id === selectedPlan)?.period}`}
        </Button>

        <p className="text-center text-sm text-zinc-500 mt-4">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </div>
    </Layout>
  );
}
