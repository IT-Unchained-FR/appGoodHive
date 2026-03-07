import Cookies from "js-cookie";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  Gift,
  HandCoins,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type ReferralObject = {
  wallet_address: string;
  referral_code: string;
  talents: string[];
  companies: string[];
  approved_talents: string[];
  approved_companies: string[];
};

const referralSteps = [
  {
    title: "Claim your code",
    description: "Create your personal referral code so GoodHive can track signups that come through you.",
    icon: Sparkles,
  },
  {
    title: "Share the link",
    description: "Send your link to trusted talent, clients, and communities that would be a strong fit.",
    icon: Share2,
  },
] as const;

export const ReferralSection = () => {
  const [referral, setReferral] = useState<ReferralObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const user_id = Cookies.get("user_id");

  const totalTalentsReferred = referral?.talents?.length ?? 0;
  const totalCompaniesReferred = referral?.companies?.length ?? 0;
  const totalTalentsApproved = referral?.approved_talents?.length ?? 0;
  const totalCompaniesApproved = referral?.approved_companies?.length ?? 0;

  const referralLink = useMemo(() => {
    if (!referral?.referral_code || typeof window === "undefined") return "";
    return `${window.location.origin}/?ref=${referral.referral_code}`;
  }, [referral?.referral_code]);

  const getReferralCode = useCallback(async () => {
    if (!user_id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/referrals/get-referral?user_id=${user_id}`,
      );

      if (!response.ok) {
        setReferral(null);
        return;
      }

      const referralUser = await response.json();
      if (referralUser?.referral_code) {
        setReferral(referralUser);
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user_id]);

  const handleClaimReferralCode = async () => {
    if (!user_id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/referrals/create-referral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || "Could not create referral code");
        return;
      }

      toast.success("Referral code created");
      await getReferralCode();
    } catch (error) {
      console.error("Error claiming referral code:", error);
      toast.error("Could not create referral code");
      setIsLoading(false);
    }
  };

  const refLinkCopyToClipboard = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard");
  };

  const handleNativeShare = async () => {
    if (!referralLink) return;

    try {
      setIsSharing(true);
      if (navigator.share) {
        await navigator.share({
          title: "Join GoodHive",
          text: "Use my GoodHive referral link to sign up.",
          url: referralLink,
        });
      } else {
        await refLinkCopyToClipboard();
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    if (user_id) {
      void getReferralCode();
    }
  }, [getReferralCode, user_id]);

  return (
    <div className="gh-referral-surface overflow-hidden rounded-[24px] border border-slate-200/80 bg-white">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,249,235,0.96),_rgba(255,255,255,1))] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600">
              Referral Program
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Grow your network and track referral performance
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Share your GoodHive link with strong talent and companies. When they
              join through your code, you can track who signed up and how many
              referrals became approved.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px] lg:max-w-[390px]">
            <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:min-h-[132px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:min-h-[2.9rem]">
                Referral code
              </p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-950">
                {referral?.referral_code || "Not claimed yet"}
              </p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:min-h-[132px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:min-h-[2.9rem]">
                Approval rate
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {totalTalentsApproved + totalCompaniesApproved}
              </p>
              <p className="mt-1 text-xs text-slate-500">Approved referrals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {referralSteps.map((step, index) => {
            const Icon = step.icon;
            const isReady = referral ? index > 0 || Boolean(referral) : index === 0;

            return (
              <div
                key={step.title}
                className="relative rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isReady ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  {index === 0
                    ? referral
                      ? "Code ready"
                      : "Pending setup"
                    : referral
                      ? "Ready to use"
                      : "Unlocks after code claim"}
                </div>
                {index < referralSteps.length - 1 && (
                  <ArrowRight className="absolute right-4 top-5 hidden h-4 w-4 text-slate-300 lg:block" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-emerald-200 bg-[linear-gradient(180deg,_#f0fdf4_0%,_#ffffff_100%)] px-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <HandCoins className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-950">
              Referred Talents
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Receive 5% of the commissions earned on every mission completed by
              a talent you refer, throughout their first year.
            </p>
          </div>
          <div className="rounded-[22px] border border-amber-200 bg-[linear-gradient(180deg,_#fffbeb_0%,_#ffffff_100%)] px-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-950">
              Referred Companies
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Receive 20% of the commissions earned from all missions carried out
              by a company you refer, during its first year of activity.
            </p>
          </div>
        </div>

        {!referral ? (
          <div className="mt-5 rounded-[22px] border border-amber-200 bg-[linear-gradient(180deg,_rgba(255,251,235,0.96),_rgba(255,255,255,1))] px-5 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Claim your referral code to activate sharing
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Once claimed, you’ll get a personal referral link you can copy
                  and send anywhere.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] px-5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(249,115,22,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleClaimReferralCode}
                disabled={isLoading}
              >
                {isLoading ? "Creating referral code..." : "Claim Referral Code"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Share your referral link
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Copy your link or share it directly. Anyone who signs up
                    through this URL is attached to your referral code.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1 rounded-[16px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="block truncate">{referralLink}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={refLinkCopyToClipboard}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5"
                    >
                      <Share2 className="h-4 w-4" />
                      {isSharing ? "Sharing..." : "Share"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Code
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {referral.referral_code}
                  </p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Referral active
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                Referral performance
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                GoodHive tracks both total signups and approved outcomes from your
                referral code.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Talents referred
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">
                    {totalTalentsReferred}
                  </p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Companies referred
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">
                    {totalCompaniesReferred}
                  </p>
                </div>
                <div className="rounded-[18px] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Approved talents
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-emerald-900">
                    {totalTalentsApproved}
                  </p>
                </div>
                <div className="rounded-[18px] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Approved companies
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-emerald-900">
                    {totalCompaniesApproved}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
