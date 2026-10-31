
import React from "react";
import { motion } from "framer-motion";

const About = () => {
  const bgColor = "bg-[#fff4e3]"; // same background as Home

  return (
    <div className={`w-full ${bgColor} mt-28`}>
      <section className="py-28 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Subtle floating shapes for animation */}
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-yellow-200 rounded-full opacity-30 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-300 rounded-full opacity-20 blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative max-w-3xl"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-slate-900">
            About Us
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 1 }}
            className="text-lg md:text-xl text-slate-800/90 leading-relaxed"
          >
            We are a family-owned business with over 50 years of experience.
            We specialize in custom jewelry design and repair. Our mission is
            to provide our customers with the highest quality jewelry, crafted
            with passion and precision.
          </motion.p>
        </motion.div>
      </section>
    </div>
  );
};

export default About;
