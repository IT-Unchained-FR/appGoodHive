"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Coins, Zap, Building2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";

interface ActiveSubscription {
  id: string;
  plan: string;
  status: string;
  amount_usdc: number;
  starts_at: string;
  expires_at: string;
  tx_hash: string | null;
}

const PLANS = [
  {
    key: "pro",
    name: "Pro",
    price: 49,
    icon: <Zap className="w-5 h-5" />,
    color: "border-amber-400",
    highlight: false,
    features: [
      "Unlimited talent search",
      "Talent Pipeline (Kanban)",
      "Direct talent assignments",
      "AI Job Description Builder",
      "Messenger access",
      "30 days access",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 199,
    icon: <Building2 className="w-5 h-5" />,
    color: "border-purple-500",
    highlight: true,
    features: [
      "Everything in Pro",
      "Priority talent matching",
      "Dedicated account manager",
      "Custom contract terms",
      "Multi-user team access (coming soon)",
      "30 days access",
    ],
  },
] as const;

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

export default function SubscriptionPage() {
  const userId = useCurrentUserId();
  const [active, setActive] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    void fetch("/api/subscriptions", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setActive(json.data?.active ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // In a real implementation, this would trigger a Thirdweb USDC transfer
  const handleSubscribe = async (plan: "pro" | "enterprise") => {
    toast(
      `To subscribe to ${plan === "pro" ? "Pro ($49 USDC)" : "Enterprise ($199 USDC)"}:\n\nPay USDC on Polygon to GoodHive's treasury address, then provide the tx hash. On-chain payment UI coming soon.`,
      { duration: 6000, icon: "🔗" },
    );
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Please log in to manage your subscription.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">GoodHive Pro</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Unlock the Full Platform</h1>
        <p className="mt-3 text-slate-500 max-w-xl mx-auto">
          Pay in USDC on Polygon. No fiat, no credit cards — pure Web3. Cancel anytime.
        </p>
      </div>

      {/* Active subscription banner */}
      {!loading && active && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 flex items-center gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800 capitalize">{active.plan} plan active</p>
            <p className="text-sm text-emerald-700">
              Expires {formatDate(active.expires_at)}
              {active.tx_hash && (
                <a
                  href={`https://polygonscan.com/tx/${active.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  View tx
                </a>
              )}
            </p>
          </div>
          <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
            Active
          </span>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative rounded-2xl border-2 bg-white p-6 shadow-sm ${plan.color} ${plan.highlight ? "shadow-md" : ""}`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-4 py-1 text-xs font-bold text-white">
                Most Popular
              </span>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.highlight ? "bg-purple-100 text-purple-600" : "bg-amber-100 text-amber-600"}`}>
                {plan.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500">USDC / month</span>
                </div>
              </div>
            </div>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void handleSubscribe(plan.key as "pro" | "enterprise")}
              disabled={active?.plan === plan.key}
              className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
                active?.plan === plan.key
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : plan.highlight
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {active?.plan === plan.key ? "Current Plan" : (
                <span className="flex items-center justify-center gap-2">
                  <Coins className="w-4 h-4" />
                  Pay {plan.price} USDC
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Web3 payment info */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-800 mb-2">How on-chain payment works</p>
        <ol className="space-y-1.5 list-decimal list-inside">
          <li>Click "Pay X USDC" above</li>
          <li>Connect your wallet (Polygon network)</li>
          <li>Approve and send USDC to GoodHive's treasury address</li>
          <li>Your subscription activates immediately on tx confirmation</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          All payments are on Polygon mainnet. Gas fees are typically under $0.01.
          USDT is also accepted. Honey Token support coming soon.
        </p>
      </div>
    </div>
  );
}
