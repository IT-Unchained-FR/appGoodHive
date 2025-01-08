"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  Github,
  Linkedin,
  Twitter,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CompanyAdminViewProps {
  headline: string;
  designation: string;
  address: string;
  country: string;
  city: string;
  phone_country_code: string;
  phone_number: string;
  email: string;
  telegram: string;
  image_url: string;
  linkedin: string;
  github: string;
  stackoverflow: string;
  twitter: string;
  portfolio: string;
  status: "active" | "inactive";
  wallet_address: string;
  approved: boolean;
  inreview: boolean;
}

export default function CompanyAdminView({
  headline,
  designation,
  address,
  city,
  country,
  phone_country_code,
  phone_number,
  email,
  telegram,
  image_url,
  linkedin,
  github,
  stackoverflow,
  twitter,
  portfolio,
  status,
  wallet_address,
  approved,
}: CompanyAdminViewProps) {
  const defaultImage = "/placeholder.svg";

  return (
    <Card className="w-full bg-white">
      <div className="h-[200px] w-full bg-zinc-900 relative">
        <div className="absolute left-8 -bottom-[64px]">
          <div className="relative h-32 w-32 rounded-lg overflow-hidden border-4 border-white bg-white">
            {/* Modified Image component with error handling */}
            <Image
              src={image_url || defaultImage}
              alt={headline || "Company Logo"}
              fill
              className="object-cover"
              onError={(e: any) => {
                e.target.src = defaultImage;
              }}
            />
          </div>
        </div>
      </div>

      <CardContent className="pt-20 pb-6 px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{designation}</h1>
            <div className="flex gap-2">
              {approved ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                >
                  ✓ Approved
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                >
                  Pending Approval
                </Badge>
              )}
            </div>
          </div>

          <p className="text-gray-600">{headline}</p>

          {/* Show other details only if they exist */}
          <div className="space-y-4 text-sm">
            {address && city && country && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {address}, {city}, {country}
                </span>
              </div>
            )}
            {phone_country_code && phone_number && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>
                  {phone_country_code} {phone_number}
                </span>
              </div>
            )}

            {email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <Link href={`mailto:${email}`} className="hover:underline">
                  {email}
                </Link>
              </div>
            )}

            {telegram && (
              <div className="flex items-center gap-2 text-gray-600">
                Telegram: @{telegram}
              </div>
            )}
          </div>

          <Separator />

          {/* Company Details Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Company Details</h2>
            <div className="space-y-3">
              {designation && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">Business Name:</span>
                  <span>{designation}</span>
                </div>
              )}
              {wallet_address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Wallet Address:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {wallet_address}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Only show Social Links section if at least one social link exists */}
          {(linkedin || github || twitter || stackoverflow || portfolio) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Social Links</h2>
                <div className="flex flex-wrap gap-2">
                  {linkedin && (
                    <Button variant="outline" size="sm" className="h-9" asChild>
                      <a href={linkedin}>
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {github && (
                    <Button variant="outline" size="sm" className="h-9" asChild>
                      <a href={github}>
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {twitter && (
                    <Button variant="outline" size="sm" className="h-9" asChild>
                      <a href={twitter}>
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {stackoverflow && (
                    <Button variant="outline" size="sm" className="h-9" asChild>
                      <a href={stackoverflow}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Stack Overflow
                      </a>
                    </Button>
                  )}
                  {portfolio && (
                    <Button variant="outline" size="sm" className="h-9" asChild>
                      <a href={portfolio}>
                        <Globe className="h-4 w-4 mr-2" />
                        Portfolio
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
