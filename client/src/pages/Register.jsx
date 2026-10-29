import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api.js";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", {
        username,
        password,
      });

      navigate("/login", {
        replace: true,
        state: {
          message: "Profile created successfully. Please log in.",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to the server. Check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="bg-gray-900 text-white min-h-screen flex items-center justify-center font-sans px-4 py-8"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #111827, #172554)",
      }}
    >
      <div className="max-w-sm w-full p-10 bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl text-center">
        <h1 className="text-2xl font-black mb-10 text-white tracking-tight">
          Join Coach AI
        </h1>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-900 text-red-300 text-xs font-bold rounded-2xl"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="username"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:border-emerald-500"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:border-emerald-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-full font-bold uppercase text-sm tracking-widest border border-gray-300 disabled:opacity-60"
          >
            {loading ? "Creating Profile..." : "Create Profile"}
          </button>
        </form>

        <Link
          to="/login"
          className="inline-block mt-8 text-xs text-gray-500 font-bold uppercase tracking-widest"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}