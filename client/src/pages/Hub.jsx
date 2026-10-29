import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api.js";

export default function Hub() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [roles, setRoles] = useState([]);
  const [customRole, setCustomRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingRole, setSubmittingRole] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load the authenticated user and existing question-bank roles.
  useEffect(() => {
    const loadHub = async () => {
      try {
        const [userResponse, rolesResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/interview/roles"),
        ]);

        setUsername(userResponse.data.user.username);
        setRoles(rolesResponse.data.roles);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load the dashboard. Check the backend connection."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHub();
  }, [navigate]);

  // Select either a predefined or custom role.
  const handleRoleSelection = async (role, isCustom = false) => {
    if (!role.trim()) {
      setError("Please select or enter a job role.");
      return;
    }

    setError("");
    setMessage("");
    setSubmittingRole(true);

    try {
      const response = await api.post("/interview/select-role", {
        mode: isCustom ? "" : role,
        customRole: isCustom ? role.trim() : "",
      });

      navigate("/choose-interview", {
        state: {
          role: response.data.role,
        },
      });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to select this role."
      );
    } finally {
      setSubmittingRole(false);
    }
  };

  // Logout using the Express session.
  const handleLogout = async () => {
    setError("");

    try {
      await api.post("/auth/logout");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to log out. Please try again."
      );
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
        Loading Coach AI...
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
      <nav className="bg-gray-800 px-10 py-5 flex justify-between items-center shadow-xl border-b border-gray-700">
        <h1 className="text-emerald-400 text-sm font-bold tracking-widest">
          COACH AI
        </h1>

        <div className="flex items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-6">
            {username}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-red-300 bg-red-900 px-5 py-2 rounded-lg uppercase transition-custom"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto mt-16 px-6 pb-16">
        {error && (
          <div
            role="alert"
            className="mb-8 p-4 bg-red-900 border border-red-700 text-red-300 text-sm font-bold rounded-xl text-center"
          >
            {error}
          </div>
        )}

        {message && (
          <div className="mb-8 p-4 bg-green-900 border border-green-700 text-green-300 text-sm font-bold rounded-xl text-center">
            {message}
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-16">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Step 1 of 2
          </p>

          <h2 className="text-5xl font-extrabold text-white mb-5">
            Choose your job role
          </h2>

          <p className="text-lg text-gray-400">
            Pick an expert path or create a custom role. You’ll choose the
            interview style next.
          </p>
        </header>

        {/* Role selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Built-in roles */}
          <section className="space-y-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">
              Expert Paths
            </h3>

            {roles.map((role) => (
              <button
                key={role}
                type="button"
                disabled={submittingRole}
                onClick={() => handleRoleSelection(role)}
                className="w-full p-6 card rounded-2xl text-left font-bold text-lg transition-custom flex justify-between items-center disabled:opacity-60"
              >
                <span>{role}</span>

                <span className="text-2xl text-emerald-400">
                  →
                </span>
              </button>
            ))}

            {roles.length === 0 && (
              <p className="text-gray-400 text-sm">
                No roles are currently available.
              </p>
            )}
          </section>

          {/* Custom role */}
          <section className="card p-10 rounded-3xl">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6">
              Custom Role
            </h3>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleRoleSelection(customRole, true);
              }}
              className="space-y-6"
            >
              <input
                type="text"
                name="customRole"
                value={customRole}
                onChange={(event) => setCustomRole(event.target.value)}
                placeholder="e.g. DevOps, Product Manager"
                className="w-full bg-gray-900 border border-gray-700 p-5 rounded-xl outline-none focus:border-emerald-500 text-white"
                required
              />

              <button
                type="submit"
                disabled={submittingRole}
                className="w-full bg-emerald-600 py-5 rounded-full font-bold uppercase text-sm tracking-widest transition-custom disabled:opacity-60"
              >
                {submittingRole
                  ? "Please wait..."
                  : "Continue with custom role →"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}