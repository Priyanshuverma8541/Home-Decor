
import { motion } from "framer-motion";

const sliderItems = [
  { img: "/images/bracelet.jpg", title: "Elegant Necklace" },
  { img: "/images/ring.jpg", title: "Gold Ring" },
  { img: "/images/necklace.jpg", title: "Diamond Earrings" },
  { img: "/images/earring.jpg", title: "Traditional Bangles" },
  { img: "/images/ring.jpg", title: "Graceful Pendant" },
];

const Slider = () => {
  return (
    <section className="bg-[#fff4e3] py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-center text-3xl font-serif font-bold text-slate-900 mb-10">
          Our <span className="text-yellow-500">Signature</span> Pieces
        </h2>

        {/* Motion horizontal slider */}
        <motion.div
          className="flex gap-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        >
          {/* Duplicate items for seamless scroll */}
          {[...sliderItems, ...sliderItems].map((item, i) => (
            <div
              key={i}
              className="min-w-[240px] sm:min-w-[280px] bg-white border border-yellow-100
                         rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1
                         transition-all duration-300"
            >
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-56 object-cover rounded-t-2xl"
              />
              <div className="p-4 text-center">
                <p className="text-slate-700 font-medium">{item.title}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Slider;
