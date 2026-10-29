import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api.js";

export default function Summary() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        const response = await api.get("/interview/summary");

        if (!cancelled) {
          setSummary(response.data);
        }
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load interview summary."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900 text-emerald-400">
        Loading your results...
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="text-center">
          <p className="text-red-400 mb-6">
            {error || "Summary not available."}
          </p>

          <button
            onClick={() => navigate("/hub")}
            className="bg-emerald-600 px-6 py-3 rounded-full font-bold"
          >
            Return to Hub
          </button>
        </div>
      </main>
    );
  }

  const { avg, feedback, rubric, role, presenceScore } = summary;

  return (
    <main
      className="min-h-screen flex items-center justify-center text-white px-6 py-12 font-sans"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #111827, #172554)",
      }}
    >
      <div className="max-w-5xl w-full text-center">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
          Module Complete
        </p>

        <h1 className="text-6xl md:text-8xl font-extrabold text-emerald-400 mb-4">
          {avg}%
        </h1>

        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
          Performance Readiness
        </p>

        <p className="text-gray-300 mb-10">
          Role: {role || "Interview Candidate"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-left">
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-5">
              AI Presence Analysis
            </h2>

            <p className="text-gray-300 text-sm leading-relaxed">
              {feedback}
            </p>

            {presenceScore != null && (
              <p className="text-gray-400 text-sm mt-5">
                Presence score: {presenceScore}%
              </p>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-5">
              Rubric Metrics
            </h2>

            <div className="flex flex-wrap gap-3">
              {Object.entries(rubric || {}).map(([key, value]) => (
                <span
                  key={key}
                  className="bg-green-900 text-green-300 px-4 py-2 rounded-full text-xs font-bold uppercase"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/hub")}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-full font-bold uppercase text-sm tracking-widest"
        >
          Start New Session
        </button>
      </div>
    </main>
  );
}