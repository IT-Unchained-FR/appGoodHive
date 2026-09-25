"use client";

import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useConnectModal, useActiveAccount } from "thirdweb/react";
import { thirdwebClient } from "@/clients";
import { activeChain } from "@/config/chains";
import { supportedWallets, connectModalOptions } from "@/lib/auth/walletConfig";
import styles from "./CompanyLandingPage.module.scss";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Compass,
  Eye,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
  MessageSquare,
  PlayCircle,
  Plus,
  Briefcase,
  Globe,
  Zap,
  Lock,
  BarChart3,
  Users,
  Link2,
  Rocket,
  Hexagon
} from "lucide-react";

import { Button } from "@/app/components/button";
import ProfileImageUpload from "@/app/components/profile-image-upload";
import { ReferralSection } from "@/app/components/referral/referral-section";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { countryCodes } from "@/app/constants/phoneNumberCountryCode";
import "@/app/styles/rich-text.css";
import LabelOption from "@interfaces/label-option";
import { uploadFileToBucket } from "@utils/upload-file-bucket";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "react-quill/dist/quill.snow.css";
import { countries } from "../../constants/countries";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import { CompanyProfileTour } from "./CompanyProfileTour";
import {
  FieldError,
  FieldRow,
  LinkRow,
  SectionTitle,
  StackOverflowIcon,
  XIcon,
  hexClip,
  ui,
} from "./profile-ui";
// Dynamically import React Quill to prevent server-side rendering issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Quill renders its buttons into the custom toolbar next to the "About" label
const quillModules = {
  toolbar: { container: "#company-about-toolbar" },
};

const companyLinks = [
  { name: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/company/…" },
  { name: "github", label: "GitHub", icon: Github, placeholder: "https://github.com/…" },
  { name: "twitter", label: "X / Twitter", icon: XIcon, placeholder: "https://x.com/…" },
  { name: "stackoverflow", label: "Stack Overflow", icon: StackOverflowIcon, placeholder: "https://stackoverflow.com/…" },
  { name: "portfolio", label: "Website", icon: Globe, placeholder: "https://…" },
];

export default function MyProfile() {
  const router = useRouter();
  const userId = useCurrentUserId();
  const activeAccount = useActiveAccount();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const imageInputValue = useRef(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [tourReplayToken, setTourReplayToken] = useState(0);
  const [profileData, setProfileData] = useState({
    headline: "",
    designation: "",
    address: "",
    country: "",
    city: "",
    phone_country_code: "",
    phone_number: "",
    email: "",
    telegram: "",
    image_url: "",
    linkedin: "",
    github: "",
    twitter: "",
    stackoverflow: "",
    portfolio: "",
    status: "",
    referrer: "",
    approved: false,
    inreview: null,
    wallet_address: "",
  });

  const unapprovedProfile =
    profileData?.approved === false && profileData.inreview === true;

  const savedProfile =
    profileData?.approved === false && profileData.inreview === false;

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [noProfileFound, setNoProfileFound] = useState<boolean>(false);
  const [isShowReferralSection, setIsShowReferralSection] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(
    null,
  );

  const [selectedPhoneCountryCode, setSelectedPhoneCountryCode] =
    useState<LabelOption | null>(null);

  // Wallet address will be handled by Thirdweb integration later
  // const { address } = useAccount();
  const walletAddress = profileData?.wallet_address || "";

  // Connect Modal hook for authentication
  const { connect, isConnecting } = useConnectModal();

  // Convert countryCodes to LabelOption format for SelectInput
  const phoneCountryCodeOptions: LabelOption[] = useMemo(
    () =>
      countryCodes.map((countryCode) => ({
        label: `${countryCode.name} ${countryCode.dial_code}`,
        value: countryCode.dial_code,
      })),
    [],
  );

  const handleImageClick = () => {
    setProfileData({ ...profileData, image_url: "" });
  };

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    const profileResponse = await fetch(
      `/api/companies/my-profile?userId=${userId}`,
    );

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();

      setProfileData(profileData);

      if (profileData.country) {
        const countryOption = countries.find(
          (country) => country.value === profileData.country,
        );
        setSelectedCountry(countryOption || null);
      }

      if (profileData.phone_country_code) {
        const phoneCountryCodeOption = phoneCountryCodeOptions.find(
          (option) => option.value === profileData.phone_country_code,
        );
        setSelectedPhoneCountryCode(phoneCountryCodeOption || null);
      }

      setIsShowReferralSection(true);
    } else {
      console.log("No profile found or error:", profileResponse.status);
      setNoProfileFound(true);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    setNoProfileFound(false);

    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  const scrollToFirstError = (errors: { [key: string]: string }) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;

    // Define the order of fields as they appear on the page
    const fieldOrder = [
      'image_url',
      'designation', 
      'headline',
      'email',
      'address',
      'city', 
      'country',
      'phone_country_code',
      'phone_number',
      'telegram',
      'linkedin',
      'github',
      'twitter',
      'stackoverflow',
      'portfolio'
    ];

    // Find the first error field based on page order
    const firstErrorField = fieldOrder.find(field => errorKeys.includes(field)) || errorKeys[0];
    
    // Find the element and scroll to it
    const element = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}, [data-field="${firstErrorField}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus the element if it's an input
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        setTimeout(() => element.focus(), 500);
      }
    }
  };

  const handleFormSubmit = async (data: any, validate: boolean) => {
    setIsSaving(true);

    const isNewUser = !profileData.designation;
    const referralCode = Cookies.get("referralCode");
    const imageUrl = profileImage
      ? await uploadFileToBucket(profileImage)
      : profileData.image_url;

    const isAlreadyReferred = profileData.referrer ? true : false;

    const requiredFields = {
      headline: "Company description",
      designation: "Company name", 
      address: "Address",
      email: "Email",
      country: "Country",
      city: "City",
      phone_country_code: "Phone country code",
      phone_number: "Phone number",
      telegram: "Telegram",
    };

    if (validate) {
      const newErrors: { [key: string]: string } = {};

      // Check for picture first
      if (!imageUrl || (typeof imageUrl === 'string' && imageUrl.trim() === '')) {
        newErrors["image_url"] =
          "Add a company profile picture so your profile is ready for review.";
        toast.error("Please add a company profile picture before submitting.");
      }

      Object.entries(requiredFields).forEach(([key, label]) => {
        if (!data[key]) {
          newErrors[key] = `${label} is required`;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        scrollToFirstError(newErrors);
        if (!newErrors['image_url']) {
          toast.error("Please fill in all required fields");
        }
        setIsSaving(false);
        return;
      }
    }

    setErrors({}); // Clear errors if validation passes

    const dataForm = {
      headline: data.headline,
      user_id: userId,
      designation: data.designation,
      address: data.address,
      country: selectedCountry?.value,
      city: data.city,
      phone_country_code: selectedPhoneCountryCode?.value,
      phone_number: data["phone_number"],
      email: data.email,
      telegram: data.telegram,
      image_url: imageUrl,
      wallet_address: walletAddress,
      linkedin: data.linkedin,
      github: data.github,
      stackoverflow: data.stackoverflow,
      twitter: data.twitter,
      portfolio: data.portfolio,
      status: profileData.status || "pending",
      referrer: isAlreadyReferred ? null : referralCode,
      inreview: validate,
    };

    const filteredData = Object.fromEntries(
      Object.entries(dataForm).filter(
        ([, value]) => value != null && value !== "",
      ),
    );

    const profileResponse = await fetch("/api/companies/my-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filteredData),
    });

    setIsSaving(false);

    if (!profileResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      if (validate) {
        await fetch("/api/send-email", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          // Sent to the address on the saved profile.
          body: JSON.stringify({ type: "new-company" }),
        });

        toast.success("Profile sent to review by the core team!");
      } else {
        toast.success("Profile Saved!");
        window.location.reload();
      }
    }
  };

  const handleFormSaving = (e: any) => {
    e.preventDefault();
    handleFormSubmit(profileData, false);
  };

  const handleFormReview = (e: any) => {
    e.preventDefault();
    handleFormSubmit(profileData, true);
  };

  const handleConnectWallet = async () => {
    try {
      await connect({
        client: thirdwebClient,
        wallets: supportedWallets,
        chain: activeChain,
        ...connectModalOptions,
      });
    } catch (error) {
      console.debug("Connect modal dismissed", error);
    }
  };

  if (!userId) {
    return (
      <main className={styles.container}>
        {/* Decorative Background Elements */}
        <div className={styles.backgroundDecorations}>
          {/* Honeycomb Pattern */}
          <div className={styles.honeycombPattern}>
            <div className={styles.honeycombGrid}>
              {Array.from({ length: 144 }, (_, i) => (
                <div key={i} className={styles.honeycombCell}></div>
              ))}
            </div>
          </div>

          {/* Floating Bees */}
          <div className={styles.floatingBee1}>
            <div className={`${styles.beeAnimation} ${styles.beeAnimation1}`}>
              <span className={styles.bee}>🐝</span>
            </div>
          </div>

          <div className={styles.floatingBee2}>
            <div className={`${styles.beeAnimation} ${styles.beeAnimation2}`}>
              <span className={styles.bee2}>🐝</span>
            </div>
          </div>

          <div className={styles.floatingBee3}>
            <div className={`${styles.beeAnimation} ${styles.beeAnimation3}`}>
              <span className={styles.bee3}>🐝</span>
            </div>
          </div>

          {/* Hexagon Clusters */}
          <div className={styles.topLeftHexCluster}>
            <svg className="w-[400px] h-[400px]" viewBox="0 0 400 400">
              <defs>
                <linearGradient id="hexGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="hexGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <polygon
                points="180,60 250,95 250,165 180,200 110,165 110,95"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                opacity="0.3"
                strokeDasharray="5 3"
              />

              <polygon
                points="140,130 200,160 200,220 140,250 80,220 80,160"
                fill="url(#hexGradient1)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                opacity="0.25"
              />

              <polygon
                points="260,40 300,62 300,106 260,128 220,106 220,62"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.35"
              />

              <polygon
                points="300,160 340,182 340,226 300,248 260,226 260,182"
                fill="url(#hexGradient2)"
                stroke="#d97706"
                strokeWidth="1.8"
                opacity="0.2"
              />

              <polygon
                points="80,80 105,93 105,119 80,132 55,119 55,93"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                opacity="0.4"
                strokeDasharray="3 2"
              />

              <polygon
                points="220,260 245,273 245,299 220,312 195,299 195,273"
                fill="#fbbf24"
                fillOpacity="0.1"
                stroke="#d97706"
                strokeWidth="1.2"
                opacity="0.3"
              />
            </svg>
          </div>

          <div className={styles.topRightHexCluster}>
            <svg className="w-[350px] h-[350px]" viewBox="0 0 350 350">
              <defs>
                <linearGradient id="hexGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <polygon
                points="220,50 280,80 280,140 220,170 160,140 160,80"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                opacity="0.25"
                strokeDasharray="5 3"
              />

              <polygon
                points="170,110 230,140 230,200 170,230 110,200 110,140"
                fill="url(#hexGradient3)"
                stroke="#d97706"
                strokeWidth="1.8"
                opacity="0.2"
              />

              <polygon
                points="260,180 300,200 300,240 260,260 220,240 220,200"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.3"
              />

              <polygon
                points="120,220 160,240 160,280 120,300 80,280 80,240"
                fill="#f59e0b"
                fillOpacity="0.08"
                stroke="#fbbf24"
                strokeWidth="1.5"
                opacity="0.18"
              />
            </svg>
          </div>

          <div className={styles.bottomLeftHexCluster}>
            <svg className="w-[300px] h-[300px]" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="hexGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              <polygon
                points="150,200 210,230 210,290 150,320 90,290 90,230"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.2"
                opacity="0.22"
                strokeDasharray="4 3"
              />

              <polygon
                points="120,150 180,180 180,240 120,270 60,240 60,180"
                fill="url(#hexGradient4)"
                stroke="#f59e0b"
                strokeWidth="1.6"
                opacity="0.18"
              />

              <polygon
                points="200,120 240,140 240,180 200,200 160,180 160,140"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.8"
                opacity="0.28"
              />
            </svg>
          </div>

          <div className={styles.bottomRightHexCluster}>
            <svg className="w-[450px] h-[450px]" viewBox="0 0 450 450">
              <defs>
                <linearGradient id="hexGradient5" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="hexGradient6" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              <polygon
                points="260,220 330,265 330,355 260,400 190,355 190,265"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                opacity="0.3"
                strokeDasharray="6 4"
              />

              <polygon
                points="310,150 370,185 370,255 310,290 250,255 250,185"
                fill="url(#hexGradient5)"
                stroke="#d97706"
                strokeWidth="1.8"
                opacity="0.22"
              />

              <polygon
                points="180,360 220,382 220,426 180,448 140,426 140,382"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.35"
              />

              <polygon
                points="140,230 180,252 180,296 140,318 100,296 100,252"
                fill="url(#hexGradient6)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                opacity="0.25"
              />

              <polygon
                points="360,330 385,343 385,369 360,382 335,369 335,343"
                fill="none"
                stroke="#d97706"
                strokeWidth="1.5"
                opacity="0.4"
                strokeDasharray="3 2"
              />
            </svg>
          </div>

          {/* Scattered Small Hexagons */}
          <div className={styles.scatteredHexagons}>
            <div className={styles.topCenterHex}>
              <svg width="50" height="50" viewBox="0 0 50 50">
                <polygon
                  points="25,7 40,15 40,31 25,39 10,31 10,15"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  opacity="0.2"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>

            <div className={styles.midLeftHex}>
              <svg width="35" height="35" viewBox="0 0 35 35">
                <polygon
                  points="17.5,5 27.5,10 27.5,20 17.5,25 7.5,20 7.5,10"
                  fill="#fbbf24"
                  fillOpacity="0.08"
                  stroke="#d97706"
                  strokeWidth="1.2"
                  opacity="0.25"
                />
              </svg>
            </div>

            <div className={styles.midRightHex}>
              <svg width="40" height="40" viewBox="0 0 40 40">
                <polygon
                  points="20,6 32,12 32,24 20,30 8,24 8,12"
                  fill="none"
                  stroke="#fcd34d"
                  strokeWidth="1.8"
                  opacity="0.18"
                  strokeDasharray="3 2"
                />
              </svg>
            </div>

            <div className={styles.bottomCenterHex}>
              <svg width="45" height="45" viewBox="0 0 45 45">
                <polygon
                  points="22.5,6 36,13 36,27 22.5,34 9,27 9,13"
                  fill="#f59e0b"
                  fillOpacity="0.06"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.contentWrapper}>
          {/* Hero Section */}
          <div className={styles.heroSection}>
            {/* Floating elements */}
            <div className={styles.floatingElement1}></div>
            <div className={styles.floatingElement2}></div>

            <div className={styles.heroContent}>
              <div className={styles.badge}>
                <Hexagon className={styles.badgeIcon} />
                <span className={styles.badgeText}>GoodHive for Companies</span>
              </div>

              <h1 className={styles.heroTitle}>
                Join the Premier
                <span className={styles.heroTitleGradient}>
                  Web3 Talent Marketplace
                </span>
              </h1>

              <p className={styles.heroDescription}>
                Connect with top-tier Web3 developers, designers, and blockchain experts.
                Build your dream team and scale your projects with the best talent in the industry.
              </p>

              {/* Connect Wallet Button */}
              <div className={styles.connectSection}>
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className={styles.connectButton}
                >
                  <div className={styles.connectButtonOverlay}></div>
                  <div className={styles.connectButtonContent}>
                    {isConnecting ? (
                      <>
                        <div className={styles.spinner}></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className={styles.connectButtonIcon} />
                        Connect Wallet to Get Started
                      </>
                    )}
                  </div>
                  <div className={styles.connectButtonShine}></div>
                </button>

                <p className={styles.connectDescription}>
                  Connect with MetaMask, WalletConnect, or create an account with your email
                </p>
              </div>

              {/* Decorative line */}
              <div className={styles.decorativeLine}>
                <div className={styles.lineSegment1}></div>
                <div className={styles.lineDot1}></div>
                <div className={styles.lineSegment2}></div>
                <div className={styles.lineDot2}></div>
                <div className={styles.lineSegment3}></div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className={styles.featuresGrid}>
            {/* Feature 1 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration1}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon1}`}>
                  <Briefcase />
                </div>
                <h3 className={styles.featureTitle}>Post Unlimited Jobs</h3>
                <p className={styles.featureDescription}>
                  Create and manage job postings for your Web3 projects. Reach thousands of qualified candidates instantly.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration2}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon2}`}>
                  <Globe />
                </div>
                <h3 className={styles.featureTitle}>Global Talent Pool</h3>
                <p className={styles.featureDescription}>
                  Access top Web3 developers, designers, and blockchain experts from around the world.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration3}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon3}`}>
                  <Zap />
                </div>
                <h3 className={styles.featureTitle}>Fast Hiring</h3>
                <p className={styles.featureDescription}>
                  Streamlined application process and direct communication tools to hire the best talent quickly.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration4}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon4}`}>
                  <Lock />
                </div>
                <h3 className={styles.featureTitle}>Secure & Verified</h3>
                <p className={styles.featureDescription}>
                  All talent profiles are verified and vetted. Secure Web3-native hiring with smart contracts.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration5}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon5}`}>
                  <BarChart3 />
                </div>
                <h3 className={styles.featureTitle}>Analytics & Insights</h3>
                <p className={styles.featureDescription}>
                  Track application metrics, hiring performance, and team growth with detailed analytics.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration6}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon6}`}>
                  <Users />
                </div>
                <h3 className={styles.featureTitle}>Community Driven</h3>
                <p className={styles.featureDescription}>
                  Join a thriving community of Web3 companies and talent building the future together.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className={styles.ctaSection}>
            <div className={styles.ctaCard}>
              <div className={styles.ctaCardDecoration1}></div>
              <div className={styles.ctaCardDecoration2}></div>

              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>
                  Ready to Build Your
                  <span className={styles.ctaTitleGradient}>
                    Dream Team?
                  </span>
                </h2>
                <p className={styles.ctaDescription}>
                  Join hundreds of Web3 companies already using GoodHive to find and hire exceptional talent.
                </p>

                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className={styles.ctaButton}
                >
                  <div className={styles.ctaButtonOverlay}></div>
                  <div className={styles.ctaButtonContent}>
                    {isConnecting ? (
                      <>
                        <div className={styles.ctaSpinner}></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Rocket className={styles.ctaButtonIcon} />
                        Get Started Now
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Loading Your Profile, Please Wait"} />;
  }
  if (isSaving) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Saving Your Profile..."} />;
  }

  const clearError = (key: string) => {
    if (!errors[key]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const aboutLength = profileData.headline?.replace(/<[^>]*>/g, "")?.length || 0;
  const linkedCount = companyLinks.filter(
    (link) => profileData[link.name as keyof typeof profileData],
  ).length;
  const locationText = [profileData.city, selectedCountry?.label]
    .filter(Boolean)
    .join(", ");
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : "";

  const status = profileData.approved
    ? { title: "Profile approved", detail: "Live on GoodHive", dot: "bg-emerald-500" }
    : unapprovedProfile
      ? { title: "Under review", detail: "You'll be notified once it's approved", dot: "bg-sky-500" }
      : savedProfile
        ? { title: "Draft saved", detail: "Complete required fields and submit for review", dot: "bg-amber-500" }
        : { title: "New profile", detail: "Create your profile to start posting jobs", dot: "bg-stone-400" };

  return (
    <>
      <style jsx global>{`
        .company-about .ql-toolbar.ql-snow,
        .company-about .quill .ql-container.ql-snow,
        .company-about div.company-about-editor .ql-container.ql-snow {
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          font-family: inherit !important;
        }
        .company-about .ql-toolbar.ql-snow {
          padding: 0 !important;
        }
        .company-about .quill .ql-container.ql-snow {
          min-height: 0 !important;
          font-size: 17px !important;
        }
        .company-about .quill .ql-container.ql-snow .ql-editor {
          min-height: 220px !important;
          max-width: 70ch;
          padding: 16px 0 8px !important;
          font-size: 17px !important;
          line-height: 1.6 !important;
          color: #1c1917;
        }
        .company-about .ql-editor.ql-blank::before {
          left: 0 !important;
          right: 0 !important;
          font-style: normal !important;
          color: #a8a29e !important;
        }
        .company-about .ql-toolbar.ql-snow button {
          width: 30px !important;
          height: 30px !important;
          padding: 6px !important;
          border-radius: 0 !important;
        }
        .company-about .ql-toolbar.ql-snow button:hover,
        .company-about .ql-toolbar.ql-snow button.ql-active {
          background: #fef3c7 !important;
        }
        .company-about .ql-snow button:hover .ql-stroke,
        .company-about .ql-snow button.ql-active .ql-stroke {
          stroke: #d97706 !important;
        }
        .company-about .ql-snow button:hover .ql-fill,
        .company-about .ql-snow button.ql-active .ql-fill {
          fill: #d97706 !important;
        }
      `}</style>

      <CompanyProfileTour
        userId={userId}
        autoStart={noProfileFound}
        replayToken={tourReplayToken}
      />

      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl overflow-hidden bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center bg-stone-100 text-stone-600 transition-colors hover:bg-stone-200"
            >
              ✕
            </button>
            <div className="border-b border-stone-200 p-4 pb-2">
              <h3 className="text-lg font-bold text-stone-900">
                How to set up your company profile
              </h3>
            </div>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src="https://www.youtube.com/embed/bKD2_bNhGHI?autoplay=1"
                title="Company Profile Walkthrough"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#fffaf0] text-stone-900">
        <main className="mx-auto w-full max-w-[1200px] px-4 pt-8 sm:px-8">
          {/* Page header */}
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
            <div>
              <h6 className="mb-1 text-[13px] font-extrabold uppercase tracking-[0.08em] text-amber-600">
                Company Hive Profile
              </h6>
              <p className={`text-[13px] ${ui.muted}`}>
                Your public page on the GoodHive network. Talent sees exactly what you publish here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-tour="how-it-works"
                onClick={() => setShowVideoModal(true)}
                className={ui.btnAccent}
              >
                <PlayCircle className="h-4 w-4" />
                How it works
              </button>
              {noProfileFound && (
                <button
                  type="button"
                  onClick={() => setTourReplayToken((n) => n + 1)}
                  className={ui.btnAccent}
                >
                  <Compass className="h-4 w-4" />
                  Take the tour
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push("/connect-logs")}
                className={ui.btnAccent}
              >
                <MessageSquare className="h-4 w-4" />
                Connect logs
              </button>
              <Link href={`/companies/${userId}`} className={ui.btnAccent}>
                <Eye className="h-4 w-4" />
                Public view
              </Link>
              {!noProfileFound && !unapprovedProfile && (
                <Link href="/companies/create-job" className={ui.btnAccent}>
                  <Plus className="h-4 w-4" />
                  Create job
                </Link>
              )}
            </div>
          </div>

          {(noProfileFound || unapprovedProfile) && (
            <div className="mb-4 flex items-center gap-3 border-l-4 border-amber-500 bg-amber-100/60 px-4 py-3 text-[13px] text-stone-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              {noProfileFound
                ? "Please create a profile before posting jobs."
                : "Profile approval is required before creating jobs. You'll be notified once it's approved."}
            </div>
          )}

          <form id="company-profile-form" onSubmit={handleFormReview}>
            {/* 01 Identity */}
            <section className="relative border-b-2 border-t-2 border-b-stone-900/20 border-t-stone-900 pb-9 pt-10">
              <div className="relative flex flex-wrap gap-10">
                <div className="flex w-full flex-col items-center gap-3 text-center md:w-auto md:flex-[0_0_180px] md:items-stretch md:text-left">
                  <SectionTitle index="01" className="self-start">
                    Identity
                  </SectionTitle>
                  <div
                    ref={logoRef}
                    className="relative"
                    data-field="image_url"
                    data-tour="profile-image"
                  >
                    <ProfileImageUpload
                      currentImage={profileData.image_url}
                      displayName={profileData.designation || ""}
                      onImageUpdate={(imageUrl) => {
                        setProfileData({ ...profileData, image_url: imageUrl });
                        if (imageUrl) clearError("image_url");
                      }}
                      size={160}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      logoRef.current
                        ?.querySelector<HTMLElement>(".cursor-pointer")
                        ?.click()
                    }
                    className={`${ui.btnGhost} md:self-start`}
                  >
                    <Camera className="h-4 w-4" />
                    {profileData.image_url ? "Replace logo" : "Upload logo"}
                  </button>
                  <p className={`text-[11px] ${ui.muted}`}>
                    Square PNG or JPG, 300px+. Cropped to the hive hexagon.
                  </p>
                  <FieldError message={errors.image_url} />
                </div>

                <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
                  <div data-tour="company-name">
                    <label
                      htmlFor="designation"
                      className={`mb-1 block text-xs ${ui.muted}`}
                    >
                      Company name *
                    </label>
                    <input
                      id="designation"
                      name="designation"
                      placeholder="Company name"
                      type="text"
                      maxLength={100}
                      defaultValue={profileData.designation}
                      onChange={(e) => {
                        setProfileData({ ...profileData, designation: e.target.value });
                        clearError("designation");
                      }}
                      className="w-full rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-1.5 pt-0.5 text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-stone-900 placeholder:text-stone-300 hover:border-stone-900/20 focus:border-amber-500 focus:outline-none"
                    />
                    <FieldError message={errors.designation} />
                    <div className={`mt-2.5 flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] ${ui.muted}`}>
                      <span>
                        goodhive.io/companies/
                        <b className="font-semibold text-stone-900">{userId}</b>
                      </span>
                      {locationText && <span>{locationText}</span>}
                      {shortWallet && <span>Owner {shortWallet}</span>}
                    </div>
                  </div>

                  <div className="company-about" data-tour="company-description">
                    <div
                      className={`flex items-center justify-between gap-3 border-y ${ui.divider} py-1.5`}
                    >
                      <label htmlFor="headline" className={`text-xs ${ui.muted}`}>
                        About the company *
                      </label>
                      <div id="company-about-toolbar" className="flex gap-0.5">
                        <button type="button" className="ql-bold" title="Bold" />
                        <button type="button" className="ql-italic" title="Italic" />
                        <button type="button" className="ql-underline" title="Underline" />
                        <button type="button" className="ql-list" value="bullet" title="Bulleted list" />
                        <button type="button" className="ql-list" value="ordered" title="Numbered list" />
                        <button type="button" className="ql-link" title="Link" />
                      </div>
                    </div>
                    <ReactQuill
                      id="headline"
                      theme="snow"
                      modules={quillModules}
                      className="company-about-editor"
                      value={profileData.headline || ""}
                      onChange={(content) => {
                        setProfileData({ ...profileData, headline: content });
                        clearError("headline");
                      }}
                      placeholder="Describe your company, mission, values, and what makes you unique..."
                    />
                    <div
                      className={`flex justify-between gap-3 border-t ${ui.divider} pt-1.5 text-[11px] text-stone-500`}
                    >
                      <FieldError message={errors.headline} />
                      <span className="ml-auto tabular-nums">
                        {aboutLength} / 10,000
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 02 Contact + 03 Links */}
            <section
              className={`grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-x-12 border-b-2 ${ui.divider}`}
            >
              <div className="py-7">
                <SectionTitle index="02" className="mb-3.5">
                  Contact
                </SectionTitle>
                <div className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-x-3 text-[13px]">
                  <FieldRow label="Email *" icon={Mail} htmlFor="email">
                    <div data-tour="contact-email">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="team@company.io"
                        maxLength={255}
                        defaultValue={profileData.email}
                        onChange={(e) => {
                          setProfileData({ ...profileData, email: e.target.value });
                          clearError("email");
                        }}
                        className={ui.input}
                      />
                      <FieldError message={errors.email} />
                    </div>
                  </FieldRow>
                  <FieldRow label="Address *" icon={MapPin} htmlFor="address">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Street, suite"
                      maxLength={100}
                      defaultValue={profileData.address}
                      onChange={(e) => {
                        setProfileData({ ...profileData, address: e.target.value });
                        clearError("address");
                      }}
                      className={ui.input}
                    />
                    <FieldError message={errors.address} />
                  </FieldRow>
                  <FieldRow label="City / Country *" icon={Globe} htmlFor="city">
                    <div className="grid grid-cols-2 gap-2" data-tour="location">
                      <div>
                        <input
                          id="city"
                          name="city"
                          type="text"
                          placeholder="City"
                          pattern="[a-zA-Z \-]+"
                          maxLength={100}
                          defaultValue={profileData.city}
                          onChange={(e) => {
                            setProfileData({ ...profileData, city: e.target.value });
                            clearError("city");
                          }}
                          className={ui.input}
                        />
                        <FieldError message={errors.city} />
                      </div>
                      <div>
                        <select
                          name="country"
                          value={selectedCountry?.value || ""}
                          onChange={(e) => {
                            const country =
                              countries.find((c) => c.value === e.target.value) || null;
                            setSelectedCountry(country);
                            setProfileData({ ...profileData, country: country?.value || "" });
                            clearError("country");
                          }}
                          className={ui.input}
                        >
                          <option value="">Country</option>
                          {countries.map((country) => (
                            <option key={country.value} value={country.value}>
                              {country.label}
                            </option>
                          ))}
                        </select>
                        <FieldError message={errors.country} />
                      </div>
                    </div>
                  </FieldRow>
                  <FieldRow label="Phone *" icon={Phone} htmlFor="phone_number">
                    <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-2" data-tour="phone">
                      <div>
                        <select
                          name="phone_country_code"
                          value={selectedPhoneCountryCode?.label || ""}
                          onChange={(e) => {
                            const option =
                              phoneCountryCodeOptions.find((o) => o.label === e.target.value) ||
                              null;
                            setSelectedPhoneCountryCode(option);
                            setProfileData({
                              ...profileData,
                              phone_country_code: option?.value || "",
                            });
                            clearError("phone_country_code");
                          }}
                          className={ui.input}
                        >
                          <option value="">Code</option>
                          {phoneCountryCodeOptions.map((option) => (
                            <option key={option.label} value={option.label}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <FieldError message={errors.phone_country_code} />
                      </div>
                      <div>
                        <input
                          id="phone_number"
                          name="phone_number"
                          type="tel"
                          placeholder="Number"
                          pattern="[0-9]+"
                          maxLength={20}
                          defaultValue={profileData.phone_number}
                          onChange={(e) => {
                            setProfileData({ ...profileData, phone_number: e.target.value });
                            clearError("phone_number");
                          }}
                          className={`${ui.input} tabular-nums`}
                        />
                        <FieldError message={errors.phone_number} />
                      </div>
                    </div>
                  </FieldRow>
                  <FieldRow label="Telegram *" icon={Send} htmlFor="telegram" last>
                    <div data-tour="telegram">
                      <input
                        id="telegram"
                        name="telegram"
                        type="text"
                        placeholder="@handle"
                        maxLength={100}
                        defaultValue={profileData.telegram}
                        onChange={(e) => {
                          setProfileData({ ...profileData, telegram: e.target.value });
                          clearError("telegram");
                        }}
                        className={ui.input}
                      />
                      <FieldError message={errors.telegram} />
                    </div>
                  </FieldRow>
                </div>
              </div>

              <div className="py-7" data-tour="social-links">
                <div className="mb-3.5 flex items-baseline justify-between">
                  <SectionTitle index="03">Links</SectionTitle>
                  <span className={`text-xs tabular-nums ${ui.muted}`}>
                    {linkedCount} of {companyLinks.length} linked · optional
                  </span>
                </div>
                <div className={`border-t ${ui.divider}`}>
                  {companyLinks.map((link) => (
                    <LinkRow
                      key={link.name}
                      name={link.name}
                      label={link.label}
                      icon={link.icon}
                      placeholder={link.placeholder}
                      value={
                        profileData[link.name as keyof typeof profileData]?.toString() || ""
                      }
                      onChange={(value) =>
                        setProfileData((prev) => ({ ...prev, [link.name]: value }))
                      }
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* 04 Referral program */}
            {isShowReferralSection && (
              <div className="mb-10 mt-12">
                <ReferralSection variant="editorial" index="04" />
              </div>
            )}
            {!isShowReferralSection && <div className="h-10" />}

          </form>
        </main>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-20 border-t-2 border-stone-900 bg-[#fffaf0]">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-8">
            <div className="flex min-w-[240px] flex-1 items-center gap-2.5 text-[13px]">
              <span
                className={`h-[11px] w-3 ${status.dot}`}
                style={{ clipPath: hexClip }}
              />
              <b className="font-semibold">{status.title}</b>
              <span className={ui.muted}>{status.detail}</span>
            </div>
            <div className="flex gap-2">
              {profileData.approved ? (
                <button
                  type="button"
                  data-tour="save-draft"
                  onClick={handleFormSaving}
                  className={`${ui.btnPrimary} min-w-[170px] justify-between`}
                >
                  Save changes
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    data-tour="save-draft"
                    onClick={handleFormSaving}
                    className={ui.btnSecondary}
                  >
                    Save draft
                  </button>
                  <button
                    type="submit"
                    form="company-profile-form"
                    data-tour="submit-review"
                    className={`${ui.btnPrimary} min-w-[170px] justify-between`}
                  >
                    Submit for review
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
