import { useState } from "react";

// Topic data with Hebrew labels and English prompts for AI
const topics = [
  { id: "family", label: "משפחה וחיות מחמד", emoji: "👨‍👩‍👧‍👦", color: "purple", prompt: "Let's talk about your family! Tell me about your sisters Tamar and Ayala, and your dogs Lotus and Albi!" },
  { id: "school", label: "בית ספר וחברים", emoji: "🏫", color: "blue", prompt: "Tell me about school! What did you do today? Who are your friends?" },
  { id: "hobbies", label: "תחביבים ומשחקים", emoji: "🎮", color: "green", prompt: "What do you like to do for fun? Tell me about your favorite games or hobbies!" },
  { id: "books", label: "ספרים וסיפורים", emoji: "📚", color: "yellow", prompt: "Do you have a favorite book or story? Tell me about it!" },
  { id: "imagination", label: "דמיון וקסם", emoji: "🦄", color: "pink", prompt: "Let's use our imagination! What story should we create together?" },
  { id: "food", label: "אוכל וממתקים", emoji: "🍕", color: "orange", prompt: "What's your favorite food? What did you eat today?" },
  { id: "animals", label: "חיות", emoji: "🐶", color: "teal", prompt: "Tell me about animals you like! What's your favorite animal?" },
  { id: "activities", label: "דברים שעשיתי", emoji: "⚽", color: "red", prompt: "What fun things did you do recently? Tell me all about it!" },
];

const colorStyles = {
  purple: "bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700",
  blue: "bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700",
  green: "bg-green-100 hover:bg-green-200 border-green-300 text-green-700",
  yellow: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-700",
  pink: "bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-700",
  orange: "bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700",
  teal: "bg-teal-100 hover:bg-teal-200 border-teal-300 text-teal-700",
  red: "bg-red-100 hover:bg-red-200 border-red-300 text-red-700",
};

export default function TopicCards({ onTopicSelect, isSessionActive }) {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleTopicClick = (topic) => {
    if (!isSessionActive) return;

    setSelectedTopic(topic.id);
    onTopicSelect(topic);

    // Clear selection after animation
    setTimeout(() => setSelectedTopic(null), 1000);
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-3">
        {isSessionActive ? "בחרי נושא לדבר עליו:" : "נושאים שאפשר לדבר עליהם:"}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleTopicClick(topic)}
            disabled={!isSessionActive}
            className={`
              ${colorStyles[topic.color]}
              ${selectedTopic === topic.id ? "scale-95 ring-2 ring-offset-1" : ""}
              ${!isSessionActive ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-95"}
              border-2 rounded-lg p-2.5
              transition-all duration-200
              flex flex-col items-center gap-1
              text-center
            `}
          >
            <span className="text-2xl">{topic.emoji}</span>
            <span className="text-xs font-semibold leading-tight">
              {topic.label}
            </span>
          </button>
        ))}
      </div>
      {isSessionActive && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          לחצי על כרטיס כדי להתחיל לדבר על הנושא! 🎯
        </p>
      )}
    </div>
  );
}
