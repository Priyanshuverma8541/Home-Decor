import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const GOLD = "#c59a5c";
const WALNUT = "#38251b";

function Box({ position, size, color, roughness = 0.7, metalness = 0, onClick, material = "standard", opacity = 1 }) {
  return <mesh position={position} onClick={onClick} castShadow={false} receiveShadow={false}>
    <boxGeometry args={size} />
    {material === "physical"
      ? <meshPhysicalMaterial color={color} roughness={roughness} metalness={metalness} transparent={opacity < 1} opacity={opacity} transmission={opacity < 1 ? .28 : 0} />
      : <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} transparent={opacity < 1} opacity={opacity} />}
  </mesh>;
}

function Counter({ position, accent = GOLD }) {
  return <group position={position}>
    <Box position={[0, .39, 0]} size={[2.4, .78, 1.05]} color={WALNUT} roughness={.36} />
    <Box position={[0, .47, .53]} size={[2.27, .015, .015]} color="#7f5735" roughness={.35} metalness={.22} />
    <Box position={[-.7, .37, .535]} size={[.018, .55, .018]} color={accent} roughness={.24} metalness={.55} />
    <Box position={[.7, .37, .535]} size={[.018, .55, .018]} color={accent} roughness={.24} metalness={.55} />
    <Box position={[0, .08, 0]} size={[2.44, .07, 1.09]} color="#c49a60" roughness={.3} metalness={.45} />
    <Box position={[0, .8, 0]} size={[2.48, .08, 1.12]} color={accent} roughness={.28} metalness={.55} />
    <Box position={[0, 1.08, 0]} size={[2.32, .48, .98]} color="#f1e9dc" roughness={.18} opacity={.22} material="physical" />
    <Box position={[0, 1.32, 0]} size={[2.38, .035, 1.04]} color="#fff8e9" roughness={.08} opacity={.32} material="physical" />
    {[-.78, 0, .78].map((x, index) => <group key={x} position={[x, 1.4, 0]}>
      <mesh position={[0, .17, 0]}><cylinderGeometry args={[.12, .24, .38, 18]} /><meshStandardMaterial color={index === 1 ? "#eadfcf" : "#d5c5ac"} roughness={.48} /></mesh>
      <mesh position={[0, .38, 0]} scale={[.12, .14, .12]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#e8ddcf" roughness={.55} /></mesh>
      <mesh position={[0, .37, .01]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.14, .018, 8, 36, Math.PI * 1.55]} /><meshStandardMaterial color="#c69b50" metalness={.86} roughness={.2} /></mesh>
      <mesh position={[.05, .49, .03]}><octahedronGeometry args={[.055, 0]} /><meshStandardMaterial color="#fff2cb" metalness={.5} roughness={.12} emissive="#705327" emissiveIntensity={.28} /></mesh>
    </group>)}
  </group>;
}

function SideCabinet({ x, z, side }) {
  return <group position={[x, 0, z]}>
    <Box position={[0, 2.45, 0]} size={[.24, 4.9, 1.35]} color={WALNUT} roughness={.32} />
    <Box position={[side * .17, 2.45, 0]} size={[.08, 4.65, 1.42]} color="#d8c6ab" roughness={.22} opacity={.22} material="physical" />
    {[.8, 1.85, 2.9, 3.95].map((y) => <group key={y}>
      <Box position={[side * .2, y, 0]} size={[.06, .055, 1.43]} color={GOLD} roughness={.25} metalness={.48} />
      <mesh position={[side * .24, y + .27, -.05]} scale={[.19, .28, .13]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#e6d9c7" roughness={.45} /></mesh>
      <mesh position={[side * .25, y + .37, -.03]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.13, .014, 7, 28, Math.PI * 1.55]} /><meshStandardMaterial color="#bd9149" metalness={.82} roughness={.2} /></mesh>
    </group>)}
    <pointLight position={[side * .45, 4.7, 0]} color="#ffe3a9" intensity={1.4} distance={3.5} decay={2} />
  </group>;
}

function Hotspot({ product, index, onPick }) {
  const x = index % 2 ? 2.15 : -2.15;
  const z = [3, -2, -7, -12][index] - 1.8;
  return <group position={[x, 1.48, z]} onClick={(event) => { event.stopPropagation(); onPick(product); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
    <mesh onClick={(event) => { event.stopPropagation(); onPick(product); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
      <sphereGeometry args={[.62, 12, 10]} /><meshBasicMaterial transparent opacity={0} colorWrite={false} />
    </mesh>
    <mesh position={[0, .14, 0]} scale={[.26, .34, .18]}><sphereGeometry args={[1, 18, 14]} /><meshStandardMaterial color="#e8ddcf" roughness={.46} /></mesh>
    <mesh position={[0, .38, .02]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.17, .02, 8, 40, Math.PI * 1.6]} /><meshStandardMaterial color="#d7ad64" metalness={.9} roughness={.18} /></mesh>
    <mesh position={[0, .53, .04]}><octahedronGeometry args={[.07, 0]} /><meshStandardMaterial color="#fff5d8" metalness={.55} roughness={.12} emissive="#99733a" emissiveIntensity={.35} /></mesh>
    <Html position={[0, .78, 0]} center distanceFactor={11} occlude={false}>
      <button className="mall-hotspot-label" type="button" onClick={(event) => { event.stopPropagation(); onPick(product); }} aria-label={`View ${product.name}`}>
        <span>{product.name}</span><b>₹{Number(product.price || 0).toLocaleString("en-IN")}</b>
      </button>
    </Html>
  </group>;
}

function Architecture({ products, onPick }) {
  const wallZ = [3, -2, -7, -12, -17, -22];
  return <>
    <color attach="background" args={["#17110d"]} />
    <fog attach="fog" args={["#201913", 19, 43]} />
    <ambientLight intensity={1.7} color="#fff0d6" />
    <hemisphereLight args={["#fff3dc", "#30251b", 1.25]} />
    <directionalLight position={[0, 7, 5]} intensity={2.6} color="#fff0d6" />
    <pointLight position={[0, 4.7, -4]} intensity={14} distance={18} color="#f0c77f" decay={2} />
    <Box position={[0, -.18, -8]} size={[14, .3, 42]} color="#e6ded1" roughness={.24} />
    {Array.from({ length: 14 }, (_, index) => <Box key={`seam-${index}`} position={[0, -.015, 11 - index * 3.1]} size={[13.8, .008, .018]} color="#b8a994" roughness={.8} />)}
    <Box position={[-7.05, 2.6, -8]} size={[.22, 5.3, 42]} color="#39291f" roughness={.34} />
    <Box position={[7.05, 2.6, -8]} size={[.22, 5.3, 42]} color="#39291f" roughness={.34} />
    <Box position={[0, 5.35, -8]} size={[14, .28, 42]} color="#241b16" roughness={.4} />
    <Box position={[-3.5, 5.14, -8]} size={[.06, .045, 38]} color="#c99d5f" roughness={.2} metalness={.45} />
    <Box position={[3.5, 5.14, -8]} size={[.06, .045, 38]} color="#c99d5f" roughness={.2} metalness={.45} />
    {wallZ.map((z, index) => <group key={z}>
      <SideCabinet x={-6.6} z={z} side={1} /><SideCabinet x={6.6} z={z} side={-1} />
      <Counter position={[index % 2 === 0 ? -2.25 : 2.25, 0, z - 1.8]} />
      <pointLight position={[0, 4.9, z]} intensity={1.9} distance={4.5} color="#ffe0a4" decay={2} />
    </group>)}
    {/* Walnut and brass entry portal */}
    <Box position={[-3.25, 2.6, 5.1]} size={[.28, 5.2, .35]} color={GOLD} metalness={.58} roughness={.25} />
    <Box position={[3.25, 2.6, 5.1]} size={[.28, 5.2, .35]} color={GOLD} metalness={.58} roughness={.25} />
    <Box position={[0, 5.1, 5.1]} size={[6.8, .28, .35]} color={GOLD} metalness={.58} roughness={.25} />
    <Box position={[-.8, 2.4, 5.32]} size={[1.48, 4.55, .045]} color="#c7d1c6" roughness={.08} opacity={.14} material="physical" />
    <Box position={[.8, 2.4, 5.32]} size={[1.48, 4.55, .045]} color="#c7d1c6" roughness={.08} opacity={.14} material="physical" />
    <Box position={[0, 2.4, 5.29]} size={[.035, 4.55, .09]} color="#c89e61" roughness={.21} metalness={.6} />
    <Box position={[-.16, 2.35, 5.2]} size={[.035, .56, .045]} color="#c89e61" roughness={.2} metalness={.7} />
    <Box position={[.16, 2.35, 5.2]} size={[.035, .56, .045]} color="#c89e61" roughness={.2} metalness={.7} />
    <Box position={[0, 4.22, 5.3]} size={[2.5, .76, .18]} color="#39271d" roughness={.32} />
    <Box position={[0, 3.84, 5.21]} size={[2.36, .025, .02]} color="#c59a5c" roughness={.24} metalness={.55} />
    <Html position={[0, 4.25, 5.15]} center distanceFactor={13}>
      <div className="mall-sign"><span>SAVITRI</span><small>L I V I N G S</small></div>
    </Html>
    {products.slice(0, 4).map((product, index) => <Hotspot key={product._id} product={product} index={index} onPick={onPick} />)}
  </>;
}

const stops = [
  { at: 0, position: [0, 1.7, 16.5], look: [0, 1.75, 5] },
  { at: .18, position: [0, 1.7, 6.1], look: [0, 1.7, -3] },
  { at: .42, position: [0, 1.7, .4], look: [0, 1.6, -7] },
  { at: .68, position: [.25, 1.72, -5.2], look: [0, 1.6, -12] },
  { at: 1, position: [0, 1.7, -12.3], look: [0, 1.65, -20] },
];

function CameraJourney({ progress }) {
  const { camera, invalidate } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const aim = useMemo(() => new THREE.Vector3(), []);
  const from = useMemo(() => new THREE.Vector3(), []);
  const to = useMemo(() => new THREE.Vector3(), []);
  const fromAim = useMemo(() => new THREE.Vector3(), []);
  const toAim = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    let a = stops[0]; let b = stops[stops.length - 1];
    for (let index = 0; index < stops.length - 1; index += 1) {
      if (p >= stops[index].at && p <= stops[index + 1].at) { a = stops[index]; b = stops[index + 1]; break; }
    }
    const local = (p - a.at) / Math.max(.0001, b.at - a.at);
    const eased = local * local * (3 - 2 * local);
    from.set(...a.position); to.set(...b.position); fromAim.set(...a.look); toAim.set(...b.look);
    target.copy(from).lerp(to, eased);
    aim.copy(fromAim).lerp(toAim, eased);
    camera.position.lerp(target, 1 - Math.exp(-delta * 3.2));
    camera.lookAt(aim);
    if (camera.position.distanceTo(target) > .006) invalidate();
  });
  return null;
}

export default function MallShowroom({ products, onPick, progress, reducedMotion }) {
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const lowMemory = Number(navigator.deviceMemory || 4) <= 2 || Number(navigator.hardwareConcurrency || 4) <= 2 || navigator.connection?.saveData;
      setWebgl(Boolean(!lowMemory && (canvas.getContext("webgl2") || canvas.getContext("webgl"))));
    } catch { setWebgl(false); }
  }, []);

  if (!webgl) return <div className="mall-2d-fallback" role="status">
    <div className="fallback-arch"><div className="fallback-shelf" /><div className="fallback-counter" /></div>
    <p>Explore Savitri Livings collections</p>
    <div className="fallback-products">{products.slice(0, 3).map((product) => <button key={product._id} onClick={() => onPick(product)}>{product.name}<span>₹{Number(product.price || 0).toLocaleString("en-IN")}</span></button>)}</div>
  </div>;

  return <Canvas
    dpr={[1, 1.3]}
    frameloop="demand"
    camera={{ position: [0, 1.7, 16.5], fov: 49, near: .1, far: 60 }}
    gl={{ antialias: false, powerPreference: "low-power", alpha: false }}
    onCreated={({ gl }) => { gl.setClearColor("#17110d", 1); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; }}
    aria-label="Scroll-driven 3D Savitri Livings jewellery showroom"
  >
    <Suspense fallback={null}>
      <Architecture products={products} onPick={onPick} />
      <CameraJourney progress={reducedMotion ? 0 : progress} />
    </Suspense>
  </Canvas>;
}
