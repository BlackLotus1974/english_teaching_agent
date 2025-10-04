import { useEffect, useState } from "react";
import {
  happyModeInstructions,
  storyModeInstructions,
  questionModeInstructions,
} from "../../shared/tutorInstructions.js";
import TopicCards from "./TopicCards";
import ModeSelector from "./ModeSelector";

// Map mode IDs to instruction sets
const MODE_INSTRUCTIONS = {
  happy: happyModeInstructions,
  story: storyModeInstructions,
  question: questionModeInstructions,
};

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [audioConfigured, setAudioConfigured] = useState(false);
  const [selectedMode, setSelectedMode] = useState("happy");
  const [isAIResponding, setIsAIResponding] = useState(false);

  // Track if AI is currently responding
  useEffect(() => {
    if (!events || events.length === 0) return;

    const latestEvent = events[0];
    if (latestEvent.type === "response.created") {
      setIsAIResponding(true);
    } else if (latestEvent.type === "response.done") {
      setIsAIResponding(false);
    }
  }, [events]);

  // Handle mode selection
  const handleModeSelect = (modeId) => {
    console.log("Mode selected:", modeId);
    setSelectedMode(modeId);
  };

  // Handle topic card selection - send user message to AI
  const handleTopicSelect = (topic) => {
    // Don't allow topic selection if AI is responding
    if (isAIResponding) {
      console.log("Ignoring topic click - AI is responding");
      return;
    }

    console.log("Topic selected:", topic.label);

    // Send the topic prompt as a user message
    sendClientEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: topic.prompt,
          },
        ],
      },
    });

    // Request AI response
    sendClientEvent({ type: "response.create" });
  };

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!audioConfigured && firstEvent.type === "session.created") {
      // Step 1: Configure session with instructions based on selected mode
      const instructions = MODE_INSTRUCTIONS[selectedMode];
      console.log(`Configuring session with ${selectedMode} mode instructions...`);

      const sessionUpdateConfig = {
        type: "session.update",
        session: {
          type: "realtime",
          model: "gpt-realtime",
          audio: {
            output: {
              voice: "shimmer", // Female voice for female avatar
            },
          },
          instructions: instructions,
        },
      };

      sendClientEvent(sessionUpdateConfig);
      setAudioConfigured(true);

      // Step 2: Trigger initial greeting after session is configured
      setTimeout(() => {
        console.log("Triggering initial greeting...");
        sendClientEvent({
          type: "response.create",
        });
      }, 500);
    }
  }, [events, selectedMode]);

  useEffect(() => {
    if (!isSessionActive) {
      setAudioConfigured(false);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-md p-4">
        <h2 className="text-xl font-bold text-purple-700 mb-4">English Practice Time! 🎓</h2>
        {isSessionActive ? (
          <div className="flex flex-col gap-3">
            <ModeSelector
              onModeSelect={handleModeSelect}
              isSessionActive={isSessionActive}
              currentMode={selectedMode}
            />
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-2">Tips for great practice:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Speak clearly and take your time</li>
                <li>✓ Don't worry about mistakes</li>
                <li>✓ Ask questions if you don't understand</li>
                <li>✓ Have fun with the conversation!</li>
              </ul>
            </div>
            <TopicCards onTopicSelect={handleTopicSelect} isSessionActive={isSessionActive} isDisabled={isAIResponding} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ModeSelector
              onModeSelect={handleModeSelect}
              isSessionActive={isSessionActive}
              currentMode={selectedMode}
            />
            <p className="text-gray-600">Click "Connect" to start practicing English! 🎤</p>
            <TopicCards onTopicSelect={handleTopicSelect} isSessionActive={isSessionActive} isDisabled={isAIResponding} />
          </div>
        )}
      </div>
    </section>
  );
}


