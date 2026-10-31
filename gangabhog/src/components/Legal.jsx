import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Legal = () => {
  const { hash } = useLocation();

  // Scroll to section when URL hash changes
  useEffect(() => {
    if (hash) {
      const section = document.querySelector(hash);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [hash]);

  return (
    <section className="min-h-screen bg-gray-50 text-gray-800 py-16 px-5 md:px-20 space-y-20">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Legal Information</h1>
        <p className="text-gray-600">
          Please review our terms and policies carefully to understand how we operate and protect your data.
        </p>
      </div>

      {/* Terms & Conditions */}
      <div id="terms" className="scroll-mt-20">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Terms & Conditions</h2>
        <p className="text-gray-700 leading-relaxed">
          By accessing Savitri Jewels’ website or making a purchase, you agree to comply with our terms. 
          All jewelry images and designs are proprietary. Misuse or reproduction without permission 
          is strictly prohibited.
        </p>
      </div>

      {/* Privacy Policy */}
      <div id="privacy" className="scroll-mt-20">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Privacy Policy</h2>
        <p className="text-gray-700 leading-relaxed">
          We respect your privacy. Personal information collected during purchases or account creation 
          is kept confidential and used solely for order processing and customer support. 
          We never share or sell your data to third parties.
        </p>
      </div>

      {/* Cookies */}
      <div id="cookies" className="scroll-mt-20">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Cookies</h2>
        <p className="text-gray-700 leading-relaxed">
          Our website uses cookies to improve your browsing experience. 
          These cookies help us understand user behavior, remember preferences, and enhance navigation. 
          You can manage or delete cookies from your browser settings.
        </p>
      </div>

      {/* Report Issue */}
      <div id="report" className="scroll-mt-20">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Report Issue</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Found an issue on our website or with your order? Let us know — we’ll fix it right away.
        </p>
        <a
          href="mailto:support@savitrijewels.com"
          className="text-blue-600 underline hover:text-blue-800"
        >
          support@savitrijewels.com
        </a>
      </div>
    </section>
  );
};

export default Legal;
