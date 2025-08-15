"use client";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/20 via-white to-yellow-50/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section Skeleton */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-6 mx-auto animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg mb-4 max-w-md mx-auto animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded max-w-2xl mx-auto mb-8 animate-pulse"></div>

          {/* Stats Card Skeleton */}
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-lg border border-amber-100 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-6 bg-gray-200 rounded"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Job Cards Skeleton - 2 per row */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-amber-100/50 animate-pulse"
            >
              {/* Company Header */}
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl mr-4"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>

              {/* Job Title */}
              <div className="h-6 bg-gray-200 rounded mb-4"></div>

              {/* Job Type Badge */}
              <div className="h-6 bg-gray-200 rounded-full w-20 mb-4"></div>

              {/* Description */}
              <div className="space-y-3 mb-6">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="h-7 bg-gray-200 rounded-full w-16"></div>
                <div className="h-7 bg-gray-200 rounded-full w-20"></div>
                <div className="h-7 bg-gray-200 rounded-full w-14"></div>
                <div className="h-7 bg-gray-200 rounded-full w-18"></div>
              </div>

              {/* Budget and Location */}
              <div className="flex justify-between items-center mb-6">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>

              {/* Action Button */}
              <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
            </div>
          ))}
        </div>

        {/* Loading Text */}
        <div className="text-center mt-12">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-gray-600 font-medium">
            Searching for the best opportunities...
          </p>
        </div>
      </div>
    </div>
  );
}
