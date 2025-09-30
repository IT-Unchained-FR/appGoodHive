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

import { TRANSLATION, allServices } from "./services.constants";
import styles from "./services.module.scss";

export const Services = () => {
  const router = useRouter();
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
            Sweet Benefits
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

        {/* Enhanced Service Card */}
        <div className={styles.cardContainer}>
          {allServices.map((service) => {
            const { id, title, description } = service;
            const isForTalent = id === "talent";
            const Icon = isForTalent ? Users : Building2;
            const isActive = id === activeTab;

            return (
              <div
                key={id}
                className={`${styles.serviceCard} ${isActive ? styles.active : styles.inactive} group`}
              >
                {/* Card Background with Gradient */}
                <div className={styles.cardBackground}>
                  {/* Gradient Overlay */}
                  <div className={`${styles.gradientOverlay} ${
                    isForTalent ? styles.talent : styles.company
                  }`}></div>

                  {/* Card Content */}
                  <div className={styles.cardContent}>
                    {/* Icon and Hexagon Background */}
                    <div className={styles.iconSection}>
                      <div className={styles.iconWrapper}>
                        <div
                          className={`${styles.iconContainer} ${
                            isForTalent ? styles.talent : styles.company
                          }`}
                        >
                          <Icon />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={styles.cardTitle}>
                      {title}
                    </h3>

                    {/* Description */}
                    <p className={styles.cardDescription}>
                      {description}
                    </p>

                    {/* Features List */}
                    <div className={styles.featuresList}>
                      {isForTalent ? (
                        <>
                          <div className={styles.featureItem}>
                            <Star className={styles.talent} />
                            <span>100% commission returned</span>
                          </div>
                          <div className={styles.featureItem}>
                            <Trophy className={styles.talent} />
                            <span>Co-own your platform</span>
                          </div>
                          <div className={styles.featureItem}>
                            <Zap className={styles.talent} />
                            <span>Earn as recruiter & mentor</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.featureItem}>
                            <Star className={styles.company} />
                            <span>Stake-backed recruiters</span>
                          </div>
                          <div className={styles.featureItem}>
                            <Trophy className={styles.company} />
                            <span>Community mentoring</span>
                          </div>
                          <div className={styles.featureItem}>
                            <Zap className={styles.company} />
                            <span>Excellence rewards</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          checkAuthAndShowConnectPrompt("access this feature");
                          return;
                        }

                        if (id === "talent") {
                          return router.push("/talents/my-profile");
                        } else if (id === "companies") {
                          return router.push("/companies/my-profile");
                        }
                      }}
                      className={`${styles.ctaButton} ${
                        isForTalent ? styles.talent : styles.company
                      } group/btn`}
                    >
                      <span className={styles.buttonContent}>
                        <span>{getButtonText(id)}</span>
                        <ArrowRight />
                      </span>
                      <div className={styles.buttonOverlay}></div>
                    </button>
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
              Join the sweetest community in Web3! 🍯
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
