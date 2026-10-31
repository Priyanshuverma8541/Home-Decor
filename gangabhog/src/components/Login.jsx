import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../App"; // ✅ IMPORTANT

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth(); // ✅ use context

  // ✅ redirect AFTER login (no loop)
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(identifier, password); // ✅ use context login

    if (!res.success) {
      setError(res.message);
    }

    setLoading(false);
  };

  return (
    <div className="mt-20 min-h-screen flex items-center justify-center px-4 bg-[#fff4e3]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 bg-white border border-yellow-200 shadow-lg rounded-3xl"
      >
        <h2 className="text-3xl font-bold text-center text-yellow-600 mb-6">
          Login
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 text-center p-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium">
              Email or User ID
            </label>
            <input
              type="text"
              autoComplete="username"
              className="w-full px-4 py-2 mt-1 border rounded-xl"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-2 mt-1 border rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-full font-semibold text-white ${
              loading
                ? "bg-yellow-300 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;