import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../services/api.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registrationMessage = location.state?.message;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      navigate("/hub", {
        replace: true,
        state: {
          username: response.data.user.username,
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
      <div className="max-w-sm w-full p-10 bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl">
        <h1 className="text-2xl font-black text-center text-emerald-500 mb-8 tracking-tighter">
          COACH AI
        </h1>

        {registrationMessage && (
          <div className="mb-6 p-4 bg-green-900 text-green-300 text-xs font-bold rounded-2xl text-center">
            {registrationMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-900 text-red-300 text-xs font-bold rounded-2xl text-center"
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:border-emerald-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 py-4 rounded-full font-bold uppercase text-sm tracking-widest shadow-xl shadow-emerald-900 disabled:opacity-60"
          >
            {loading ? "Authorizing..." : "Authorize Access"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-10 uppercase font-bold tracking-widest">
          New?{" "}
          <Link to="/register" className="text-emerald-500">
            Create Profile
          </Link>
        </p>
      </div>
    </main>
  );
}