import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Github,
  Twitter,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  // User,
} from "lucide-react";

import Image from "next/image";
import { getProfileData } from "@/lib/fetch-profile-data";

type MyProfilePageProps = {
  params: {
    address: string;
  };
};

export const revalidate = 0;

export default async function MyProfilePage(context: MyProfilePageProps) {
  const { address } = context.params;

  const user = await getProfileData(address);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <div className="my-8 bg-white shadow-lg rounded-lg overflow-hidden max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-600">
            {user.image_url ? (
              <Image
                src={user.image_url}
                alt={`${user.first_name} ${user.last_name}`}
                className="w-full h-full object-cover rounded-full"
                height={96}
                width={96}
              />
            ) : (
              `${user.first_name[0]}${user.last_name[0]}`
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{`${user.first_name} ${user.last_name}`}</h1>
            <p className="text-lg">{user.title}</p>
            {/* <p className="text-sm">{user.description}</p> */}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{user.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin size={18} />
            <span>{`${user.city}, ${user.country}`}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Phone size={18} />
            <span>{`${user.phone_country_code}${user.phone_number}`}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail size={18} />
            <span>{user.email}</span>
          </div>
          {user.telegram && (
            <div className="flex items-center space-x-2 text-gray-600">
              <span className="font-bold">Telegram:</span>
              <span>@{user.telegram}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">About Work</h2>
          <p className="text-gray-700">{user.about_work}</p>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.split(",").map((skill: string, index: number) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Briefcase size={18} />
            <span>
              {user.freelance_only
                ? "Freelance Only"
                : "Open to All Opportunities"}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Globe size={18} />
            <span>{user.remote_only ? "Remote Only" : "Open to On-site"}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <DollarSign size={18} />
            <span>${user.rate}/hr</span>
          </div>
          {/* <div className="flex items-center space-x-2 text-gray-600">
            <User size={18} />
            <span>ID: {user.id}</span>
          </div> */}
        </div>

        <div className="border-t pt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar size={18} />
            <span>Last active: {formatDate(user.last_active)}</span>
          </div>
          <div className="flex items-center space-x-2">
            {user.availability ? (
              <span className="flex items-center text-green-600">
                <CheckCircle size={18} className="mr-1" /> Available
              </span>
            ) : (
              <span className="flex items-center text-red-600">
                <XCircle size={18} className="mr-1" /> Unavailable
              </span>
            )}
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="font-bold">Talent Status:</span>
            <span className="capitalize">{user.talent_status}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="font-bold">Mentor Status:</span>
            <span>{user.mentor_status || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="font-bold">Recruiter Status:</span>
            <span>{user.recruiter_status || "N/A"}</span>
          </div>
        </div>

        {/* <div className="border-t pt-4 grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="font-bold">Talent:</span>
            <span>{user.talent ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="font-bold">Mentor:</span>
            <span>{user.mentor ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="font-bold">Recruiter:</span>
            <span>{user.recruiter ? "Yes" : "No"}</span>
          </div>
        </div> */}

        {user.wallet_address && (
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold mb-2">Wallet Address</h2>
            <p className="text-gray-700 break-all">{user.wallet_address}</p>
          </div>
        )}

        <div className="border-t pt-4 flex flex-wrap gap-4">
          {user.cv_url && (
            <a
              href={user.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-600 hover:underline"
            >
              <FileText size={18} />
              <span>View CV</span>
            </a>
          )}
          {user.linkedin && (
            <a
              href={user.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600"
            >
              <Linkedin size={24} />
            </a>
          )}
          {user.github && (
            <a
              href={user.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <Github size={24} />
            </a>
          )}
          {user.twitter && (
            <a
              href={user.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-400"
            >
              <Twitter size={24} />
            </a>
          )}
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-green-600"
            >
              <Globe size={24} />
            </a>
          )}
        </div>

        {user.referrer && (
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold mb-2">Referrer</h2>
            <p className="text-gray-700">{user.referrer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
