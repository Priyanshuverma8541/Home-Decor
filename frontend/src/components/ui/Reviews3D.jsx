import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const REVIEWS = [
  { 
    name: "Neha Singh", 
    city: "Buxar", 
    r: 5, 
    text: "Got a beautiful seashell frame for my living room. Delivery was same-day and packaging was lovely! The futuristic designs are absolutely stunning.",
    avatar: "NS"
  },
  { 
    name: "Divya Sharma", 
    city: "Buxar", 
    r: 5, 
    text: "Ordered a gift hamper for my mom's birthday. She absolutely loved it. Will order again for sure. The quality is unmatched!",
    avatar: "DS"
  },
  { 
    name: "Ritu Agarwal", 
    city: "Varanasi", 
    r: 5, 
    text: "The home decor pieces are so unique. Finally something different from what you find in regular shops. Love the futuristic aesthetic!",
    avatar: "RA"
  },
];

export default function Reviews3D() {
  return (
    <section style={{ 
      padding: '6rem 1rem', 
      position: 'relative',
      background: 'linear-gradient(180deg, #0f1729 0%, #1a1f3a 100%)',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
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
            color: '#8b5cf6',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '1rem',
            fontWeight: 500
          }}>
            Reviews
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: 'white',
            marginBottom: '1rem',
            textShadow: '0 0 30px rgba(139,92,246,0.3)'
          }}>
            What Customers Say
          </h2>
        </motion.div>

        {/* Reviews grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '2rem' 
        }}>
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 50, rotateY: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                rotateX: 5
              }}
              style={{
                perspective: 1000,
                transformStyle: 'preserve-3d'
              }}
            >
              <div style={{
                position: 'relative',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(26,31,58,0.9) 0%, rgba(15,23,41,0.9) 100%)',
                borderRadius: '1.5rem',
                border: '1px solid rgba(139,92,246,0.3)',
                overflow: 'hidden',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.2)',
                transformStyle: 'preserve-3d',
                transition: 'all 0.3s ease'
              }}>
                {/* Animated gradient border */}
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '1.5rem',
                    padding: '2px',
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4, #8b5cf6)',
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

                {/* Quote icon */}
                <div style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(139,92,246,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(139,92,246,0.3)'
                }}>
                  <Quote size={20} color="#8b5cf6" />
                </div>

                {/* Stars */}
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
                  {Array(review.r).fill(0).map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 + j * 0.1 }}
                    >
                      <Star size={18} fill="#c96030" color="#c96030" />
                    </motion.div>
                  ))}
                </div>

                {/* Review text */}
                <p style={{
                  fontSize: '1rem',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.8,
                  marginBottom: '2rem',
                  fontStyle: 'italic',
                  position: 'relative',
                  zIndex: 1
                }}>
                  "{review.text}"
                </p>

                {/* Author info */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(139,92,246,0.2)'
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    boxShadow: '0 0 20px rgba(139,92,246,0.4)',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    {review.avatar}
                  </div>
                  <div>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      {review.name}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      {review.city}
                    </p>
                  </div>
                </div>

                {/* Hover glow effect */}
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at top right, rgba(139,92,246,0.15) 0%, transparent 70%)',
                    opacity: 0,
                    pointerEvents: 'none'
                  }}
                  whileHover={{ opacity: 1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}