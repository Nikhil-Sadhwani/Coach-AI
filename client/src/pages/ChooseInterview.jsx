import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api.js";

export default function ChooseInterview() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingMode, setStartingMode] = useState("");
  const [error, setError] = useState("");

  // Retrieve the role stored in the Express session.
  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await api.get("/interview/choose");

        setRole(response.data.role);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (err.response?.status === 400) {
          navigate("/hub", { replace: true });
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load interview options."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [navigate]);

  // Start either text or voice interview.
  const handleStartInterview = async (interviewType) => {
    setError("");
    setStartingMode(interviewType);

    try {
      const response = await api.post("/interview/start", {
        interviewType,
      });

      navigate("/camera-check", {
        state: {
          role: response.data.role,
          interviewType: response.data.interviewType,
        },
      });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to start the interview."
      );
    } finally {
      setStartingMode("");
    }
  };

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center text-emerald-400"
        style={{
          background:
            "linear-gradient(to bottom right, #0f172a, #111827, #172554)",
        }}
      >
        Loading interview options...
      </main>
    );
  }

  return (
    <div
      className="text-gray-100 min-h-screen font-sans"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #111827, #172554)",
      }}
    >
      {/* Navbar */}
      <nav className="bg-gray-800 px-6 md:px-10 py-5 flex justify-between items-center shadow-xl border-b border-gray-700">
        <h1 className="text-emerald-400 text-sm font-bold tracking-widest">
          COACH AI
        </h1>

        <button
          type="button"
          onClick={() => navigate("/hub")}
          className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-custom"
        >
          ← Change role
        </button>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto mt-12 md:mt-16 px-6 pb-16">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Step 2 of 2
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5">
            How do you want to interview?
          </h2>

          <p className="text-lg text-gray-400 mb-8">
            Choose your preferred interview experience.
          </p>

          <div className="inline-block bg-green-900 border border-green-700 text-green-300 px-6 py-3 rounded-full text-sm font-bold">
            {role}
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-8 p-4 bg-red-900 border border-red-700 text-red-300 text-sm font-bold rounded-xl text-center"
          >
            {error}
          </div>
        )}

        {/* Interview options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Standard Interview */}
          <button
            type="button"
            disabled={Boolean(startingMode)}
            onClick={() => handleStartInterview("text")}
            className="w-full text-left p-8 md:p-10 card rounded-3xl disabled:opacity-60"
          >
            <div className="text-5xl mb-6">📝</div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Standard Interview
            </h3>

            <p className="text-gray-400 leading-relaxed text-sm">
              Read questions on screen and answer using keyboard or voice
              typing.
            </p>

            <div className="mt-8 text-sm font-bold uppercase tracking-widest text-emerald-400">
              {startingMode === "text"
                ? "Starting..."
                : "Start Standard →"}
            </div>
          </button>

          {/* Live Voice Interview */}
          <button
            type="button"
            disabled={Boolean(startingMode)}
            onClick={() => handleStartInterview("voice")}
            className="w-full text-left p-8 md:p-10 voice-card rounded-3xl transition-custom disabled:opacity-60"
          >
            <div className="text-5xl mb-6">🎙️</div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Live Voice Interview
            </h3>

            <p className="text-gray-300 leading-relaxed text-sm">
              AI coach asks questions aloud while you answer naturally with
              live transcription.
            </p>

            <div className="mt-8 text-sm font-bold uppercase tracking-widest text-emerald-300">
              {startingMode === "voice"
                ? "Starting..."
                : "Start Voice →"}
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}