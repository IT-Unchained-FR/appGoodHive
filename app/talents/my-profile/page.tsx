import MyProfile from "@/app/components/profile-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | Talents Pages | GoodHive",
  description: "The Decentralized Freelancing Plateforme",
};

export default function ProfilePage() {
  return (
    <main className="mx-5">
      <MyProfile />
    </main>
  );
}
