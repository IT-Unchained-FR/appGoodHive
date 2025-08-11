import { Metadata } from "next";
import { Faq } from "@components/faq";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | GoodHive",
  description:
    "Find answers to common questions about GoodHive, our Web3 recruitment platform, blockchain jobs, and how to get started in the decentralized economy.",
  keywords:
    "GoodHive FAQ, Web3 platform questions, blockchain recruitment help, crypto job platform, decentralized hiring FAQ",
};

export default function FaqPage() {
  return <Faq />;
}
