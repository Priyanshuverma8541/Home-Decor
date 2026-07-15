import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const WA = import.meta.env.VITE_WHATSAPP || "6207855397";

export default function CTA3D() {
  return (
    <section style={{ 
      padding: '6rem 1rem', 
      position: 'relative',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
      overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(48,172,144,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(120px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        top: '30%',
        left: '30%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(201,96,48,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(48,172,144,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(48,172,144,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.4,
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            background: 'rgba(48,172,144,0.15)',
            border: '1px solid rgba(48,172,144,0.3)',
            borderRadius: '9999px',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Sparkles size={18} color="#30ac90" />
          <span style={{ 
            color: '#30ac90', 
            fontSize: '0.8rem', 
            letterSpacing: '0.15em', 
            textTransform: 'uppercase',
            fontWeight: 500
          }}>
            Start Today
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
            color: 'white',
            marginBottom: '1.5rem',
            lineHeight: 1.1,
            textShadow: '0 0 40px rgba(48,172,144,0.5), 0 0 80px rgba(48,172,144,0.3)'
          }}
        >
          Your Home Deserves
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #30ac90 0%, #06b6d4 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Something Beautiful
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            lineHeight: 1.8,
            maxWidth: 600,
            margin: '0 auto 3rem',
            backdropFilter: 'blur(10px)',
            padding: '1.25rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '1rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          Seashell decor, gift hampers and seasonal specials — all made by hand with futuristic designs for the modern home.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}
        >
          <Link to="/shop">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(48,172,144,0.7)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                position: 'relative',
                padding: '1.25rem 2.5rem',
                background: 'linear-gradient(135deg, #30ac90 0%, #06b6d4 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 0 30px rgba(48,172,144,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>
                Shop the Collection <ArrowRight size={20} />
              </span>
            </motion.button>
          </Link>

          <motion.a
            href={`https://wa.me/91${WA}?text=Hi Savitri Livings! I want to place an order.`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(201,96,48,0.7)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '1.25rem 2.5rem',
              background: 'transparent',
              color: '#c96030',
              border: '2px solid #c96030',
              borderRadius: '9999px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(201,96,48,0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none'
            }}
          >
            <MessageCircle size={20} /> Chat on WhatsApp
          </motion.a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.8 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(48,172,144,0.2)',
            flexWrap: 'wrap'
          }}
        >
          {[
            { icon: '🚚', text: 'Free Delivery' },
            { icon: '✨', text: 'Premium Quality' },
            { icon: '🌿', text: 'Eco-Friendly' },
            { icon: '💎', text: 'Handcrafted' }
          ].map((badge, i) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{badge.icon}</span>
              <span>{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}