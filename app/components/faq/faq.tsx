"use client";

import React, { useState } from "react";
import { FAQ_TRANSLATION, FAQ_DATA, FAQ_CATEGORIES } from "./faq.constants";
import { ChevronDown, ChevronUp, Sparkles, Search, HelpCircle } from "lucide-react";

export const Faq = () => {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleQuestion = (id: number) => {
    setActiveQuestion(activeQuestion === id ? null : id);
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 overflow-hidden min-h-screen">
      {/* Enhanced Decorative Background Elements */}
      <div className="absolute inset-0">
        {/* Honeycomb Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="grid grid-cols-12 gap-4 transform rotate-12 scale-150 -translate-x-8 -translate-y-8">
            {Array.from({ length: 144 }, (_, i) => (
              <div key={i} className="w-8 h-8 border-2 border-amber-300 transform rotate-45"></div>
            ))}
          </div>
        </div>
        
        {/* Animated Flying Bees */}
        <div className="absolute top-1/4 left-1/4 w-12 h-12 opacity-80">
          <div className="relative animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
            <span className="text-4xl">🐝</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-20">
            <div className="w-full h-full bg-amber-400 rounded-full"></div>
          </div>
        </div>
        
        <div className="absolute top-1/3 right-1/4 w-10 h-10 opacity-70">
          <div className="relative animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4s' }}>
            <span className="text-3xl">🐝</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-15">
            <div className="w-full h-full bg-amber-400 rounded-full"></div>
          </div>
        </div>
        
        <div className="absolute bottom-1/4 left-1/3 w-8 h-8 opacity-60">
          <div className="relative animate-bounce" style={{ animationDelay: '3s', animationDuration: '5s' }}>
            <span className="text-2xl">🐝</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-10">
            <div className="w-full h-full bg-amber-400 rounded-full"></div>
          </div>
        </div>
        
        {/* Moving Bee Trail */}
        <div className="absolute top-1/2 left-0 w-full h-1 overflow-hidden">
          <div className="absolute text-lg" 
               style={{ 
                 animation: 'moveRight 8s linear infinite',
                 animationDelay: '0s'
               }}>
            🐝
          </div>
          <div className="absolute text-sm" 
               style={{ 
                 animation: 'moveRight 10s linear infinite',
                 animationDelay: '2s'
               }}>
            🐝
          </div>
        </div>
        
        {/* Enhanced Hexagon Hives */}
        <div className="absolute top-16 right-16 w-32 h-32 transform rotate-45">
          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-yellow-300 rounded-lg opacity-20 animate-pulse relative overflow-hidden">
            <div className="absolute inset-4 bg-white bg-opacity-30 rounded-md"></div>
            <div className="absolute inset-8 bg-amber-400 bg-opacity-40 rounded-sm"></div>
          </div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 rounded-full animate-bounce opacity-60"></div>
        </div>
        
        <div className="absolute bottom-20 left-16 w-40 h-40 transform -rotate-45">
          <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-300 rounded-lg opacity-15 animate-pulse relative overflow-hidden" style={{ animationDelay: '1s' }}>
            <div className="absolute inset-6 bg-white bg-opacity-30 rounded-md"></div>
            <div className="absolute inset-10 bg-orange-400 bg-opacity-40 rounded-sm"></div>
          </div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-orange-500 rounded-full animate-bounce opacity-50" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Floating Pollen Particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-32 right-32 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-30" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-orange-300 rounded-full animate-ping opacity-25" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute bottom-20 right-20 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-35" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Custom CSS for bee movement */}
      <style jsx>{`
        @keyframes moveRight {
          0% { left: -10px; }
          100% { left: 100%; }
        }
      `}</style>

      <div className="relative container mx-auto px-6 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Knowledge Hive
            </div>
            
            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {FAQ_TRANSLATION.title}
            </h1>
            <h2 className="text-2xl lg:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 mb-6">
              {FAQ_TRANSLATION.subtitle}
            </h2>
            
            {/* Description */}
            <p className="text-xl text-gray-700 mb-12 leading-relaxed max-w-3xl mx-auto">
              {FAQ_TRANSLATION.description}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search your questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-gray-800 placeholder-gray-500 shadow-lg transition-all duration-300"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {FAQ_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg transform scale-105'
                      : 'bg-white bg-opacity-60 text-amber-700 hover:bg-opacity-80 hover:text-amber-800 border-2 border-amber-200 hover:border-amber-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <HelpCircle className="w-12 h-12 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No questions found</h3>
                <p className="text-gray-600">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white bg-opacity-70 backdrop-blur-sm rounded-2xl border-2 border-amber-100 hover:border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleQuestion(faq.id)}
                      className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-amber-50 hover:bg-opacity-50 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full mr-3">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </h3>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {activeQuestion === faq.id ? (
                          <ChevronUp className="w-6 h-6 text-amber-500" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-amber-500" />
                        )}
                      </div>
                    </button>
                    
                    {activeQuestion === faq.id && (
                      <div className="px-8 pb-6 pt-2 border-t border-amber-100">
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 relative">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                          {/* Small decorative bee */}
                          <div className="absolute top-4 right-4 opacity-30">
                            <span className="text-lg">🐝</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="text-center mt-20">
            <div className="bg-gradient-to-br from-amber-300 to-yellow-400 rounded-3xl p-8 shadow-2xl transform hover:rotate-1 transition-transform duration-500 max-w-2xl mx-auto relative">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 relative">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Still have questions?
                </h3>
                <p className="text-gray-800 mb-6 leading-relaxed">
                  Can't find what you're looking for? Our support team is always here to help you out!
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center px-8 py-4 bg-white text-amber-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Contact Support
                </a>
                
                {/* Floating bee */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white bg-opacity-30 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-3xl">🐝</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg className="w-full h-16 fill-current text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
};