import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api.js";

export default function SessionRoom() {
  const navigate = useNavigate();

  const [questionData, setQuestionData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch the current interview question from Express.
  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/interview/current");
      const data = response.data;

      // The standard room is only for text interviews.
      if (data.interviewType === "voice") {
        navigate("/voice-room", { replace: true });
        return;
      }

      setQuestionData(data);
      setAnswer("");
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
          "Unable to load the interview question."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  // Submit the current answer and move to the next question.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!answer.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post("/interview/answer", {
        action: "next",
        answer,
      });

      if (response.data.completed) {
        navigate("/summary", { replace: true });
        return;
      }

      // Get the next question from the backend.
      await loadQuestion();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to submit your answer. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Exit the interview and return to the Hub.
  const handleExit = async () => {
    try {
      await api.post("/interview/terminate");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
    }

    navigate("/hub", { replace: true });
  };

  if (loading && !questionData) {
    return (
      <main className="bg-indigo-50 min-h-screen flex items-center justify-center font-sans">
        <p className="text-indigo-600 font-bold">
          Loading interview question...
        </p>
      </main>
    );
  }

  if (!questionData) {
    return (
      <main className="bg-indigo-50 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 text-center shadow-lg">
          <p role="alert" className="text-red-600 mb-6">
            {error || "Unable to load the interview."}
          </p>

          <button
            type="button"
            onClick={loadQuestion}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const { question, number, total } = questionData;
  const progress = (number / total) * 100;
  const isLastQuestion = number === total;

  return (
    <div className="bg-indigo-50 min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="w-full bg-white border-b border-indigo-100 px-5 md:px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">
            C
          </div>

          <h1 className="text-indigo-900 font-bold tracking-tight uppercase text-sm">
            Learning Mode
          </h1>
        </div>

        <div className="flex items-center gap-3 md:gap-8">
          <div className="text-right">
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
              Session Progress
            </p>

            <p className="text-sm font-bold text-indigo-900">
              {number} of {total}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Question and answer */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl shadow-indigo-200 p-6 md:p-12 border border-white">
          <div className="mb-10">
            <span className="inline-block bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-black uppercase mb-4 tracking-wider">
              Concept Drill
            </span>

            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 leading-tight">
              {question}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <textarea
                name="ans"
                rows={5}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-6 md:p-8 text-lg text-gray-700 focus:border-indigo-400 focus:bg-white outline-none transition placeholder-slate-300 shadow-inner resize-y"
                placeholder="Explain this concept in your own words..."
                required
                disabled={submitting}
              />
            </div>

            {error && (
              <p role="alert" className="text-red-600 text-sm">
                {error}
              </p>
            )}

            <div className="flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
              <p className="text-xs text-gray-400 font-medium italic">
                Coach AI will analyze your keywords for accuracy.
              </p>

              <button
                type="submit"
                disabled={submitting || !answer.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 md:px-12 py-5 rounded-2xl font-black shadow-lg shadow-indigo-200 transition uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {submitting
                  ? "Processing Answer..."
                  : isLastQuestion
                    ? "Finish Session"
                    : "Continue Session"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Progress bar */}
      <footer className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </footer>
    </div>
  );
}