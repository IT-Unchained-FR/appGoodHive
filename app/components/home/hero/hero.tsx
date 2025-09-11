"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoodhiveQuestLink } from "@/app/constants/common";

export const Hero = () => {
  const router = useRouter();

  const onFindJobBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push("/talents/job-search");
  };

  const onFindTalentBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push("/companies/search-talents");
  };

  const onJoinQuestsClickHandler = () => {
    window.open(GoodhiveQuestLink, "_blank");
  };

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(5deg); }
          50% { transform: translate(-5px, -10px) rotate(-3deg); }
          75% { transform: translate(-15px, 5px) rotate(2deg); }
        }
        
        @keyframes floatReverse {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-12px, 8px) rotate(-4deg); }
          50% { transform: translate(8px, 15px) rotate(6deg); }
          75% { transform: translate(18px, -5px) rotate(-2deg); }
        }
        
        @keyframes slowFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(0, -20px) rotate(10deg); }
        }
        
        @keyframes honeycombShift {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        
        @keyframes gradientFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes beefly {
          0% { transform: translate(-100px, 0) rotate(0deg); }
          25% { transform: translate(50vw, -30px) rotate(5deg); }
          50% { transform: translate(80vw, 20px) rotate(-3deg); }
          75% { transform: translate(90vw, -10px) rotate(8deg); }
          100% { transform: translate(calc(100vw + 100px), 0) rotate(0deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-reverse { animation: floatReverse 10s ease-in-out infinite; }
        .animate-slow-float { animation: slowFloat 12s ease-in-out infinite; }
        .animate-honeycomb { animation: honeycombShift 30s linear infinite; }
        .animate-gradient { animation: gradientFlow 8s ease-in-out infinite; }
        .animate-bee-fly { animation: beefly 20s linear infinite; }
        .animate-pulse-gentle { animation: pulse 3s ease-in-out infinite; }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .hover-glow {
          transition: all 0.3s ease;
        }
        
        .hover-glow:hover {
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
          transform: translateY(-2px);
        }
        
        .text-glow {
          text-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
        }
      `}</style>
      
      <section className="relative min-h-[800px] w-full overflow-hidden">
        {/* Enhanced Multi-Layer Background */}
        <div 
          className="absolute inset-0 animate-gradient"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 50%),
              linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fed7aa 100%)
            `,
            backgroundSize: '400% 400%'
          }}
        />
        
        {/* Enhanced Honeycomb Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.12] animate-honeycomb"
          style={{
            backgroundImage: `
              linear-gradient(30deg, #d97706 12%, transparent 12.5%, transparent 87%, #d97706 87.5%, #d97706),
              linear-gradient(150deg, #d97706 12%, transparent 12.5%, transparent 87%, #d97706 87.5%, #d97706),
              linear-gradient(30deg, #f59e0b 12%, transparent 12.5%, transparent 87%, #f59e0b 87.5%, #f59e0b),
              linear-gradient(150deg, #f59e0b 12%, transparent 12.5%, transparent 87%, #f59e0b 87.5%, #f59e0b)
            `,
            backgroundSize: '60px 104px, 60px 104px, 80px 138px, 80px 138px',
            backgroundPosition: '0 0, 0 0, 30px 52px, 30px 52px'
          }}
        />
        
        {/* Large Decorative Honeycomb Grid */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(30deg, transparent 35%, #fbbf24 35%, #fbbf24 65%, transparent 65%),
              linear-gradient(150deg, transparent 35%, #fbbf24 35%, #fbbf24 65%, transparent 65%)
            `,
            backgroundSize: '120px 208px',
            backgroundPosition: '0 0, 60px 104px'
          }}
        />

        {/* Animated Floating Hexagons */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Large floating hexagon - top left */}
          <div className="absolute top-20 left-20 animate-float opacity-20" style={{ animationDelay: '0s' }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <polygon 
                points="40,8 68,22 68,50 40,64 12,50 12,22" 
                fill="url(#hexGradient1)" 
                stroke="#d97706" 
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="hexGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Medium hexagon - top right */}
          <div className="absolute top-32 right-32 animate-float-reverse opacity-25" style={{ animationDelay: '2s' }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <polygon 
                points="30,6 51,16.5 51,37.5 30,48 9,37.5 9,16.5" 
                fill="url(#hexGradient2)" 
                stroke="#f59e0b" 
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="hexGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Small hexagon - middle left */}
          <div className="absolute top-1/2 left-10 animate-slow-float opacity-30" style={{ animationDelay: '4s' }}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <polygon 
                points="20,4 34,11 34,25 20,32 6,25 6,11" 
                fill="none" 
                stroke="#fcd34d" 
                strokeWidth="2"
              />
            </svg>
          </div>
          
          {/* Tiny hexagon - bottom right */}
          <div className="absolute bottom-32 right-20 animate-float opacity-35" style={{ animationDelay: '6s' }}>
            <svg width="25" height="25" viewBox="0 0 25 25">
              <polygon 
                points="12.5,2.5 21.25,6.875 21.25,15.625 12.5,20 3.75,15.625 3.75,6.875" 
                fill="#fcd34d" 
                fillOpacity="0.6"
              />
            </svg>
          </div>
          
          {/* Additional floating hexagons */}
          <div className="absolute top-2/3 right-1/4 animate-float-reverse opacity-20" style={{ animationDelay: '8s' }}>
            <svg width="35" height="35" viewBox="0 0 35 35">
              <polygon 
                points="17.5,3 29.75,8.75 29.75,20.25 17.5,26 5.25,20.25 5.25,8.75" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="1.5"
              />
            </svg>
          </div>
          
          <div className="absolute bottom-20 left-1/3 animate-slow-float opacity-25" style={{ animationDelay: '3s' }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <polygon 
                points="25,5 42.5,13.75 42.5,31.25 25,40 7.5,31.25 7.5,13.75" 
                fill="url(#hexGradient3)" 
                stroke="#d97706" 
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="hexGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Animated Bee Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 animate-bee-fly opacity-60" style={{ animationDelay: '0s', animationDuration: '25s' }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <ellipse cx="10" cy="10" rx="6" ry="4" fill="#fbbf24" />
              <ellipse cx="10" cy="10" rx="4" ry="3" fill="#d97706" />
              <circle cx="8" cy="8" r="1" fill="#000" />
              <path d="M4 8 Q2 6 4 4 Q6 6 4 8" fill="#fff" fillOpacity="0.7" />
              <path d="M16 8 Q18 6 16 4 Q14 6 16 8" fill="#fff" fillOpacity="0.7" />
            </svg>
          </div>
          
          <div className="absolute top-2/3 animate-bee-fly opacity-50" style={{ animationDelay: '8s', animationDuration: '30s' }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <ellipse cx="8" cy="8" rx="5" ry="3" fill="#fbbf24" />
              <ellipse cx="8" cy="8" rx="3" ry="2.5" fill="#d97706" />
              <circle cx="6.5" cy="6.5" r="0.8" fill="#000" />
              <path d="M3 6 Q1 4 3 2 Q5 4 3 6" fill="#fff" fillOpacity="0.7" />
              <path d="M13 6 Q15 4 13 2 Q11 4 13 6" fill="#fff" fillOpacity="0.7" />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative container mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[800px]">
          
          {/* Logo with Enhanced Glow */}
          <div className="relative mb-12">
            <div className="h-24 w-96 relative z-10 sm:h-20 sm:w-80 md:h-22 md:w-88 animate-pulse-gentle">
              <Image
                alt="logo"
                src="/img/goodhive-logo.png"
                fill={true}
                className="object-contain drop-shadow-lg"
              />
            </div>
            {/* Logo glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-400/20 blur-xl -z-10 animate-pulse-gentle" />
          </div>

          {/* Enhanced Typography */}
          <div className="text-center mb-12 z-20 relative">
            <div className="inline-flex items-center bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 px-6 py-2 rounded-full text-sm font-semibold mb-10 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300">
              <span className="mr-2 animate-pulse-gentle">✦</span>
              Buzzing with Innovation
              <span className="ml-2">🐝</span>
            </div>
            
            <h1 className="text-6xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight text-glow">
              <span className="text-gray-900">The Collaborative</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-600 animate-gradient" style={{ backgroundSize: '200% 200%' }}>
                Recruitment Hive
              </span>
              <br />
              <span className="text-gray-900">for Web3 Devs</span>
            </h1>
            
            <p className="text-xl text-gray-700 font-normal max-w-2xl mx-auto leading-relaxed">
              More collaborative, more transparent and fairer than ever.
              <br />
              <span className="text-amber-600 font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Join the sweetest recruitment revolution! 🍯
              </span>
            </p>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-6 mb-20 z-20 relative sm:flex-col sm:gap-4 sm:w-full sm:max-w-sm">
            <button
              onClick={onFindJobBtnClick}
              className="group px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl shadow-lg hover-glow transform transition-all duration-300 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                ⭐ Find Sweet Jobs
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </button>

            <button
              onClick={onFindTalentBtnClick}
              className="group px-10 py-4 bg-white/80 backdrop-blur-sm text-gray-900 font-semibold rounded-2xl border border-amber-200 hover:bg-white hover:border-amber-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="flex items-center">
                ⚡ Find Top Talent
              </span>
            </button>
          </div>

          {/* Glassmorphism Rewards Section */}
          <div className="max-w-3xl flex flex-col items-center z-20 relative">
            <div className="glass-effect rounded-3xl p-10 shadow-xl border border-amber-200/30 backdrop-blur-xl">
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg animate-pulse-gentle">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-glow">
                  Exclusive Hive Rewards
                </h3>
              </div>
              
              <p className="text-center text-gray-700 mb-8 text-base leading-relaxed">
                Unlock exclusive referral rewards and gain governance power. Enjoy
                privileged access to
                <span className="font-semibold text-amber-600 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  {" "}Airdrops and Whitelists
                </span>
                , and become an esteemed holder of our{" "}
                <span className="font-semibold text-amber-600 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Scout and Pioneer NFTs
                </span>
                .
              </p>
              
              <button
                onClick={onJoinQuestsClickHandler}
                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-500 transition-all duration-300 mx-auto block shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                ✨ Join the Hive Quest
              </button>
            </div>
          </div>

          {/* Decorative honey drip effect */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
            <svg width="30" height="40" viewBox="0 0 30 40" className="opacity-20 animate-pulse-gentle">
              <path d="M15 0 Q10 10 15 20 Q20 10 15 0" fill="#fbbf24" />
              <circle cx="15" cy="35" r="5" fill="#fbbf24" />
            </svg>
          </div>
        </div>
      </section>
    </>
  );
};
