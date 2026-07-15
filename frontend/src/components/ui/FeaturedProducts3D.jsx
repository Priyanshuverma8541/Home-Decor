import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard3D from './ProductCard3D.jsx';

export default function FeaturedProducts3D({ products, loading }) {
  return (
    <section style={{ 
      padding: '6rem 1rem', 
      position: 'relative',
      background: 'linear-gradient(180deg, #1a1f3a 0%, #0f1729 100%)'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(201,96,48,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'space-between',
            marginBottom: '3rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <p style={{
              fontSize: '0.75rem',
              color: '#c96030',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: '1rem',
              fontWeight: 500
            }}>
              Hand-picked
            </p>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'white',
              textShadow: '0 0 30px rgba(201,96,48,0.3)'
            }}>
              Featured Products
            </h2>
          </div>
          
          <Link to="/shop" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#c96030',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(201,96,48,0.3)',
            borderRadius: '9999px',
            transition: 'all 0.3s ease'
          }}>
            View all <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Products grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem' 
        }}>
          {loading ? (
            // Loading skeletons
            Array(4).fill(0).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  height: 450,
                  background: 'linear-gradient(135deg, rgba(26,31,58,0.5) 0%, rgba(15,23,41,0.5) 100%)',
                  borderRadius: '1.5rem',
                  border: '1px solid rgba(48,172,144,0.1)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
            ))
          ) : products.length > 0 ? (
            products.map((product, i) => (
              <ProductCard3D key={product._id} product={product} index={i} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '4rem 2rem',
                color: 'rgba(255,255,255,0.5)'
              }}
            >
              <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>No featured products yet</p>
              <Link to="/shop" style={{ color: '#c96030', textDecoration: 'none' }}>
                Browse all products
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}