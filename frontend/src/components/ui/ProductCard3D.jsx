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

  // High-quality home decor images from Unsplash
  const getImage = (product) => {
    const images = {
      'seashell': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
      'decor': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
      'gift': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80',
      'seasonal': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80'
    };
    return images[product.category] || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80';
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
          background: 'linear-gradient(135deg, rgba(26,31,58,0.9) 0%, rgba(15,23,41,0.9) 100%)',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          border: '1px solid rgba(48,172,144,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(48,172,144,0.2)',
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Glowing border effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '1.5rem',
          padding: '2px',
          background: 'linear-gradient(135deg, #30ac90, #06b6d4, #8b5cf6)',
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
            overflow: 'hidden',
            transform: 'translateZ(20px)'
          }}>
            <img
              src={getImage(product)}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s ease'
              }}
              loading="lazy"
            />
            
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, rgba(10,14,39,0.9) 100%)'
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
          position: 'relative'
        }}>
          <p style={{
            fontSize: '0.7rem',
            color: '#30ac90',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '0.5rem',
            fontWeight: 500
          }}>
            {product.category}
          </p>
          
          <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.25rem',
              color: 'white',
              marginBottom: '0.75rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
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
            borderTop: '1px solid rgba(48,172,144,0.2)'
          }}>
            <div>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.5rem',
                color: '#30ac90',
                fontWeight: 600,
                textShadow: '0 0 20px rgba(48,172,144,0.5)'
              }}>
                Rs.{product.price?.toLocaleString('en-IN')}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.4)',
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
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: product.stock === 0 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'linear-gradient(135deg, #30ac90, #06b6d4)',
                color: 'white',
                border: 'none',
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: product.stock === 0 
                  ? 'none' 
                  : '0 4px 15px rgba(48,172,144,0.4)',
                opacity: product.stock === 0 ? 0.5 : 1
              }}
            >
              <ShoppingBag size={18} />
            </motion.button>
          </div>
        </div>

        {/* Hover glow effect */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(48,172,144,0.1) 0%, transparent 70%)',
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