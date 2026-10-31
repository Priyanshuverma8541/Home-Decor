import React from "react";
import { Home, Sparkles, Gift } from "lucide-react";

export default function SavitriLiving() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 mt-16">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Savitri Living
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Beautiful, affordable home décor curated for modern Indian homes.
            Thoughtfully designed pieces that add warmth, elegance, and meaning
            to your everyday spaces.
          </p>

          <div className="flex gap-4">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold px-6 py-3 rounded-2xl transition">
              Explore Collection
            </button>

            <button className="border border-yellow-400 text-yellow-600 hover:bg-yellow-50 font-semibold px-6 py-3 rounded-2xl transition">
              Contact on WhatsApp
            </button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"
            alt="Home Decor"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Why Savitri Living */}
      <section className="max-w-6xl mx-auto mt-20">
        <h2 className="text-3xl font-semibold text-center mb-10">
          Why Savitri Living
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <Home className="mx-auto mb-4 text-yellow-500" size={32} />
            <h3 className="text-xl font-medium mb-2">Curated for Homes</h3>
            <p className="text-gray-600 text-sm">
              Each piece is handpicked to suit Indian homes, blending tradition
              with modern aesthetics.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <Sparkles className="mx-auto mb-4 text-yellow-500" size={32} />
            <h3 className="text-xl font-medium mb-2">Quality & Elegance</h3>
            <p className="text-gray-600 text-sm">
              Premium look, durable quality, and honest pricing—no compromises.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <Gift className="mx-auto mb-4 text-yellow-500" size={32} />
            <h3 className="text-xl font-medium mb-2">Perfect for Gifting</h3>
            <p className="text-gray-600 text-sm">
              Ideal for festivals, housewarmings, weddings, and special moments.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto mt-20">
        <h2 className="text-3xl font-semibold text-center mb-10">
          Our Home Décor Collection
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {["Wall Décor", "Table Décor", "Idols & Diyas", "Gift Sets"].map(
            (item) => (
              <div
                key={item}
                className="bg-white rounded-2xl shadow hover:shadow-md transition p-6 text-center"
              >
                <h3 className="font-medium text-lg">{item}</h3>
              </div>
            )
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto mt-24 text-center">
        <h2 className="text-3xl font-semibold mb-4">
          Make Your Home Feel Special
        </h2>
        <p className="text-gray-600 mb-6">
          Discover décor that reflects warmth, culture, and timeless beauty.
        </p>

        <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold px-10 py-4 rounded-2xl text-lg transition">
          Shop Savitri Living
        </button>
      </section>
    </div>
  );
}
