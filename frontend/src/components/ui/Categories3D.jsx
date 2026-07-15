import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATS = [
  { 
    slug: "seashell", 
    label: "Seashells", 
    emoji: "🐚", 
    desc: "Coastal art & natural specimens",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80",
    color: "#30ac90"
  },
  { 
    slug: "decor", 
    label: "Home Decor", 
    emoji: "🏠", 
    desc: "Elevate every room",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80",
    color: "#06b6d4"
  },
  { 
    slug: "gift", 
    label: "Gifts", 
    emoji: "🎁", 
    desc: "Curated gifting collections",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80",
    color: "#8b5cf6"
  },
  { 
    slug: "seasonal", 
    label: "Seasonal", 
    emoji: "🌸", 
    desc: "Festival & event specials",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80",
    color: "#c96030"
  },
];

export default function Categories3D() {
  return (
    <section style={{ 
      padding: '6rem 1rem', 
      position: 'relative',
      background: 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(48,172,144,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(48,172,144,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <p style={{
            fontSize: '0.75rem',
            color: '#30ac90',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '1rem',
            fontWeight: 500
          }}>
            Collections
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: 'white',
            marginBottom: '1rem',
            textShadow: '0 0 30px rgba(48,172,144,0.3)'
          }}>
            Shop by Category
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1rem',
            maxWidth: 500,
            margin: '0 auto'
          }}>
            Explore our curated collections of futuristic home decor
          </p>
        </motion.div>

        {/* Categories grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {CATS.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            >
              <Link to={`/shop?category=${cat.slug}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    rotateY: 5,
                    rotateX: 5
                  }}
                  style={{
                    position: 'relative',
                    height: 350,
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transformStyle: 'preserve-3d',
                    perspective: 1000
                  }}
                >
                  {/* Background image */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `url(${cat.image}) center/cover no-repeat`,
                    transition: 'transform 0.6s ease'
                  }} />
                  
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(135deg, ${cat.color}40 0%, transparent 50%, #0a0e2799 100%)`
                  }} />

                  {/* Animated border */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '1.5rem',
                      padding: '2px',
                      background: `linear-gradient(135deg, ${cat.color}, transparent, ${cat.color})`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      pointerEvents: 'none'
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Content */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    background: 'linear-gradient(to top, rgba(10,14,39,0.95) 0%, transparent 60%)'
                  }}>
                    <motion.div
                      style={{ fontSize: 48, marginBottom: '1rem' }}
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {cat.emoji}
                    </motion.div>

                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '1.75rem',
                      color: 'white',
                      marginBottom: '0.5rem',
                      textShadow: '0 0 20px rgba(48,172,144,0.5)'
                    }}>
                      {cat.label}
                    </h3>

                    <p style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.875rem',
                      marginBottom: '1rem'
                    }}>
                      {cat.desc}
                    </p>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: cat.color,
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}>
                      Explore <ArrowRight size={16} />
                    </div>
                  </div>

                  {/* Hover glow */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `radial-gradient(circle at center, ${cat.color}30 0%, transparent 70%)`,
                      opacity: 0,
                      pointerEvents: 'none'
                    }}
                    whileHover={{ opacity: 1 }}
                  />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}