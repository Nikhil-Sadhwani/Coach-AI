import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Hub from "./pages/Hub.jsx";
import ChooseInterview from "./pages/ChooseInterview.jsx";
import CameraCheck from "./pages/CameraCheck.jsx";
import SessionRoom from "./pages/SessionRoom.jsx";
import Summary from "./pages/Summary.jsx";
import VoiceRoom from "./pages/VoiceRoom.jsx";

// Temporary screen until the actual interview rooms are converted.
function StudioPlaceholder({ mode }) {
  const navigate = useNavigate();

  return (
    <main
      className="min-h-screen flex items-center justify-center text-white px-6"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #111827, #172554)",
      }}
    >
      <div className="max-w-xl w-full text-center bg-gray-800 border border-gray-700 rounded-3xl p-10">
        <h1 className="text-2xl font-black text-emerald-400 mb-6">
          COACH AI
        </h1>

        <h2 className="text-3xl font-bold mb-4">
          {mode === "voice" ? "Live Voice Studio" : "Learning Mode"}
        </h2>

        <p className="text-gray-400 mb-6">
          Camera check completed successfully.
        </p>

        <p className="text-emerald-400 text-sm">
          Interview mode: {mode}
        </p>

        <p className="text-gray-500 text-sm mt-4">
          The actual interview room will be converted in the next steps.
        </p>

        <button
          type="button"
          onClick={() => navigate("/hub")}
          className="mt-8 text-emerald-400 font-bold"
        >
          Return to Hub
        </button>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/hub" element={<Hub />} />

      <Route
        path="/choose-interview"
        element={<ChooseInterview />}
      />

      <Route
        path="/camera-check"
        element={<CameraCheck />}
      />

      <Route
        path="/session-room"
        element={<SessionRoom />}
      />

      <Route path="/voice-room" element={<VoiceRoom />} />

      <Route
  path="/summary"
  element={<Summary />}
/>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}