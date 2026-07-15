import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero3D() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 2;
    const y = (clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  return (
    <motion.section 
      style={{ 
        position: 'relative', 
        minHeight: '100svh', 
        display: 'flex', 
        alignItems: 'center', 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(48,172,144,0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)`,
        transition: 'transform 0.3s ease-out',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(201,96,48,0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
        transition: 'transform 0.3s ease-out',
        pointerEvents: 'none'
      }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(48,172,144,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(48,172,144,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        opacity: 0.3,
        pointerEvents: 'none'
      }} />

      <motion.div style={{ y: y1, opacity }} className="hero-content">
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '6rem 1rem', zIndex: 2 }}>
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(48,172,144,0.15)',
              border: '1px solid rgba(48,172,144,0.3)',
              borderRadius: '9999px',
              marginBottom: '2rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Sparkles size={16} color="#30ac90" />
            <span style={{ 
              color: '#30ac90', 
              fontSize: '0.75rem', 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase',
              fontWeight: 500
            }}>
              Future of Home Decor
            </span>
          </motion.div>

          {/* Main heading with 3D effect */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(3rem, 10vw, 7rem)',
              color: 'white',
              lineHeight: 1,
              marginBottom: '1.5rem',
              textShadow: '0 0 40px rgba(48,172,144,0.5), 0 0 80px rgba(48,172,144,0.3)',
              transform: `perspective(1000px) rotateY(${mousePos.x * 5}deg) rotateX(${mousePos.y * -5}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            Design Your
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #30ac90 0%, #06b6d4 50%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Dream Space
            </span>
          </motion.h1>

          {/* Subtitle with glass effect */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              lineHeight: 1.8,
              maxWidth: 600,
              marginBottom: '2.5rem',
              backdropFilter: 'blur(10px)',
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            Experience next-generation home decor with AI-powered design, holographic previews, 
            and sustainable luxury pieces crafted for the future.
          </motion.p>

          {/* CTA Buttons with neon glow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}
          >
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(48,172,144,0.6)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  position: 'relative',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #30ac90 0%, #06b6d4 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  boxShadow: '0 0 20px rgba(48,172,144,0.4)'
                }}
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Explore Collection <ArrowRight size={18} />
                </span>
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(201,96,48,0.6)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '1rem 2rem',
                background: 'transparent',
                color: '#c96030',
                border: '2px solid #c96030',
                borderRadius: '9999px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(201,96,48,0.3)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} /> View in AR
              </span>
            </motion.button>
          </motion.div>

          {/* Stats with neon effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3rem',
              marginTop: '4rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(48,172,144,0.2)'
            }}
          >
            {[
              { num: '10K+', label: 'Products' },
              { num: '50+', label: 'Designers' },
              { num: '∞', label: 'Possibilities' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
              >
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                  color: '#30ac90',
                  textShadow: '0 0 20px rgba(48,172,144,0.5)',
                  fontWeight: 600
                }}>
                  {stat.num}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 30,
          height: 50,
          border: '2px solid rgba(48,172,144,0.5)',
          borderRadius: 15,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 8
        }}
      >
        <div style={{
          width: 4,
          height: 10,
          background: '#30ac90',
          borderRadius: 2,
          boxShadow: '0 0 10px #30ac90'
        }} />
      </motion.div>

      <style>{`
        .hero-content {
          width: '100%';
        }
      `}</style>
    </motion.section>
  );
}