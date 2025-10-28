"use client";

import Cookies from "js-cookie";
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
import { useState } from "react";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { useProtectedNavigation } from "@/app/hooks/useProtectedNavigation";

import { TRANSLATION, allServices } from "./services.constants";
import styles from "./services.module.scss";

export const Services = () => {
  const router = useRouter();
  const { navigate: protectedNavigate } = useProtectedNavigation();
  const { isAuthenticated, checkAuthAndShowConnectPrompt } = useAuthCheck();
  const [activeTab, setActiveTab] = useState("talent");


  const getButtonText = (id: string) => {
    if (!isAuthenticated) {
      return "Create your profile";
    }

    if (id === "talent") {
      return "Visit your talent profile";
    } else if (id === "companies") {
      return "Visit your company profile";
    }

    return "Create your profile";
  };

  return (
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
          {allServices.map((service) => {
            const { id, title, description } = service;
            const isForTalent = id === "talent";
            const Icon = isForTalent ? Users : Building2;
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
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        <div className={styles.bottomCta}>
          <div className={styles.ctaBadge}>
            <Sparkles />
            <span>
              Join the leading community in Web3! 🍯
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};