
import React from "react";
import { motion } from "framer-motion";
import Footer from "./Footer";
import { FaArrowRight } from "react-icons/fa";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
const products = [
  { id: 1, name: "Gold Necklace", image: "/images/necklace.jpg", price: "₹24,999" },
  { id: 2, name: "Diamond Ring", image: "/images/ring.jpg", price: "₹19,499" },
  { id: 3, name: "Silver Bracelet", image: "/images/bracelet.jpg", price: "₹8,999" },
  { id: 4, name: "Elegant Earrings", image: "/images/earring.jpg", price: "₹12,999" },
];

const Dashboard = () => {
  
  return (
    
    <div className="min-h-screen bg-[#fff4e3] flex flex-col">
      <Navbar/>
      <Outlet />
      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center text-center py-28 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-serifHeading font-bold text-slate-900 mb-4"
        >
          Timeless Elegance, Crafted for You
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg md:text-xl text-slate-700 max-w-2xl"
        >
          Discover the finest collection of handcrafted jewellery — inspired by
          tradition, designed for the modern soul.
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="mt-10 bg-yellow-500 text-white px-8 py-3 rounded-full flex items-center gap-2 shadow-lg hover:bg-yellow-600 transition-all"
        >
          Explore Collection <FaArrowRight />
        </motion.button>
      </section>

      {/* PRODUCT SLIDER */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fff4e3] pointer-events-none" />
        <motion.div
          className="flex gap-10 animate-scroll px-10"
          initial={{ x: 0 }}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        >
          {[...products, ...products].map((product, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="min-w-[280px] bg-white/80 rounded-3xl shadow-lg backdrop-blur-md p-6 flex flex-col items-center"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-56 h-56 object-cover rounded-2xl mb-4"
              />
              <h3 className="text-xl font-serifHeading text-slate-900 mb-1">
                {product.name}
              </h3>
              <p className="text-slate-700 text-sm">{product.price}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Dashboard;
