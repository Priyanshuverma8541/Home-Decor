import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What makes Savitri Jewels unique?",
    answer:
      "Savitri Jewels combines traditional craftsmanship with modern designs to create timeless pieces that reflect elegance and purity.",
  },
  {
    question: "Do you offer custom jewelry designs?",
    answer:
      "Yes, we offer personalized jewelry designs where you can customize your choice of metal, stone, and style according to your preference.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Shipping usually takes 5–7 business days within India. International deliveries may take 10–15 business days depending on customs.",
  },
  {
    question: "Can I return or exchange my jewelry?",
    answer:
      "Yes, we have a 7-day return and exchange policy. Please ensure the product is unused and in original packaging.",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Absolutely. We use encrypted payment gateways to ensure your personal and financial data remain 100% secure.",
  },
];

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mt-10 min-h-screen bg-gray-50 py-16 px-5 md:px-20">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h1>
        <p className="text-gray-600">
          Find answers to some of the most common questions about our products and services.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-2xl p-5 cursor-pointer border border-gray-100"
            onClick={() => toggleFAQ(index)}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">{faq.question}</h3>
              {openIndex === index ? (
                <ChevronUp className="text-gray-500" />
              ) : (
                <ChevronDown className="text-gray-500" />
              )}
            </div>

            <AnimatePresence>
              {openIndex === index && (
                <motion.p
                  className="text-gray-600 mt-3 text-left"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {faq.answer}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQs;
