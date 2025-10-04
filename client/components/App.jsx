import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import Avatar3D from "./Avatar3D";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import StarProgress from "./StarProgress";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const starProgressRef = useRef(null);
  const [avatarEmotion, setAvatarEmotion] = useState('neutral');
  const [isAvatarListening, setIsAvatarListening] = useState(false);

  async function startSession() {
    // Get a session token for OpenAI Realtime API
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.value;

    console.log("Got ephemeral key:", EPHEMERAL_KEY?.substring(0, 10) + "...");

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    audioElement.current.volume = 1.0;
    document.body.appendChild(audioElement.current);

    pc.ontrack = (e) => {
      console.log("Received audio track from OpenAI", e.streams[0]);
      audioElement.current.srcObject = e.streams[0];

      // Add event listeners for debugging
      audioElement.current.onplay = () => console.log("Audio element started playing");
      audioElement.current.onpause = () => console.log("Audio element paused");
      audioElement.current.onerror = (err) => console.error("Audio element error:", err);
      audioElement.current.onloadedmetadata = () => {
        console.log("Audio metadata loaded, duration:", audioElement.current.duration);
        console.log("Audio ready state:", audioElement.current.readyState);
        console.log("Audio volume:", audioElement.current.volume);
        console.log("Audio muted:", audioElement.current.muted);
      };

      audioElement.current.play()
        .then(() => console.log("Audio play() succeeded"))
        .catch(err => console.error("Audio play error:", err));
    };

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // EXACTLY like the original console - direct call to OpenAI
    const baseUrl = "https://api.openai.com/v1/realtime/calls";
    const model = "gpt-realtime"; // Use original model name first

    console.log("Calling OpenAI directly:", baseUrl);
    console.log("Model:", model);

    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    console.log("OpenAI response:", sdpResponse.status);

    const sdp = await sdpResponse.text();
    console.log("SDP answer length:", sdp.length);

    const answer = { type: "answer", sdp };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    // Clean up audio element
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.srcObject = null;
      if (audioElement.current.parentNode) {
        audioElement.current.parentNode.removeChild(audioElement.current);
      }
      audioElement.current = null;
    }

    // Award star for completed session
    setSessionCompleted(true);

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }

        // Update avatar emotion based on AI events
        if (event.type === "response.created") {
          setAvatarEmotion('happy');
        } else if (event.type === "response.audio.delta") {
          setAvatarEmotion('neutral');
        } else if (event.type === "input_audio_buffer.speech_started") {
          setIsAvatarListening(true);
        } else if (event.type === "input_audio_buffer.speech_stopped") {
          setIsAvatarListening(false);
          setAvatarEmotion('thinking');
        } else if (event.type === "response.done") {
          setAvatarEmotion('encouraging');
          // Return to neutral after 2 seconds
          setTimeout(() => setAvatarEmotion('neutral'), 2000);
        }

        // Log important events with full details
        if (event.type === "response.audio.delta" ||
            event.type === "response.audio_transcript.delta" ||
            event.type === "response.done" ||
            event.type === "error") {
          console.log("Event:", event.type, event);
          if (event.type === "error") {
            console.error("ERROR DETAILS:", JSON.stringify(event, null, 2));
          }
          if (event.type === "response.done" && event.response?.status === "failed") {
            console.error("RESPONSE FAILED:", JSON.stringify(event.response?.status_details, null, 2));
          }
        }

        setEvents((prev) => [event, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center bg-gradient-to-r from-purple-500 to-blue-500">
        <div className="flex items-center gap-4 w-full m-4 pb-2">
          <img style={{ width: "24px" }} src={logo} />
          <h1 className="text-white font-bold text-xl">English Practice Buddy 🌟</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
            <Avatar3D
              audioElement={audioElement.current}
              emotion={avatarEmotion}
              isListening={isAvatarListening}
            />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto flex flex-col gap-4">
          <StarProgress
            ref={starProgressRef}
            isSessionActive={isSessionActive}
            sessionCompleted={sessionCompleted}
            onSessionComplete={() => setSessionCompleted(false)}
          />
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}
