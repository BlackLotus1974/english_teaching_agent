import { useEffect, useState } from "react";
import { tutorInstructions } from "../../shared/tutorInstructions.js";

// Full session configuration to be sent after session is created
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
    instructions: tutorInstructions,
  },
};

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [audioConfigured, setAudioConfigured] = useState(false);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!audioConfigured && firstEvent.type === "session.created") {
      // Step 1: Configure session with instructions and audio settings
      console.log("Configuring session with English tutor instructions...");
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
  }, [events]);

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
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-2">Tips for great practice:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Speak clearly and take your time</li>
                <li>✓ Don't worry about mistakes</li>
                <li>✓ Ask questions if you don't understand</li>
                <li>✓ Have fun with the conversation!</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-2">Talk about:</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Your day</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Hobbies</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Books</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Games</span>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Stories</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Click "Connect" to start practicing English! 🎤</p>
        )}
      </div>
    </section>
  );
}


