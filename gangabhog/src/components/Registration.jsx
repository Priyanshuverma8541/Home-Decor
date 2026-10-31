import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API = import.meta.env.VITE_API_URL;

const Registration = () => {
  const [fullName, setFullName] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be 8+ characters, include uppercase, lowercase, number & special character."
      );
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/api/users/register`, {
        fullName,
        userId,
        email,
        password,
      });

      alert("🎉 Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-20 min-h-screen bg-[#fff4e3] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white shadow-lg rounded-3xl p-8 border border-yellow-200"
      >
        <h2 className="text-3xl font-bold text-center text-yellow-600 mb-6">
          Create Your Account
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 text-center p-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 mt-1 border rounded-xl"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">User ID</label>
            <input
              type="text"
              className="w-full px-4 py-2 mt-1 border rounded-xl"
              placeholder="Choose a unique user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 mt-1 border rounded-xl"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 mt-1 border rounded-xl"
              placeholder="Enter strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must contain uppercase, lowercase, number & special character.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-full font-semibold text-white transition ${
              loading
                ? "bg-yellow-300"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-center mt-5">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-yellow-600 font-semibold cursor-pointer hover:underline"
          >
            Login here
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default Registration;