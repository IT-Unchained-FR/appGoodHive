"use client";

import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-yellow-50/20 to-orange-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>

          {/* Search Results Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-amber-200/30 animate-pulse">
                {/* Company Logo */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>

                {/* Job Title */}
                <div className="h-5 bg-gray-200 rounded mb-3"></div>

                {/* Description */}
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded-full px-3 py-1 w-16"></div>
                  <div className="h-6 bg-gray-200 rounded-full px-3 py-1 w-20"></div>
                  <div className="h-6 bg-gray-200 rounded-full px-3 py-1 w-14"></div>
                </div>

                {/* Budget and Location */}
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Spinner */}
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <HoneybeeSpinner />
              <p className="text-gray-600 mt-4">Searching for the best opportunities...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
