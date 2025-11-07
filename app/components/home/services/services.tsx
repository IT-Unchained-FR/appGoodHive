"use client";

import clsx from "clsx";
import {
  ArrowRight,
  Building2,
  Crown,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { useState } from "react";
=======
import { useEffect, useRef, useState } from "react";

>>>>>>> Stashed changes
=======
import { useEffect, useRef, useState } from "react";

>>>>>>> Stashed changes
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { useProtectedNavigation } from "@/app/hooks/useProtectedNavigation";

import { TRANSLATION, allServices } from "./services.constants";
import styles from "./services.module.scss";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes

type IndicatorState = {
  width: number;
  left: number;
};
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

export const Services = () => {
  const router = useRouter();
  const { navigate: protectedNavigate } = useProtectedNavigation();
  const { isAuthenticated, checkAuthAndShowConnectPrompt } = useAuthCheck();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  const [activeTab, setActiveTab] = useState("talent");
=======
  const [activeServiceId, setActiveServiceId] = useState(allServices[0]?.id ?? "talent");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorState>({ width: 0, left: 0 });
=======
  const [activeServiceId, setActiveServiceId] = useState(allServices[0]?.id ?? "talent");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorState>({ width: 0, left: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeServiceId];

      if (!activeEl) {
        return;
      }

      setIndicatorStyle({
        width: activeEl.offsetWidth,
        left: activeEl.offsetLeft,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeServiceId]);
>>>>>>> Stashed changes

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeServiceId];

      if (!activeEl) {
        return;
      }

      setIndicatorStyle({
        width: activeEl.offsetWidth,
        left: activeEl.offsetLeft,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeServiceId]);
>>>>>>> Stashed changes


  const getButtonText = (id: string) => {
    if (!isAuthenticated) {
      return "Create your profile";
    }

    if (id === "talent") {
      return "Visit your talent profile";
    }

    if (id === "companies") {
      return "Visit your company profile";
    }

    return "Create your profile";
  };

  return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    <section className={styles.servicesSection}>
      {/* Decorative Background */}
      <div className={styles.decorativeBackground}>
        {/* Floating Hexagons */}
        <div className={styles.floatingHexagon1}>
          <div></div>
        </div>
        <div className={styles.floatingHexagon2}>
          <div></div>
        </div>

        {/* Animated Bees */}
        <div className={styles.animatedBee1}>
          <div>
            <span>🐝</span>
          </div>
        </div>
        <div className={styles.animatedBee2}>
          <div>
            <span>🐝</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* Enhanced Header */}
        <div className={styles.header}>
          <div className={styles.badge}>
            <Crown />
            Key Benefits
          </div>
          <h1 className={styles.title}>
            <span className={styles.titleMain}>Why Choose</span>
            <span className={styles.titleHighlight}>
              GoodHive
            </span>
          </h1>
          <p className={styles.description}>
            {TRANSLATION.description}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <div className={styles.tabContainer}>
            {allServices.map((service) => (
              <button
                key={service.id}
                onClick={() => setActiveTab(service.id)}
                className={`${styles.tabButton} ${
                  activeTab === service.id
                    ? service.id === "talent"
                      ? styles.activeTalent
                      : styles.activeCompany
                    : styles.inactive
                }`}
              >
                {service.id === "talent" ? "For Job Seekers / Talent" : "For Companies / Recruiter"}
              </button>
            ))}
          </div>
        </div>

        {/* Modern Two-Card Layout */}
        <div className={styles.cardsContainer}>
=======
    <section className={styles.section}>
      <div className={styles.background} aria-hidden>
        <div className={clsx(styles.hexagon, styles.hexagonTop)} />
        <div className={clsx(styles.hexagon, styles.hexagonBottom)} />

        <span className={clsx(styles.bee, styles.beeLarge)}>🐝</span>
        <span className={clsx(styles.bee, styles.beeSmall)}>🐝</span>
      </div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.badge}>
            <Crown size={16} />
            Sweet Benefits
          </div>

          <h1 className={styles.title}>
            <span>Why Choose</span>
            <span className={styles.titleHighlight}>GoodHive</span>
          </h1>

          <p className={styles.description}>{TRANSLATION.description}</p>
        </header>

        <div className={styles.tabSwitcher}>
          <div className={styles.tabList}>
            <div
              className={styles.tabIndicator}
              style={{
                width: indicatorStyle.width ? `${indicatorStyle.width}px` : undefined,
                transform: `translateX(${indicatorStyle.left}px)`,
                opacity: indicatorStyle.width ? 1 : 0,
              }}
              aria-hidden
            />
            {allServices.map(({ id, title }) => {
              const isActive = activeServiceId === id;

              return (
                <button
                  key={id}
                  type="button"
                  ref={(el) => {
                    tabRefs.current[id] = el;
                  }}
                  onClick={() => setActiveServiceId(id)}
                  className={clsx(styles.tab, isActive && styles.tabActive)}
                  aria-pressed={isActive}
                >
                  {title}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.cardStage}>
>>>>>>> Stashed changes
=======
    <section className={styles.section}>
      <div className={styles.background} aria-hidden>
        <div className={clsx(styles.hexagon, styles.hexagonTop)} />
        <div className={clsx(styles.hexagon, styles.hexagonBottom)} />

        <span className={clsx(styles.bee, styles.beeLarge)}>🐝</span>
        <span className={clsx(styles.bee, styles.beeSmall)}>🐝</span>
      </div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.badge}>
            <Crown size={16} />
            Sweet Benefits
          </div>

          <h1 className={styles.title}>
            <span>Why Choose</span>
            <span className={styles.titleHighlight}>GoodHive</span>
          </h1>

          <p className={styles.description}>{TRANSLATION.description}</p>
        </header>

        <div className={styles.tabSwitcher}>
          <div className={styles.tabList}>
            <div
              className={styles.tabIndicator}
              style={{
                width: indicatorStyle.width ? `${indicatorStyle.width}px` : undefined,
                transform: `translateX(${indicatorStyle.left}px)`,
                opacity: indicatorStyle.width ? 1 : 0,
              }}
              aria-hidden
            />
            {allServices.map(({ id, title }) => {
              const isActive = activeServiceId === id;

              return (
                <button
                  key={id}
                  type="button"
                  ref={(el) => {
                    tabRefs.current[id] = el;
                  }}
                  onClick={() => setActiveServiceId(id)}
                  className={clsx(styles.tab, isActive && styles.tabActive)}
                  aria-pressed={isActive}
                >
                  {title}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.cardStage}>
>>>>>>> Stashed changes
          {allServices.map((service) => {
            const { id, title, description } = service;
            const isActive = activeServiceId === id;
            const isForTalent = id === "talent";
            const Icon = isForTalent ? Users : Building2;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            const isActive = id === activeTab;

            return (
              <div
                key={id}
                className={`${styles.serviceSection} ${isActive ? styles.active : styles.inactive}`}
              >
                {/* Service Details Card */}
                <div className={`${styles.serviceCard} ${isForTalent ? styles.talent : styles.company}`}>
                  {/* Floating Particles */}
                  <div className={styles.cardFloatingParticles}>
                    <div className={`${styles.particle} ${styles.particle1}`}>✨</div>
                    <div className={`${styles.particle} ${styles.particle2}`}>⭐</div>
                    <div className={`${styles.particle} ${styles.particle3}`}>💫</div>
                  </div>

                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.iconSection}>
                      <div className={`${styles.iconContainer} ${isForTalent ? styles.talent : styles.company}`}>
                        <Icon />
                      </div>
                    </div>
                    <div className={styles.headerText}>
                      <h3 className={styles.cardTitle}>{title}</h3>
                      <p className={styles.cardDescription}>{description}</p>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className={styles.featuresList}>
                    {isForTalent ? (
                      <>
                        <div className={styles.featureItem}>
                          <div className={`${styles.featureIcon} ${styles.talent}`}>
                            <Star />
                          </div>
                          <span>100% commission returned</span>
                        </div>
                        <div className={styles.featureItem}>
                          <div className={`${styles.featureIcon} ${styles.talent}`}>
                            <Trophy />
                          </div>
                          <span>Co-own your platform</span>
                        </div>
                        <div className={styles.featureItem}>
                          <div className={`${styles.featureIcon} ${styles.talent}`}>
                            <Zap />
                          </div>
                          <span>Earn as recruiter & mentor</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.featureItem}>
                          <div className={`${styles.featureIcon} ${styles.company}`}>
                            <Star />
                          </div>
                          <span>Stake-backed recruiters</span>
                        </div>
                        <div className={styles.featureItem}>
                          <div className={`${styles.featureIcon} ${styles.company}`}>
                            <Trophy />
                          </div>
                          <span>Community mentoring</span>
                        </div>
                        <div className={styles.featureItem}>
                          <div className={`${styles.featureIcon} ${styles.company}`}>
                            <Zap />
                          </div>
                          <span>Excellence rewards</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        checkAuthAndShowConnectPrompt("access this feature", "service-action", { serviceType: id });
                        return;
                      }

                      if (id === "talent") {
                        return router.push("/talents/my-profile");
                      } else if (id === "companies") {
                        return router.push("/companies/my-profile");
                      }
                    }}
                    className={`${styles.ctaButton} ${isForTalent ? styles.talent : styles.company}`}
                  >
                    <span className={styles.buttonContent}>
                      <span>{getButtonText(id)}</span>
                      <ArrowRight />
                    </span>
                  </button>
                </div>

                {/* Video Card */}
                <div className={`${styles.videoCard} ${isForTalent ? styles.talent : styles.company}`}>
                  {/* Floating Particles */}
                  <div className={styles.cardFloatingParticles}>
                    <div className={`${styles.particle} ${styles.particle1}`}>🎥</div>
                    <div className={`${styles.particle} ${styles.particle2}`}>🎬</div>
                    <div className={`${styles.particle} ${styles.particle3}`}>📺</div>
                  </div>

                  <div className={styles.videoHeader}>
                    <h4 className={styles.videoTitle}>Platform Overview</h4>
                    <p className={styles.videoSubtitle}>See how GoodHive works</p>
                  </div>
                  <div className={styles.videoContainer}>
                    <iframe
                      src="https://www.youtube.com/embed/4ep_oZ0khzo"
                      title="GoodHive Platform Overview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className={styles.videoEmbed}
                    ></iframe>
                  </div>
                </div>
              </div>
=======
            const features = isForTalent
              ? [
                  { Icon: Star, text: "100% commission returned" },
                  { Icon: Trophy, text: "Co-own your platform" },
                  { Icon: Zap, text: "Earn as recruiter & mentor" },
                ]
              : [
                  { Icon: Star, text: "Stake-backed recruiters" },
                  { Icon: Trophy, text: "Community mentoring" },
                  { Icon: Zap, text: "Excellence rewards" },
                ];

            return (
              <article
                key={id}
                className={clsx(
                  styles.card,
                  isForTalent ? styles.cardTalent : styles.cardCompany,
                  isActive && styles.cardActive,
                )}
                aria-hidden={!isActive}
              >
                <div className={styles.cardHeader}>
                  <div
                    className={clsx(
                      styles.iconWrapper,
                      isForTalent ? styles.iconTalent : styles.iconCompany,
                    )}
                  >
                    <Icon size={40} />
                  </div>

                  <h3 className={styles.cardTitle}>{title}</h3>
                </div>

                <p className={styles.cardText}>{description}</p>

                <div className={styles.featureList}>
                  {features.map(({ Icon: FeatureIcon, text }) => (
                    <div key={text} className={styles.feature}>
                      <FeatureIcon
                        className={clsx(
                          styles.featureIcon,
                          isForTalent
                            ? styles.featureIconTalent
                            : styles.featureIconCompany,
                        )}
                      />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

=======
            const features = isForTalent
              ? [
                  { Icon: Star, text: "100% commission returned" },
                  { Icon: Trophy, text: "Co-own your platform" },
                  { Icon: Zap, text: "Earn as recruiter & mentor" },
                ]
              : [
                  { Icon: Star, text: "Stake-backed recruiters" },
                  { Icon: Trophy, text: "Community mentoring" },
                  { Icon: Zap, text: "Excellence rewards" },
                ];

            return (
              <article
                key={id}
                className={clsx(
                  styles.card,
                  isForTalent ? styles.cardTalent : styles.cardCompany,
                  isActive && styles.cardActive,
                )}
                aria-hidden={!isActive}
              >
                <div className={styles.cardHeader}>
                  <div
                    className={clsx(
                      styles.iconWrapper,
                      isForTalent ? styles.iconTalent : styles.iconCompany,
                    )}
                  >
                    <Icon size={40} />
                  </div>

                  <h3 className={styles.cardTitle}>{title}</h3>
                </div>

                <p className={styles.cardText}>{description}</p>

                <div className={styles.featureList}>
                  {features.map(({ Icon: FeatureIcon, text }) => (
                    <div key={text} className={styles.feature}>
                      <FeatureIcon
                        className={clsx(
                          styles.featureIcon,
                          isForTalent
                            ? styles.featureIconTalent
                            : styles.featureIconCompany,
                        )}
                      />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

>>>>>>> Stashed changes
                <button
                  type="button"
                  onClick={() => onCtaClickHandler(id)}
                  className={clsx(
                    styles.ctaButton,
                    isForTalent ? styles.ctaButtonTalent : styles.ctaButtonCompany,
                  )}
                >
                  <span>{getButtonText(id)}</span>
                  <ArrowRight className={styles.ctaButtonIcon} />
                </button>

                <div
                  className={clsx(
                    styles.accent,
                    styles.accentTop,
                    isForTalent ? styles.accentTalent : styles.accentCompany,
                  )}
                  aria-hidden
                />
                <div
                  className={clsx(
                    styles.accent,
                    styles.accentBottom,
                    isForTalent ? styles.accentTalent : styles.accentCompany,
                  )}
                  aria-hidden
                />
                <div
                  className={clsx(
                    styles.floatingDecoration,
                    isForTalent
                      ? styles.floatingDecorationTalent
                      : styles.floatingDecorationCompany,
                  )}
                  aria-hidden
                />
              </article>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            );
          })}
        </div>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        {/* Bottom CTA Section */}
        <div className={styles.bottomCta}>
          <div className={styles.ctaBadge}>
            <Sparkles />
            <span>
              Join the leading community in Web3! 🍯
            </span>
=======
=======
>>>>>>> Stashed changes
        <div className={styles.bottomCta}>
          <div className={styles.bottomBadge}>
            <Sparkles className={styles.sparkleIcon} />
            <span>Join the sweetest community in Web3! 🍯</span>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
          </div>
        </div>
      </div>
    </section>
  );
};