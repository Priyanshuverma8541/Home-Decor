import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';

export default function ProductCard3D({ product, index }) {
  const { addToCart } = useCart();
  const cardRef = useRef(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Prefer the product photo uploaded in Admin; branded jewelry art is a safe fallback.
  const getImage = (product) => {
    const images = {
      'rings': '/brand/savitri-jewellers-heart-earrings.png',
      'necklaces': '/brand/savitri-jewellers-earrings.png',
      'earrings': '/brand/savitri-jewellers-earrings.png',
      'bangles': '/brand/savitri-jewellers-heart-earrings.png',
      'bridal': '/brand/savitri-jewellers-earrings.png',
      'silver': '/brand/savitri-jewellers-heart-earrings.png'
    };
    return product.images?.[0] || images[product.category] || '/brand/savitri-jewellers-earrings.png';
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d'
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
    >
      <motion.div
        whileHover={{ scale: 1.05, z: 50 }}
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #ffffff 0%, #fdf6ee 100%)',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          border: '2px solid rgba(201,96,48,0.2)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 30px rgba(201,96,48,0.1)',
          transformStyle: 'preserve-3d',
          cursor: 'pointer'
        }}
      >
        {/* Gradient border effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '1.5rem',
          padding: '2px',
          background: 'linear-gradient(135deg, #d9bb82, #9d6a27, #f5e7cf)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none'
        }} />

        {/* Image container with 3D effect */}
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            position: 'relative',
            aspectRatio: '1',
            overflow: 'hidden', background: '#f8f0e5',
            transform: 'translateZ(20px)'
          }}>
            <img
              src={getImage(product)}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transition: 'transform 0.6s ease'
              }}
              loading="lazy"
            />
            
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(253,246,238,0.95) 100%)'
            }} />

            {/* Badges */}
            {product.isSeasonal && (
              <span style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'linear-gradient(135deg, #c96030, #e38345)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(201,96,48,0.4)'
              }}>
                Seasonal
              </span>
            )}
            
            {product.comparePrice && product.comparePrice > product.price && (
              <span style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'linear-gradient(135deg, #30ac90, #06b6d4)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(48,172,144,0.4)'
              }}>
                SALE
              </span>
            )}
          </div>
        </Link>

        {/* Content */}
        <div style={{
          padding: '1.5rem',
          transform: 'translateZ(30px)',
          position: 'relative',
          background: 'linear-gradient(180deg, transparent 0%, #ffffff 30%)'
        }}>
          <p style={{
            fontSize: '0.7rem',
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '0.5rem',
            fontWeight: 600
          }}>
            {product.category}
          </p>
          
          <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.35rem',
              color: 'white',
              marginBottom: '0.75rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontWeight: 600
            }}>
              {product.name}
            </h3>
          </Link>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '2px solid rgba(201,96,48,0.2)'
          }}>
            <div>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.75rem',
                color: 'white',
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(201,96,48,0.2)'
              }}>
                Rs.{product.price?.toLocaleString('en-IN')}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span style={{
                  fontSize: '0.875rem',
                  color: 'white',
                  textDecoration: 'line-through',
                  marginLeft: '0.5rem'
                }}>
                  Rs.{product.comparePrice?.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              style={{
                width: 45,
                height: 45,
                borderRadius: '50%',
                background: product.stock === 0 
                  ? 'rgba(0,0,0,0.1)' 
                  : 'linear-gradient(135deg, #c96030, #e38345)',
                color: 'white',
                border: 'none',
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: product.stock === 0 
                  ? 'none' 
                  : '0 4px 15px rgba(201,96,48,0.4)',
                opacity: product.stock === 0 ? 0.5 : 1
              }}
            >
              <ShoppingBag size={20} />
            </motion.button>
          </div>
        </div>

        {/* Hover glow effect */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(201,96,48,0.15) 0%, transparent 70%)',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.3s'
          }}
          whileHover={{ opacity: 1 }}
        />
      </motion.div>
    </motion.div>
  );
}
