// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, signup, googleSignIn } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") await login(email, password);
      else await signup(email, password);
      navigate("/pickem");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
        await googleSignIn();
        navigate("/pickem");
    } catch (err) {
        console.error("Google sign-in error:", err);
        setError(err.message);
    }};


  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      <h1 className="text-3xl mb-4">{mode === "login" ? "Login" : "Sign Up"}</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-gray-800 p-6 rounded-md w-80 space-y-3"
      >
        <input
          type="email"
          placeholder="Email"
          className="p-2 rounded bg-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 rounded bg-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-400">{error}</p>}

        <button type="submit" className="bg-blue-500 py-2 rounded text-white">
          {mode === "login" ? "Log In" : "Sign Up"}
        </button>
      </form>

      {/* 👇 Add Google button below */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex items-center justify-center gap-2 mt-4 bg-white text-black py-2 px-4 rounded hover:bg-gray-200 transition"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5"
        />
        {googleLoading ? "Signing in..." : "Continue with Google"}
      </button>

      <button
        className="mt-4 text-blue-300 underline"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "Create an account" : "Already have an account?"}
      </button>
    </div>
  );
}
