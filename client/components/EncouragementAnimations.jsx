import { useEffect, useState } from "react";

// Confetti component
export function Confetti({ show, onComplete }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 0.5,
        color: ["#FFD700", "#FF69B4", "#87CEEB", "#98FB98", "#DDA0DD"][Math.floor(Math.random() * 5)],
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);

      // Clear after animation
      const timer = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${particle.left}%`,
            top: '-10%',
            backgroundColor: particle.color,
            animationDelay: `${particle.animationDelay}s`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall 2s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

// Sparkles component
export function Sparkles({ show, onComplete }) {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (show) {
      // Generate sparkles around center
      const newSparkles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: 40 + Math.random() * 20,
        top: 30 + Math.random() * 40,
        size: 10 + Math.random() * 20,
        animationDelay: Math.random() * 0.3,
      }));
      setSparkles(newSparkles);

      const timer = setTimeout(() => {
        setSparkles([]);
        if (onComplete) onComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || sparkles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animationDelay: `${sparkle.animationDelay}s`,
          }}
        >
          ✨
        </div>
      ))}
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }
        .animate-sparkle {
          animation: sparkle 1s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

// Star burst effect
export function StarBurst({ show, onComplete }) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <div className="animate-star-burst text-9xl">⭐</div>
      <style>{`
        @keyframes star-burst {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0.5) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-star-burst {
          animation: star-burst 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Praise banner
export function PraiseBanner({ message, show, onComplete }) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || !message) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-8 py-4 rounded-full shadow-2xl animate-bounce-in">
        <p className="text-2xl font-bold">{message}</p>
      </div>
      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0) translateY(-20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) translateY(0);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
      `}</style>
    </div>
  );
}
