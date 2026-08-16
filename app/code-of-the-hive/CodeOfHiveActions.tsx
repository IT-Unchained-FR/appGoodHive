"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import toast from "react-hot-toast";
import { useConnectModal } from "thirdweb/react";

import { thirdwebClient } from "@/clients";
import { connectModalOptions, supportedWallets } from "@/lib/auth/walletConfig";
import { useAuth } from "@/app/contexts/AuthContext";
import { AUTH_CHANGED_EVENT } from "@/app/utils/authEvents";
import {
  CODE_OF_HIVE_COPY,
  CODE_OF_HIVE_VERSION,
  formatMemberSince,
  formatSignatoryCount,
} from "@/app/constants/code-of-hive";
import { CodeOfHiveSeal } from "@/app/components/code-of-hive/CodeOfHiveSeal";
import { SignCodeModal } from "@/app/components/code-of-hive/SignCodeModal";
import styles from "./page.module.scss";

type SignatureStatus = {
  authenticated: boolean;
  eligible: boolean;
  signed: boolean;
  signed_at?: string | null;
  cohort?: string | null;
  signatory_count?: number | null;
  /**
   * Client-only. Distinguishes "we know this member is not a Talent" from "we
   * could not find out". Without it a database outage tells real Talents they
   * need to create a talent profile, which is both wrong and alarming.
   */
  loadFailed?: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function CodeOfHiveActions() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { connect } = useConnectModal();
  const [status, setStatus] = useState<SignatureStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [justSigned, setJustSigned] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [isLinkingSession, setIsLinkingSession] = useState(false);

  /**
   * Set when the member started from "Join the Code", so once their session
   * lands we can open the confirmation modal for them. Signing still requires
   * an explicit click — logging in is not consent.
   */
  const wantsToSignRef = useRef(false);

  const fetchStatusOnce =
    useCallback(async (): Promise<SignatureStatus | null> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch("/api/talents/code-of-hive", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as SignatureStatus;
      } catch (error) {
        console.warn("Code of the Hive status request failed:", error);
        return null;
      } finally {
        clearTimeout(timeout);
      }
    }, []);

  /**
   * Load signature status, tolerating a cold database.
   *
   * GoodHive runs Neon's free tier, which suspends the compute when idle. The
   * first request after a sleep does not fail fast — it hangs while the
   * instance wakes, then succeeds. So we retry: the attempt that wakes Neon may
   * time out, and the next one lands on a warm instance.
   */
  const loadStatus = useCallback(
    async (attempts = 3) => {
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const result = await fetchStatusOnce();

        if (result) {
          setStatus(result);
          setIsWaking(false);
          return result;
        }

        if (attempt < attempts) {
          setIsWaking(true);
          await sleep(1500);
        }
      }

      setIsWaking(false);
      // Never assert ineligibility from a failure — that would tell a real
      // Talent to go create a talent profile.
      setStatus({
        authenticated: isAuthenticated,
        eligible: false,
        signed: false,
        loadFailed: true,
      });
      return null;
    },
    [fetchStatusOnce, isAuthenticated],
  );

  useEffect(() => {
    void loadStatus();
  }, [loadStatus, user?.user_id]);

  /**
   * The session cookie is not created by the connect modal — a nav-bar effect
   * watches the connected wallet and exchanges it for a GoodHive session
   * (see `authenticateWithWallet`). That happens after `connect()` resolves and
   * cannot be awaited from here, so listen for the app's own auth event and
   * re-resolve the CTA when the session actually lands.
   */
  useEffect(() => {
    const onAuthChanged = () => {
      void loadStatus();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [loadStatus]);

  /**
   * Once an intending signer is authenticated and eligible, open the
   * confirmation modal for them so login flows straight into signing.
   */
  useEffect(() => {
    if (!wantsToSignRef.current || !status?.authenticated) return;

    wantsToSignRef.current = false;

    if (status.signed || !status.eligible) return;

    setIsModalOpen(true);
  }, [status]);

  /** Poll until the nav-bar login has produced a session, or give up. */
  const waitForSession = useCallback(
    async (maxMs = 15000) => {
      const startedAt = Date.now();

      while (Date.now() - startedAt < maxMs) {
        const result = await fetchStatusOnce();

        if (result?.authenticated) {
          setStatus(result);
          return result;
        }

        await sleep(1200);
      }

      // Session never arrived; fall back to a normal load so the CTA is honest.
      return loadStatus();
    },
    [fetchStatusOnce, loadStatus],
  );

  const handleConnect = async () => {
    try {
      await connect({
        client: thirdwebClient,
        wallets: supportedWallets,
        ...connectModalOptions,
      });
    } catch (error) {
      // Thrown when the member closes the modal without connecting.
      console.debug("Connect modal dismissed:", error);
      return;
    }

    wantsToSignRef.current = true;
    setIsLinkingSession(true);

    try {
      await waitForSession();
    } finally {
      setIsLinkingSession(false);
    }
  };

  const handleSign = async () => {
    setIsSigning(true);

    try {
      const response = await fetch("/api/talents/code-of-hive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: CODE_OF_HIVE_VERSION }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // 409 means already signed (or the Code moved on) — reconcile with the
        // server rather than leaving the page showing a stale CTA.
        if (response.status === 409) {
          await loadStatus();
          setIsModalOpen(false);
        }
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setIsModalOpen(false);
      setJustSigned(true);
      setStatus((previous) => ({
        authenticated: true,
        eligible: true,
        signed: true,
        signed_at: data?.signed_at ?? null,
        cohort: data?.cohort ?? null,
        // Count the new signature without a refetch.
        signatory_count:
          typeof previous?.signatory_count === "number"
            ? previous.signatory_count + 1
            : (previous?.signatory_count ?? null),
      }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSigning(false);
    }
  };

  // A logged-out visitor needs no database round-trip to be shown the way in,
  // so render their CTA from client auth state alone rather than waiting.
  if (!status) {
    if (!isAuthLoading && !isAuthenticated) {
      return (
        <div className={styles.ctaWrapper}>
          <div className={styles.ctaPanel}>
            <button
              type="button"
              onClick={handleConnect}
              disabled={isLinkingSession}
              className={styles.primaryCta}
            >
              {isLinkingSession
                ? CODE_OF_HIVE_COPY.connecting
                : CODE_OF_HIVE_COPY.ctaLoggedOut}
            </button>
          </div>
        </div>
      );
    }

    if (isWaking) {
      return (
        <div className={styles.ctaWrapper}>
          <p className={styles.wakingNote} role="status">
            Waking the hive…
          </p>
        </div>
      );
    }

    return <div className={styles.ctaPanelPlaceholder} aria-hidden="true" />;
  }

  const signatoryLine = formatSignatoryCount(status.signatory_count);

  const renderPanel = () => {
    // Success state — shown immediately after signing.
    if (justSigned) {
      return (
        <div className={styles.ctaPanel}>
          <CodeOfHiveSeal cohort={status.cohort} size={200} />
          <h2 className={styles.successTitle}>
            {CODE_OF_HIVE_COPY.successTitle}
          </h2>
          <p className={styles.successBody}>{CODE_OF_HIVE_COPY.successBody}</p>
          {user?.user_id ? (
            <Link
              href={`/talents/${user.user_id}` as Route}
              className={styles.primaryCta}
            >
              {CODE_OF_HIVE_COPY.successCta}
            </Link>
          ) : null}
        </div>
      );
    }

    // Already signed on a previous visit.
    if (status.signed) {
      const memberSince = formatMemberSince(status.signed_at);

      return (
        <div className={styles.ctaPanel}>
          <CodeOfHiveSeal cohort={status.cohort} size={180} />
          <p className={styles.signedNote}>{CODE_OF_HIVE_COPY.alreadySigned}</p>
          {memberSince ? (
            <p className={styles.signedMeta}>{memberSince}</p>
          ) : null}
          {user?.user_id ? (
            <Link
              href={`/talents/${user.user_id}` as Route}
              className={styles.secondaryCta}
            >
              {CODE_OF_HIVE_COPY.successCta}
            </Link>
          ) : null}
        </div>
      );
    }

    // Could not reach the server. Never claim the member is ineligible here —
    // offer a retry instead, since this is almost always a sleeping database.
    if (status.loadFailed && status.authenticated) {
      return (
        <div className={styles.ctaPanel}>
          <p className={styles.ineligibleNote}>
            We couldn&apos;t check your status just now. This usually clears in a
            moment.
          </p>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className={styles.secondaryCta}
          >
            Try again
          </button>
        </div>
      );
    }

    // Logged in, but not a Talent. The Code is talent-only for now.
    if (status.authenticated && !status.eligible) {
      return (
        <div className={styles.ctaPanel}>
          <p className={styles.ineligibleNote}>
            The Code of the Hive is currently open to GoodHive Talents. Create a
            talent profile to give your word.
          </p>
          <Link
            href={"/talents/my-profile" as Route}
            className={styles.secondaryCta}
          >
            Create a talent profile
          </Link>
        </div>
      );
    }

    // Logged out.
    if (!status.authenticated) {
      return (
        <div className={styles.ctaPanel}>
          <button
            type="button"
            onClick={handleConnect}
            disabled={isLinkingSession}
            className={styles.primaryCta}
          >
            {isLinkingSession
              ? CODE_OF_HIVE_COPY.connecting
              : CODE_OF_HIVE_COPY.ctaLoggedOut}
          </button>
        </div>
      );
    }

    // Logged-in Talent who has not signed.
    return (
      <div className={styles.ctaPanel}>
        <p className={styles.disclaimer}>{CODE_OF_HIVE_COPY.signDisclaimer}</p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={styles.primaryCta}
        >
          {CODE_OF_HIVE_COPY.ctaSign}
        </button>
      </div>
    );
  };

  return (
    <div className={styles.ctaWrapper}>
      {renderPanel()}
      {signatoryLine ? (
        <p className={styles.signatoryCount}>{signatoryLine}</p>
      ) : null}

      {/* Mounted outside the panel so it survives a CTA state change mid-flow,
          such as the status refresh that follows login. */}
      <SignCodeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleSign}
        isSigning={isSigning}
      />
    </div>
  );
}

export default CodeOfHiveActions;
