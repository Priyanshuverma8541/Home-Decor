import React from "react";
import { motion } from "framer-motion";

const Services = () => {
  const services = [
    {
      title: "Custom Jewelry Design",
      description:
        "Our experts craft personalized jewelry as per your unique style and preference.",
      icon: "💎",
    },
    {
      title: "Online Order & Delivery",
      description:
        "Seamless online purchasing experience with secure payment and doorstep delivery.",
      icon: "📦",
    },
    {
      title: "Virtual Try-On & Consultation",
      description:
        "Experience our jewelry virtually before purchasing and get expert consultation.",
      icon: "🖥️",
    },
    {
      title: "Store Visit & Booking",
      description:
        "Book an appointment at our stores in Buxar & Varanasi for a personalized experience.",
      icon: "🏬",
    },
    {
      title: "Repair & Polishing Services",
      description:
        "We offer professional jewelry repair, resizing, and polishing services.",
      icon: "🔧",
    },
  ];

  return (
    <div className="bg-[#fff4e3] py-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4"
        >
          Our Jewelry Services
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-slate-700 mb-12 text-lg md:text-xl"
        >
          Offering premium services for our customers in Buxar, Bihar & Varanasi, UP.
        </motion.p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-5xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {service.title}
              </h3>
              <p className="text-slate-700">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
