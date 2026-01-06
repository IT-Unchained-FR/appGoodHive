import { Compass, Rocket, Users } from "lucide-react";

export const ABOUT_CONTENT = {
  hero: {
    title: "About GoodHive for builders who lead with trust.",
    subtitle: "Explore the Platform",
    description:
      "GoodHive is revolutionizing how companies and talent connect in the Web3 space. We're creating a decentralized, transparent, and efficient recruitment platform that empowers both employers and job seekers.",
  },
  philosophy: {
    title: "Our Philosophy",
    description:
      "Recruitment works better when it is driven by trust, not volume. We believe communities outperform platforms when incentives are aligned.",
  },
  mission: {
    title: "Our Mission",
    description:
      "To help Web3 companies hire faster and better through peer recommended talent. No cold sourcing. No noise. Just trusted human connections.",
  },
};

export const TEAM_MEMBERS = [
  {
    id: 1,
    name: "Benoit Kulesza",
    role: "Founder & CEO",
    description: "Builds collaborative systems for the future of work",
    backgroundColor: "#d4e5e0",
    image: "/img/team/benoit-kulesza.png",
    linkedin: "https://www.linkedin.com/in/benoitkulesza/",
    twitter: "https://twitter.com/Benoitk14",
  },
  {
    id: 2,
    name: "Hayat Outahar",
    role: "Co-Founder & Community",
    description: "Explores micronations and community driven Web3 governance",
    backgroundColor: "#e5d8d0",
    image: "/img/team/hayat-outahar.png",
    linkedin: "https://www.linkedin.com/in/hayatoutahar/",
    twitter: "https://twitter.com/HayatOutahar",
  },
  {
    id: 3,
    name: "Nicolas Wagner",
    role: "Co-founder & CTO",
    description: "Builds decentralized governance for the future of work",
    backgroundColor: "#e8d8e5",
    image: "/img/team/nicolas-wagner.png",
    linkedin: "https://www.linkedin.com/in/wagner-nicolas-dev/",
    twitter: "https://twitter.com/w_n1c01a5",
  },
  {
    id: 4,
    name: "Jubayer Juhan",
    role: "Founding Builder & Senior Product Engineer",
    description: "Builds scalable Web3 products and user experiences",
    backgroundColor: "#f5ecd0",
    image: "/img/team/juhan-jubayer.png",
    linkedin: "https://www.linkedin.com/in/jubayerjuhan/",
    twitter: "https://twitter.com/XUHANJJ",
  },
  {
    id: 5,
    name: "Sabbir Rifat",
    role: "Founding Builder & Principal Frontend Engineer",
    description: "Designs scalable frontends for collaborative Web3 products",
    backgroundColor: "#d0e0f0",
    image: "/img/team/sabbir-rifat.png",
    linkedin: "https://www.linkedin.com/in/sabbir-rifat/",
  },
  {
    id: 6,
    name: "Chaharane Abdallah",
    role: "Founding Builder & Marketing Manager",
    description: "Drives Web3 growth through community and marketing",
    backgroundColor: "#dfe5d4",
    image: "/img/team/chaharane-abdallah.png",
    linkedin: "https://www.linkedin.com/in/chaharane-abdallah-50617424b/",
  },
];

export const VIDEO_CONFIG = {
  embedUrl: "https://www.youtube.com/embed/4ctDaQpfEEg?si=2HG1IOlBXr7bo6OE",
  title: "GoodHive: Revolutionizing Recruitment for Clients and Web3 Talent!",
};

export const IMPACT_METRICS = [
  {
    id: "companies",
    value: "50+",
    label: "Partner Companies",
    description: "discovering talent through GoodHive",
  },
  {
    id: "talents",
    value: "1.5k",
    label: "Web3 Talents",
    description: "within the extended community",
  },
];

export const VALUE_PILLARS = [
  {
    id: "philosophy",
    icon: Compass,
    title: ABOUT_CONTENT.philosophy.title,
    description: ABOUT_CONTENT.philosophy.description,
  },
  {
    id: "mission",
    icon: Rocket,
    title: ABOUT_CONTENT.mission.title,
    description: ABOUT_CONTENT.mission.description,
  },
  {
    id: "community",
    icon: Users,
    title: "Community First",
    description:
      "Our community is the product. Talents co build the network and share the value they create.",
  },
];

export const JOURNEY_MOMENTS = [
  {
    id: "foundations",
    year: "2019",
    label: "FOUNDATIONS - 2019",
    title: "Designed with talents, from day one",
    description:
      "Inspired by the collaborative economy, the project started with IT Unchained and real tech hires. Through hundreds of talent interviews, we tested how community driven recruitment could actually work.",
  },
  {
    id: "community-emerges",
    year: "2022",
    label: "Community Emerges - 2022",
    title: "A Web3 talent community takes shape",
    description:
      "Web3TalentFair launched as Europe's first Web3 job fair focused on talents and the future of work. It connected thousands builders and companies and laid the foundations of the GoodHive network.",
  },
  {
    id: "product-ready",
    year: "2025",
    label: "Product Ready - 2025",
    title: "GoodHive is ready for real hiring",
    description:
      "After extensive testing with talents and companies, GoodHive enters production. A platform built to onboard Web3 talents, support hiring teams, and scale collaborative recruitment.",
  },
];

export const TEAM_SECTION_CONTENT = {
  eyebrow: "The Team",
  title: "Built by Web3 natives and multidisciplinary builders",
  description:
    "An ecosystem of builders, educators, developers, and contributors exploring decentralized governance, collaborative systems, and the future of work.",
};
