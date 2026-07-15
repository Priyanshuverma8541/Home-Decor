import { motion } from 'framer-motion';
import { Truck, Shield, RotateCcw, Leaf, Sparkles } from 'lucide-react';

const FEATURES = [
  { 
    Icon: Truck, 
    title: "Same-city delivery", 
    desc: "Order by 2pm, get it today in Buxar",
    color: "#30ac90"
  },
  { 
    Icon: Shield, 
    title: "Handmade quality", 
    desc: "Each piece made with natural materials",
    color: "#06b6d4"
  },
  { 
    Icon: RotateCcw, 
    title: "Easy returns", 
    desc: "7-day return, no questions asked",
    color: "#8b5cf6"
  },
  { 
    Icon: Leaf, 
    title: "Eco-friendly", 
    desc: "Sustainable sourcing, always",
    color: "#10b981"
  },
];

export default function Features3D() {
  return (
    <section style={{ 
      padding: '5rem 1rem', 
      position: 'relative',
      background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1729 100%)',
      overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(48,172,144,0.15) 0%, transparent 70%)',
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
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(48,172,144,0.15)',
            border: '1px solid rgba(48,172,144,0.3)',
            borderRadius: '9999px',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={16} color="#30ac90" />
            <span style={{ 
              color: '#30ac90', 
              fontSize: '0.75rem', 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase',
              fontWeight: 500
            }}>
              Why Choose Us
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: 'white',
            marginBottom: '1rem',
            textShadow: '0 0 30px rgba(48,172,144,0.3)'
          }}>
            The Future of Home Decor
          </h2>
        </motion.div>

        {/* Features grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              whileHover={{ 
                scale: 1.05,
                y: -10
              }}
            >
              <div style={{
                position: 'relative',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(26,31,58,0.8) 0%, rgba(15,23,41,0.8) 100%)',
                borderRadius: '1.5rem',
                border: '1px solid rgba(48,172,144,0.2)',
                overflow: 'hidden',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}>
                {/* Animated gradient border */}
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '1.5rem',
                    padding: '2px',
                    background: `linear-gradient(135deg, ${feature.color}, transparent, ${feature.color})`,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none'
                  }}
                  animate={{
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Glow effect on hover */}
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at top right, ${feature.color}20 0%, transparent 70%)`,
                    opacity: 0,
                    pointerEvents: 'none'
                  }}
                  whileHover={{ opacity: 1 }}
                />

                {/* Icon */}
                <motion.div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '1rem',
                    background: `linear-gradient(135deg, ${feature.color}30, ${feature.color}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    border: `1px solid ${feature.color}40`,
                    boxShadow: `0 0 30px ${feature.color}30`
                  }}
                  whileHover={{ 
                    rotate: [0, -10, 10, 0],
                    scale: 1.1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <feature.Icon size={28} color={feature.color} />
                </motion.div>

                {/* Content */}
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.5rem',
                  color: 'white',
                  marginBottom: '0.75rem',
                  textShadow: `0 0 20px ${feature.color}50`
                }}>
                  {feature.title}
                </h3>

                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}>
                  {feature.desc}
                </p>

                {/* Decorative line */}
                <motion.div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '2rem',
                    right: '2rem',
                    height: '2px',
                    background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)`,
                    opacity: 0.5
                  }}
                  animate={{
                    scaleX: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}