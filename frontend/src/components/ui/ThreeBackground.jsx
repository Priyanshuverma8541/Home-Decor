import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField() {
  const particlesRef = useRef();
  const count = 2000;
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      
      // Cyan to purple gradient
      const t = Math.random();
      col[i * 3] = t * 0.2 + 0.1;     // R
      col[i * 3 + 1] = 0.8 - t * 0.3;  // G
      col[i * 3 + 2] = 0.9 + t * 0.1;  // B
    }
    
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function FloatingShape({ position, color, scale = 1 }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

function WaveRing() {
  const ringRef = useRef();
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.1;
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime) * 0.1);
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -3, -5]}>
      <torusGeometry args={[8, 0.1, 16, 100]} />
      <meshBasicMaterial color="#30ac90" transparent opacity={0.3} />
    </mesh>
  );
}

export default function ThreeBackground() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)' }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#30ac90" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c96030" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <ParticleField />
        
        <FloatingShape position={[-8, 3, -5]} color="#30ac90" scale={0.8} />
        <FloatingShape position={[8, -2, -8]} color="#c96030" scale={1.2} />
        <FloatingShape position={[0, 5, -10]} color="#8b5cf6" scale={0.6} />
        <FloatingShape position={[-5, -4, -6]} color="#06b6d4" scale={0.9} />
        
        <WaveRing />
      </Canvas>
    </div>
  );
}