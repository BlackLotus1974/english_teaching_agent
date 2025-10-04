import { useState } from "react";

const MODES = [
  {
    id: "happy",
    label: "שמח",
    emoji: "🎉",
    color: "yellow",
    description: "Extra cheerful and energetic",
  },
  {
    id: "story",
    label: "סיפורים",
    emoji: "📖",
    color: "purple",
    description: "Interactive storytelling",
  },
  {
    id: "question",
    label: "שאלות",
    emoji: "🤔",
    color: "blue",
    description: "Lots of questions to practice",
  },
];

export default function ModeSelector({ onModeSelect, isSessionActive, currentMode }) {
  const [selectedMode, setSelectedMode] = useState(currentMode || "happy");

  const handleModeClick = (mode) => {
    if (isSessionActive) return; // Can't change mode during active session
    setSelectedMode(mode.id);
    onModeSelect(mode.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold mb-3 text-gray-800">
        {isSessionActive ? "מצב נוכחי" : "בחרי מצב שיחה"}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const colorClasses = {
            yellow: isSelected
              ? "bg-yellow-400 border-yellow-600"
              : "bg-yellow-100 hover:bg-yellow-200 border-yellow-300",
            purple: isSelected
              ? "bg-purple-400 border-purple-600"
              : "bg-purple-100 hover:bg-purple-200 border-purple-300",
            blue: isSelected
              ? "bg-blue-400 border-blue-600"
              : "bg-blue-100 hover:bg-blue-200 border-blue-300",
          };

          return (
            <button
              key={mode.id}
              onClick={() => handleModeClick(mode)}
              disabled={isSessionActive}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200
                ${colorClasses[mode.color]}
                ${isSelected ? "scale-105 shadow-lg" : ""}
                ${isSessionActive ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                flex flex-col items-center gap-1
              `}
            >
              <div className="text-3xl">{mode.emoji}</div>
              <div className={`font-bold text-sm ${isSelected ? "text-white" : "text-gray-800"}`}>
                {mode.label}
              </div>
              {isSelected && (
                <div className="text-xs text-white opacity-90">✓</div>
              )}
            </button>
          );
        })}
      </div>
      {!isSessionActive && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          בחרי מצב לפני תחילת השיחה
        </p>
      )}
    </div>
  );
}
