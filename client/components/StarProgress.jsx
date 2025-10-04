import { useState, useEffect } from "react";

// Milestone definitions
const MILESTONES = [
  { stars: 5, label: "מתחילה!", emoji: "🌟", color: "yellow" },
  { stars: 10, label: "כוכבת!", emoji: "⭐", color: "orange" },
  { stars: 20, label: "מדהימה!", emoji: "✨", color: "purple" },
  { stars: 50, label: "אלופה!", emoji: "🏆", color: "gold" },
];

export default function StarProgress({ isSessionActive, sessionCompleted, onSessionComplete }) {
  const [totalStars, setTotalStars] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState(null);

  // Load stars from localStorage on mount
  useEffect(() => {
    const savedStars = localStorage.getItem("englishPracticeStars");
    if (savedStars) {
      setTotalStars(parseInt(savedStars, 10));
    }
  }, []);

  // Save stars to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("englishPracticeStars", totalStars.toString());
  }, [totalStars]);

  // Award star when session completes
  useEffect(() => {
    if (sessionCompleted) {
      const newTotal = totalStars + 1;
      setTotalStars(newTotal);

      // Check if we hit a milestone
      const milestone = MILESTONES.find(m => m.stars === newTotal);
      if (milestone) {
        setCelebrationMilestone(milestone);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }

      // Reset the completion flag
      if (onSessionComplete) {
        onSessionComplete();
      }
    }
  }, [sessionCompleted, totalStars, onSessionComplete]);

  const nextMilestone = MILESTONES.find(m => m.stars > totalStars) || MILESTONES[MILESTONES.length - 1];
  const progress = (totalStars / nextMilestone.stars) * 100;

  return (
    <>
      {/* Celebration overlay */}
      {showCelebration && celebrationMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-scaleIn">
            <div className="text-8xl mb-4 animate-bounce">{celebrationMilestone.emoji}</div>
            <h2 className="text-3xl font-bold text-purple-700 mb-2">
              {celebrationMilestone.label}
            </h2>
            <p className="text-xl text-gray-600">
              הגעת ל-{celebrationMilestone.stars} כוכבים! 🎉
            </p>
          </div>
        </div>
      )}

      {/* Star progress display */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⭐</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">הכוכבים שלי</p>
              <p className="text-2xl font-bold text-yellow-600">{totalStars}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">יעד הבא</p>
            <p className="text-sm font-semibold text-gray-700">
              {nextMilestone.emoji} {nextMilestone.stars}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Milestone markers */}
        <div className="flex justify-between mt-2">
          {MILESTONES.map((milestone) => (
            <div
              key={milestone.stars}
              className={`text-center ${totalStars >= milestone.stars ? "opacity-100" : "opacity-40"}`}
            >
              <div className="text-xl">{milestone.emoji}</div>
              <div className="text-xs text-gray-600">{milestone.stars}</div>
            </div>
          ))}
        </div>

        {/* Motivational message */}
        {isSessionActive && (
          <p className="text-xs text-center text-gray-500 mt-3">
            תקבלי כוכב בסוף האימון! ✨
          </p>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
