import { useEffect, useState } from 'react';
import logo from '../../assets/logo.png';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [fadeExit, setFadeExit] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setFadeExit(true);
    }, 2500);

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
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-blue-600 ${
        fadeExit
          ? 'opacity-0 scale-[1.04] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        transition:
          'opacity 800ms cubic-bezier(.16,1,.3,1), transform 800ms cubic-bezier(.16,1,.3,1)',
      }}
    >
      <style>{`
        @keyframes logoIntro {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(.9);
            filter: blur(16px);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes textIntro {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes breathe {
          0%,100% {
            transform: scale(1);
            opacity: .25;
          }

          50% {
            transform: scale(1.08);
            opacity: .5;
          }
        }

        @keyframes floatCard {
          0%,100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-6px);
          }
        }

        .ambient-glow {
          position: absolute;
          width: 550px;
          height: 550px;
          border-radius: 9999px;
          background:
            radial-gradient(
              circle,
              rgba(255,255,255,.14) 0%,
              rgba(255,255,255,.05) 35%,
              transparent 75%
            );
          animation: breathe 6s ease-in-out infinite;
        }

        .logo-wrapper {
          animation:
            logoIntro 1.2s cubic-bezier(.16,1,.3,1) forwards,
            floatCard 6s ease-in-out infinite;
        }

        .title {
          opacity: 0;
          animation: textIntro .9s cubic-bezier(.16,1,.3,1) forwards;
          animation-delay: .35s;
        }

        .subtitle {
          opacity: 0;
          animation: textIntro .9s cubic-bezier(.16,1,.3,1) forwards;
          animation-delay: .55s;
        }

        .tagline {
          opacity: 0;
          animation: textIntro .9s cubic-bezier(.16,1,.3,1) forwards;
          animation-delay: .75s;
        }
      `}</style>

      {/* Ambient Glow */}
      <div className="ambient-glow" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Card */}
        <div className="logo-wrapper">
          <div
            className="
              relative
              w-48
              h-48
              rounded-full
              bg-white/[0.03]
              backdrop-blur-3xl
              border
              border-white/10
              shadow-[0_25px_100px_rgba(255,255,255,0.08)]
              flex
              items-center
              justify-center
              overflow-hidden
            "
          >
            {/* Top Glass Highlight */}
            <div
              className="
                absolute
                inset-0
                rounded-full
                bg-gradient-to-b
                from-white/12
                via-transparent
                to-transparent
              "
            />

            <img
              src={logo}
              alt="PCS Logo"
              draggable={false}
              className="
                w-40
                h-40
                rounded-full
                object-cover
                relative
                z-10
                select-none
                pointer-events-none
              "
            />
          </div>
        </div>

        {/* Branding */}
        <div className="mt-10 text-center">
          <h1
            className="
              title
              text-white
              text-5xl
              font-semibold
              tracking-[-0.05em]
            "
          >
            PCS
          </h1>

          <p
            className="
              subtitle
              mt-3
              text-white/65
              text-base
              font-medium
            "
          >
            Peace Car Sales
          </p>

          <p
            className="
              tagline
              mt-2
              text-white/35
              text-xs
              tracking-[0.35em]
              uppercase
            "
          >
            Admin Portal
          </p>
        </div>
      </div>
    </div>
  );
}
