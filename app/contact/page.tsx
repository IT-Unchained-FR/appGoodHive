import ContactForm from "@components/contact-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch | GoodHive",
  description:
    "Contact the GoodHive team for support, partnerships, or questions about our Web3 recruitment platform. We're here to help you succeed in the decentralized economy.",
  keywords:
    "contact GoodHive, Web3 platform support, blockchain recruitment contact, crypto job platform help, decentralized hiring support",
};

export default function ContactFormPage() {
  return (
    <div className="pt-10 pl-10 mb-20">
      <h1 className="text-2xl font-bold mb-5">Message Us:</h1>
      <ContactForm />
    </div>
  );
}
