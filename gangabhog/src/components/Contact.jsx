import React from "react";
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { motion } from "framer-motion";

const Contact = () => {
  const bgColor = "bg-[#fff4e3]"; // same as Home/Services/About

  return (
    <div className={`${bgColor} py-20`}>
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-serif font-bold text-center text-slate-900 mb-6"
        >
          Contact Us
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center text-lg md:text-xl text-slate-700 mb-12"
        >
          Reach out to us for any inquiries, custom jewelry orders, or store visits.
        </motion.p>

        {/* Branches */}
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              city: "Buxar, Bihar",
              address: "Main Road, Near City Mall, Buxar",
              phone: "+91 6207855397",
              email: "contact@jewelstore.com",
            },
            {
              city: "Varanasi, Uttar Pradesh",
              address: "Lanka Road, Near BHU Gate, Varanasi",
              phone: "+91 6207855397",
              email: "contact@jewelstore.com",
            },
          ].map((branch, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                {branch.city}
              </h3>
              <p className="text-slate-700 flex items-center justify-center mb-2">
                <FaMapMarkerAlt className="text-yellow-500 mr-2" /> {branch.address}
              </p>
              <p className="text-slate-700 flex items-center justify-center mb-2">
                <FaPhone className="text-green-500 mr-2" /> {branch.phone}
              </p>
              <p className="text-slate-700 flex items-center justify-center">
                <FaEnvelope className="text-red-500 mr-2" /> {branch.email}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Founder Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mt-16"
        >
          <h3 className="text-2xl font-semibold text-slate-900 mb-2">Founder</h3>
          <p className="text-lg text-slate-700">Priyanshu Verma</p>
          <p className="text-slate-700 flex items-center justify-center mt-2">
            <FaPhone className="text-green-500 mr-2" /> +91 6207855397
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
