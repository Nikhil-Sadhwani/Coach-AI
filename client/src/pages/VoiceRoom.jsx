
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function readError(err, fallback) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

function normalizeCurrent(data) {
  const source =
    data?.current && typeof data.current === "object"
      ? { ...data, ...data.current }
      : data;

  const rawQuestion =
    source?.question ??
    source?.q ??
    source?.currentQuestion ??
    source?.current_question ??
    "";

  const question =
    typeof rawQuestion === "string"
      ? rawQuestion
      : rawQuestion?.text || rawQuestion?.q || rawQuestion?.question || "";

  return {
    question,
    step: Math.max(
      1,
      Number(
        source?.n ??
          source?.progress ??
          source?.stepNumber ??
          source?.step ??
          1
      ) || 1
    ),
    total: Math.max(
      1,
      Number(source?.total ?? source?.t ?? source?.totalQuestions ?? 7) || 7
    ),
    role: source?.role || source?.mode || "Interview",
  };
}

export default function VoiceRoom() {
  const navigate = useNavigate();

  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [remaining, setRemaining] = useState(90);
  const [voiceStatus, setVoiceStatus] = useState("Initializing...");
  const [voiceModeStatus, setVoiceModeStatus] = useState(
    "Preparing coach voice..."
  );
  const [coachState, setCoachState] = useState("idle");
  const [isListening, setIsListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");
  const finalTextRef = useRef("");
  const interimTextRef = useRef("");
  const actionInFlightRef = useRef(false);
  const timeoutHandledRef = useRef(false);
  const handleActionRef = useRef(null);
  const speakQuestionRef = useRef(null);
  const hasIntroducedRef = useRef(false);

  const question = current?.question || "";
  const step = current?.step || 1;
  const total = current?.total || 7;
  const role = current?.role || "Interview";

  const timeLabel = `${String(Math.floor(remaining / 60)).padStart(
    2,
    "0"
  )}:${String(remaining % 60).padStart(2, "0")}`;

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/interview/current");
      const normalized = normalizeCurrent(data);

      if (!normalized.question) {
        throw new Error("The current interview question was not returned.");
      }

      setCurrent(normalized);
    } catch (err) {
      setError(readError(err, "Could not load the interview question."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  // Set up browser speech recognition.
  useEffect(() => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) return undefined;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalChunk += text;
        } else {
          interim += text;
        }
      }

      if (finalChunk) {
        finalTextRef.current = (
          finalTextRef.current + " " + finalChunk
        ).trim();
      }

      interimTextRef.current = interim;

      const completeText = (
        finalTextRef.current +
        (interim ? " " + interim : "")
      ).trim();

      setTranscript(completeText);

      const lower = completeText.toLowerCase();

      // Preserve the original spoken voice commands.
      if (
        /\b(submit answer|submit my answer)\b/.test(lower) &&
        !actionInFlightRef.current
      ) {
        handleActionRef.current?.("submit");
      } else if (
        /\b(next question|go next)\b/.test(lower) &&
        !actionInFlightRef.current
      ) {
        handleActionRef.current?.("next");
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setVoiceStatus(`Mic error: ${event.error}`);
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore a recognition restart race.
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;

      try {
        recognition.stop();
      } catch {
        // Ignore cleanup errors.
      }

      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      listeningRef.current = false;
      setIsListening(false);
      setVoiceStatus("Speech recognition unavailable — use Chrome or Edge.");
      return;
    }

    listeningRef.current = true;
    setIsListening(true);
    setVoiceStatus("Listening...");
    setCoachState("listening");

    try {
      recognition.start();
    } catch {
      // It may already be running.
    }
  }, []);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);

    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore stop errors.
    }
  }, []);

  const stopCoachAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);


const speakQuestion = useCallback(
  (isRepeat = false) => {
    if (!question) return;

    stopListening();
    stopCoachAudio();

    setCoachState("speaking");
    setVoiceStatus("Coach is speaking...");

    // Introduce the AI interviewer only once per interview.
    const isFirstAnnouncement =
      !isRepeat && !hasIntroducedRef.current;

    if (isFirstAnnouncement) {
      hasIntroducedRef.current = true;
    }

    // Repeat only the question when Repeat is clicked.
    const spokenText = isRepeat
      ? question
      : isFirstAnnouncement
        ? `Hello! I'm your AI interviewer. Here's your question: ${question}`
        : `Your next question is: ${question}`;

    // Browser speech starts immediately without waiting for the API.
    if (
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window
    ) {
      setVoiceModeStatus("Instant browser voice");

      const utterance = new SpeechSynthesisUtterance(spokenText);

      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => {
        startListening();
      };

      utterance.onerror = () => {
        setVoiceStatus(
          "Voice playback failed. Please read the question."
        );
        setCoachState("idle");
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // Neural voice fallback when browser speech is unavailable.
    setVoiceStatus("Generating coach voice...");

    api
      .post(
        "/voice/coach-speak",
        {
          question,
          is_first: isFirstAnnouncement,
        },
        { responseType: "blob" }
      )
      .then(({ data }) => {
        const url = URL.createObjectURL(data);
        const audio = new Audio(url);

        audioRef.current = audio;
        audioUrlRef.current = url;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioUrlRef.current = "";
          audioRef.current = null;
          startListening();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioUrlRef.current = "";
          audioRef.current = null;

          setVoiceStatus(
            "Voice unavailable. Please read the question."
          );
          setCoachState("idle");
        };

        setVoiceStatus("Coach is speaking...");
        return audio.play();
      })
      .catch(() => {
        setVoiceStatus(
          "Voice unavailable. Please read the question."
        );
        setCoachState("idle");
      });
  },
  [
    question,
    startListening,
    stopListening,
    stopCoachAudio,
  ]
);

  // Automatically read each question and then begin listening.
  speakQuestionRef.current = speakQuestion;

  
useEffect(() => {
  if (loading || !question) return;

  finalTextRef.current = "";
  interimTextRef.current = "";
  setTranscript("");
  setRemaining(90);
  timeoutHandledRef.current = false;

  // Start speaking as soon as the question is rendered.
  speakQuestionRef.current?.();
}, [loading, question, step]);


  const handleAction = useCallback(
    async (action) => {
      if (actionInFlightRef.current || saving) return;

      const answer = transcript.trim();

      if (!answer) {
        setError("Please speak or type your answer before continuing.");
        return;
      }

      actionInFlightRef.current = true;
      setSaving(true);
      setError("");

      stopListening();
      stopCoachAudio();

      try {
        const { data } = await api.post("/interview/answer", {
          action,
          answer,
        });

        if (data?.completed) {
          navigate("/summary");
          return;
        }

        await loadCurrent();
      } catch (err) {
        setError(readError(err, "Could not save your answer."));
      } finally {
        actionInFlightRef.current = false;
        setSaving(false);
      }
    },
    [transcript, saving, stopListening, stopCoachAudio, loadCurrent, navigate]
  );

  handleActionRef.current = handleAction;

  // One 90-second timer per question.
  useEffect(() => {
    if (loading || !question) return undefined;

    if (remaining <= 0) {
      if (!timeoutHandledRef.current) {
        timeoutHandledRef.current = true;
        handleActionRef.current?.("next");
      }
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setRemaining((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [remaining, loading, question, step]);

  const toggleMic = () => {
    if (isListening) {
      stopListening();
      setVoiceStatus("Mic paused");
      setCoachState("idle");
    } else {
      startListening();
    }
  };

  const endSession = async () => {
    stopListening();
    stopCoachAudio();

    try {
      await api.post("/interview/terminate");
      navigate("/hub");
    } catch (err) {
      setError(readError(err, "Could not end the interview session."));
    }
  };

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      stopCoachAudio();

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors.
      }
    };
  }, [stopCoachAudio]);

  return (
    <>
      <style>{`
        body {
          background: linear-gradient(to bottom right, #0f172a, #111827, #172554);
        }

        #coach[data-state="speaking"] .coach-ring {
          animation: voice-pulse 1.2s ease-in-out infinite;
          border-color: #34d399;
        }

        #coach[data-state="listening"] .coach-ring {
          animation: voice-pulse 0.8s ease-in-out infinite;
          border-color: #60a5fa;
        }

        @keyframes voice-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col text-gray-100 font-sans">
        <nav className="bg-gray-800 px-5 md:px-8 py-5 flex flex-wrap gap-4 justify-between items-center border-b border-gray-700 shadow-xl">
          <div className="flex items-center gap-4 md:gap-6">
            <span className="bg-emerald-500 text-black px-3 py-1 rounded-lg text-xs font-bold uppercase">
              Live Voice
            </span>

            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              {role}
            </span>

            <span className="text-emerald-400 font-mono text-2xl font-bold">
              {timeLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="bg-gray-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-gray-300">
              Question {step} / {total}
            </span>

            <button
              type="button"
              onClick={endSession}
              className="text-xs font-bold text-red-400 border border-red-400 px-4 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-custom uppercase tracking-widest"
            >
              End Session
            </button>
          </div>
        </nav>

        {loading && (
          <div className="flex-1 flex items-center justify-center p-8 text-gray-300">
            Loading interview question...
          </div>
        )}

        {!loading && !current && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-red-400 mb-5">{error || "Interview unavailable."}</p>
            <button
              type="button"
              onClick={() => navigate("/hub")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {!loading && current && (
          <main className="flex-1 flex flex-col lg:flex-row gap-8 p-5 md:p-8 max-w-7xl mx-auto w-full">
            <section className="lg:w-2/5 card rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center shadow-2xl">
              <div
                id="coach"
                data-state={coachState}
                className="relative mb-8"
              >
                <div className="coach-ring absolute inset-0 rounded-full border-4 border-emerald-500" />

                <div className="relative w-40 h-40 rounded-full bg-green-700 flex items-center justify-center text-6xl shadow-2xl">
                  🎙️
                </div>
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-4 text-center">
                {voiceStatus}
              </p>

              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-5 text-center">
                {voiceModeStatus}
              </p>

              <p className="text-center text-sm text-gray-400 leading-relaxed max-w-xs">
                AI coach reads questions aloud. Say{" "}
                <span className="text-emerald-400 font-bold">
                  "submit answer"
                </span>{" "}
                or use the buttons below.
              </p>

              <div className="flex gap-4 mt-8 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => speakQuestion(true)}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-gray-700 transition-custom disabled:opacity-50"
                >
                  Repeat
                </button>

                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-custom disabled:opacity-50"
                >
                  {isListening ? "Mic Off" : "Mic On"}
                </button>
              </div>
            </section>

            <section className="lg:flex-1 card rounded-3xl p-7 md:p-10 shadow-2xl flex flex-col">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">
                Current Question
              </p>

              <h1 className="text-2xl md:text-4xl font-extrabold leading-snug text-white mb-8">
                {question}
              </h1>

              {error && (
                <p
                  role="alert"
                  className="bg-red-900/40 border border-red-700 text-red-200 rounded-xl px-4 py-3 mb-5 text-sm"
                >
                  {error}
                </p>
              )}

              <div className="flex-1 bg-gray-900 rounded-3xl border border-gray-700 p-5 md:p-6 mb-8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Live Transcript
                </p>

                <textarea
                  value={transcript}
                  onChange={(event) => {
                    setTranscript(event.target.value);
                    finalTextRef.current = event.target.value;
                    interimTextRef.current = "";
                  }}
                  rows={7}
                  className="w-full bg-transparent text-lg text-white outline-none resize-y"
                  placeholder="Your answer appears here as you speak..."
                />
              </div>

              <div className="flex flex-wrap justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleAction("prev")}
                  disabled={step <= 1 || saving}
                  className="px-6 md:px-8 py-4 rounded-full border border-gray-700 font-bold uppercase text-sm tracking-widest hover:bg-gray-700 transition-custom disabled:opacity-30"
                >
                  ← Back
                </button>

                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAction("submit")}
                    disabled={saving}
                    className="bg-gray-700 text-white px-6 md:px-8 py-4 rounded-full font-bold uppercase text-sm tracking-widest hover:bg-gray-600 transition-custom disabled:opacity-50"
                  >
                    Submit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction("next")}
                    disabled={saving}
                    className="bg-emerald-600 text-white px-7 md:px-10 py-4 rounded-full font-bold uppercase text-sm tracking-widest hover:bg-emerald-500 transition-custom shadow-xl disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : step >= total
                        ? "Finish"
                        : "Next →"}
                  </button>
                </div>
              </div>
            </section>
          </main>
        )}
      </div>
    </>
  );
}
