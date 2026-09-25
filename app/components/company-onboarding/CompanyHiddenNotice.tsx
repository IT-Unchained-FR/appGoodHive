import Link from "next/link";
import { EyeOff } from "lucide-react";

// Shown when an admin has unpublished an approved company: its jobs still
// look live to the company but are hidden from talent everywhere.
export function CompanyHiddenNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
      <div>
        <p className="font-semibold">Your company is hidden from talent</p>
        <p className="mt-0.5 text-rose-800">
          The GoodHive team has unpublished your company profile, so your jobs
          don&apos;t appear in job search and talent can&apos;t apply.{" "}
          <Link href="/contact" className="font-semibold underline underline-offset-2">
            Contact us
          </Link>{" "}
          to make it visible again.
        </p>
      </div>
    </div>
  );
}
