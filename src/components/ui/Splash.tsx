import { useEffect, useState } from 'react';
import logo from '../../assets/logo.png';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [fadeExit, setFadeExit] = useState(false);

  useEffect(() => {
    // Hold for exactly 2.5 seconds (2500ms) for background tasks/fetches, then start exit animation
    const exitTimer = setTimeout(() => {
      setFadeExit(true);
    }, 2500);

    // End completely at 2.9 seconds (2900ms)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden select-none transition-all duration-700 ease-in-out ${
        fadeExit ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        clipPath: fadeExit ? 'circle(0% at 50% 50%)' : 'circle(150% at 50% 50%)',
        transition: 'clip-path 800ms cubic-bezier(0.76, 0, 0.24, 1), opacity 700ms ease-in-out, transform 750ms ease-in-out'
      }}
    >
      {/* High-fidelity CSS animations for a beautiful admin radial initial load experience */}
      <style>{`
        @keyframes radialPulse {
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
          15% { opacity: 0.4; }
          85% { opacity: 0.2; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes glowRadial {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.35; filter: blur(35px); }
          50% { transform: translate(-50%, -50%) scale(1.25); opacity: 0.55; filter: blur(55px); }
        }
        @keyframes rotateDotted {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes logoScale {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes trackingReveal {
          0% { opacity: 0; letter-spacing: -0.1em; transform: translateY(10px); }
          100% { opacity: 1; letter-spacing: 0.45em; transform: translateY(0); }
        }
        @keyframes subtitleReveal {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 0.8; transform: translateY(0); }
        }
        .radial-glow {
          position: absolute;
          left: 50%;
          top: 40%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0) 70%);
          border-radius: 50%;
          z-index: 1;
          animation: glowRadial 4s infinite ease-in-out;
        }
        .pulse-wave-1 {
          position: absolute;
          left: 50%;
          top: 40%;
          width: 350px;
          height: 350px;
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: 50%;
          z-index: 2;
          transform: translate(-50%, -50%) scale(0.4);
          animation: radialPulse 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .pulse-wave-2 {
          position: absolute;
          left: 50%;
          top: 40%;
          width: 350px;
          height: 350px;
          border: 1px solid rgba(6, 182, 212, 0.15);
          border-radius: 50%;
          z-index: 2;
          transform: translate(-50%, -50%) scale(0.4);
          animation: radialPulse 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          animation-delay: 1s;
        }
        .pulse-wave-3 {
          position: absolute;
          left: 50%;
          top: 40%;
          width: 350px;
          height: 350px;
          border: 1px solid rgba(13, 148, 136, 0.1);
          border-radius: 50%;
          z-index: 2;
          transform: translate(-50%, -50%) scale(0.4);
          animation: radialPulse 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          animation-delay: 2s;
        }
        .dotted-ring {
          position: absolute;
          left: -8px;
          top: -8px;
          right: -8px;
          bottom: -8px;
          border: 1.5px dotted rgba(6, 182, 212, 0.35);
          border-radius: 50%;
          animation: rotateDotted 20s linear infinite;
        }
        .logo-box {
          animation: logoScale 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 5;
        }
        .title-text {
          animation: trackingReveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.25s;
        }
        .subtitle-text {
          animation: subtitleReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.6s;
        }
      `}</style>

      {/* Radial Animating Waves & Glow Background */}
      <div className="radial-glow" />
      <div className="pulse-wave-1" />
      <div className="pulse-wave-2" />
      <div className="pulse-wave-3" />

      {/* Branding Container */}
      <div className="relative flex flex-col items-center space-y-8 z-10">
        
        {/* Glowing Speeds Shield Logo Container */}
        <div className="logo-box relative w-26 h-26 rounded-[2rem] p-4.5 bg-gradient-to-b from-white/10 to-white/0 border border-white/15 backdrop-blur-xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="dotted-ring" style={{ borderRadius: '2rem' }} />
          <img src={logo} alt="PeaceCars Logo" className="w-full h-full object-contain relative z-10" />
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-[#06B6D4]/25 via-transparent to-transparent blur-xl -z-10" />
        </div>

        {/* Corporate Title & Portal Details */}
        <div className="text-center space-y-2.5">
          <h1 className="title-text opacity-0 text-xl font-black text-white uppercase tracking-[0.35em]">
            PEACE CARS
          </h1>
          <p className="subtitle-text opacity-0 text-[9px] font-bold text-[#06B6D4] tracking-[0.25em] uppercase">
            ADMIN PORTAL v2.0
          </p>
        </div>

        {/* Elegant Spinning indicator */}
        <div className="pt-4 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/5 border-t-[#06B6D4] rounded-full animate-spin duration-1000" />
        </div>
      </div>
    </div>
  );
}
