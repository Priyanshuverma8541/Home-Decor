
import React from "react";
import { useAuth } from "../App";
import { motion } from "framer-motion";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-700 text-lg">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4e3] flex flex-col items-center py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 shadow-xl rounded-3xl p-8 w-full max-w-lg text-slate-800 border border-yellow-200 backdrop-blur-md"
      >
        <h2 className="text-3xl font-serifHeading font-bold text-yellow-600 mb-6 text-center">
          My Profile
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-yellow-100 pb-2">
            <p className="font-semibold text-slate-700">Name:</p>
            <p>{user.fullName}</p>
          </div>
          <div className="flex justify-between border-b border-yellow-100 pb-2">
            <p className="font-semibold text-slate-700">Email:</p>
            <p>{user.email}</p>
          </div>
          <div className="flex justify-between border-b border-yellow-100 pb-2">
            <p className="font-semibold text-slate-700">Address:</p>
            <p>{user.address || "Not provided"}</p>
          </div>
          <div className="flex justify-between pb-2">
            <p className="font-semibold text-slate-700">Role:</p>
            <p>{user.role || "Customer"}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
