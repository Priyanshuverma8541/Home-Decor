import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import { RoundedBox } from '@react-three/drei';

export default function Card3D({ children, image, title, price, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const cardRef = useRef();
  const imageRef = useRef();
  
  useFrame((state) => {
    if (cardRef.current) {
      cardRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      cardRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <group ref={cardRef} position={position} rotation={rotation}>
      {/* Card base with glass effect */}
      <RoundedBox args={[3, 4, 0.1]} radius={0.2}>
        <MeshDistortMaterial
          color="#1a1f3a"
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.3}
          distort={0.1}
          speed={2}
        />
      </RoundedBox>
      
      {/* Glowing border */}
      <RoundedBox args={[3.05, 4.05, 0.05]} radius={0.2}>
        <meshBasicMaterial color="#30ac90" transparent opacity={0.3} />
      </RoundedBox>
      
      {/* Image plane */}
      <mesh ref={imageRef} position={[0, 0.8, 0.1]}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial transparent opacity={0.9}>
          <textureLoader url={image} />
        </meshBasicMaterial>
      </mesh>
      
      {/* Title text area */}
      <mesh position={[0, -1.2, 0.1]}>
        <planeGeometry args={[2.8, 0.8]} />
        <meshBasicMaterial color="#0a0e27" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}