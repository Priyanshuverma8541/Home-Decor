import { useEffect, useState } from "react";
import { productAPI } from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import { useCity } from "../../context/CityContext.jsx";
import Hero3D from "../ui/Hero3D.jsx";
import Categories3D from "../ui/Categories3D.jsx";
import Features3D from "../ui/Features3D.jsx";
import FeaturedProducts3D from "../ui/FeaturedProducts3D.jsx";
import Reviews3D from "../ui/Reviews3D.jsx";
import CTA3D from "../ui/CTA3D.jsx";

const IG  = import.meta.env.VITE_INSTAGRAM || "savitrilivings";
const WA  = import.meta.env.VITE_WHATSAPP  || "6207855397";


export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { city } = useCity();

  useEffect(() => {
    productAPI.getAll({ featured:"true", city, limit:8 })
      .then(({ data }) => setFeatured(data.products||[]))
      .finally(() => setLoading(false));
  }, [city]);

  return (
    <div style={{ overflowX:"hidden" }}>
      {/* Hero Section */}
      <Hero3D />

      {/* Categories */}
      <Categories3D />

      {/* Features */}
      <Features3D />

      {/* Featured Products */}
      <FeaturedProducts3D products={featured} loading={loading} />

      {/* Reviews */}
      <Reviews3D />

      {/* CTA */}
      <CTA3D />
    </div>
  );
}
