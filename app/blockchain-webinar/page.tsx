import Link from "next/link";
import { CalendarDays, Video, ExternalLink } from "lucide-react";

export default function BlockchainWebinarPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl border border-amber-200 shadow-xl p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-700 px-4 py-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4" />
            Blockchain Webinar
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-gray-900">
            Build Your Web3 Talent Pipeline
          </h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Join our upcoming webinar to learn how to source, evaluate, and hire top Web3 talent.
            We will cover hiring playbooks, interview frameworks, and marketplace best practices.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <p className="text-sm font-semibold text-amber-700">Format</p>
              <p className="mt-1 text-gray-700">Live session + Q&A</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <p className="text-sm font-semibold text-amber-700">Audience</p>
              <p className="mt-1 text-gray-700">Founders, hiring managers, recruiters</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-white font-semibold shadow-md hover:shadow-lg"
            >
              <Video className="mr-2 h-4 w-4" />
              Request an Invite
            </Link>
            <a
              href="https://linktr.ee/goodhive"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-amber-300 px-5 py-3 text-amber-700 font-semibold hover:bg-amber-50"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Follow Updates
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
