import MyProfilePage from "@/app/components/my-profile-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | Talents | GoodHive",
  description: "The Decentralized Freelancing Plateforme",
};

export default function ProfilePage() {
  return (
    <main className="mx-5">
      <MyProfilePage />
    </main>
  );
}
