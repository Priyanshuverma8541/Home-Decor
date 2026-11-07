import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowDown, Rotate3D } from "lucide-react";

const rooms = [
  { id: "welcome", title: "Welcome", x: -1.65, z: -1.45, color: 0x66d7f1 },
  { id: "engineering", title: "Engineering Studio", x: 1.65, z: -1.45, color: 0x8d9dff },
  { id: "management", title: "Project Management", x: -1.65, z: 1.45, color: 0x9b84ff },
  { id: "surveying", title: "Quantity Surveying", x: 1.65, z: 1.45, color: 0x66e0c3 },
];

function makeMaterial(color, opacity = 1) { return new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.16, transparent: opacity < 1, opacity }); }

export default function BuildingExperience({ onChooseRoom }) {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState("welcome");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let renderer; let animation = 0; let observer; let resize; let pointerDown = null; let targetRotation = 0; let rotation = 0;
    const geometries = []; const materials = [];
    const track = (object) => { geometries.push(object.geometry); if (Array.isArray(object.material)) materials.push(...object.material); else materials.push(object.material); return object; };
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#080b15"); scene.fog = new THREE.Fog("#080b15", 12, 31);
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 70); camera.position.set(9, 8, 10);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const roomMeshes = new Map();
    const supportsWebGL = (() => { try { const test = document.createElement("canvas"); return Boolean(test.getContext("webgl2") || test.getContext("webgl")); } catch { return false; } })();
    if (!supportsWebGL) { setFailed(true); return undefined; }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.setSize(host.clientWidth, host.clientHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.domElement.setAttribute("aria-label", "Interactive architectural dollhouse. Drag to rotate; select rooms below."); host.appendChild(renderer.domElement);
      const hemi = new THREE.HemisphereLight(0xdcecff, 0x171829, 2.2); scene.add(hemi);
      const keyLight = new THREE.DirectionalLight(0xc4dcff, 2.6); keyLight.position.set(6, 9, 5); scene.add(keyLight);
      const ambientGlow = new THREE.PointLight(0x3fbcdf, 1.2, 15); ambientGlow.position.set(-5, 4, -4); scene.add(ambientGlow);
      const orbit = new THREE.Group(); scene.add(orbit);
      const ground = track(new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.3, 7.4), makeMaterial(0x24293b))); ground.position.y = -0.05; orbit.add(ground);
      const trim = track(new THREE.Mesh(new THREE.BoxGeometry(8.65, 0.06, 7.45), makeMaterial(0x71d9ee))); trim.position.y = 0.12; orbit.add(trim);
      for (const room of rooms) {
        const floor = track(new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.14, 3.05), makeMaterial(0x202b40)));
        floor.position.set(room.x, 0.29, room.z); floor.userData.room = room.id; orbit.add(floor); roomMeshes.set(room.id, floor);
        const outlineBase = new THREE.BoxGeometry(3.56, 0.16, 3.06); const outlineGeometry = new THREE.EdgesGeometry(outlineBase); outlineBase.dispose();
        const outline = track(new THREE.LineSegments(outlineGeometry, new THREE.LineBasicMaterial({ color: room.color, transparent: true, opacity: 0.8 })));
        outline.position.set(room.x, 0.3, room.z); orbit.add(outline);
        const backWall = track(new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.55, 0.13), makeMaterial(0x53617b, 0.66)));
        backWall.position.set(room.x, 1.12, room.z - 1.48); orbit.add(backWall);
        const sideWall = track(new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.55, 2.95), makeMaterial(0x35425d, 0.7)));
        sideWall.position.set(room.x - 1.72, 1.12, room.z); orbit.add(sideWall);
        const accent = track(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.055, 0.08), makeMaterial(room.color)));
        accent.position.set(room.x, 1.62, room.z - 1.38); orbit.add(accent);
        const desk = track(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.13, 0.55), makeMaterial(0x667b98)));
        desk.position.set(room.x + 0.25, 0.88, room.z + 0.35); orbit.add(desk);
        const support = track(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.52, 0.09), makeMaterial(0x8596b4)));
        support.position.set(room.x + 0.25, 0.57, room.z + 0.35); orbit.add(support);
        const orb = track(new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 1), new THREE.MeshStandardMaterial({ color: room.color, emissive: room.color, emissiveIntensity: 0.25, metalness: 0.32, roughness: 0.25 })));
        orb.position.set(room.x, 1.86, room.z + 0.35); orb.userData.room = room.id; orbit.add(orb); roomMeshes.set(`${room.id}-orb`, orb);
      }
      for (const x of [-4.15, 0, 4.15]) for (const z of [-3.55, 0, 3.55]) {
        const column = track(new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.85, 0.12), makeMaterial(0x677894)));
        column.position.set(x, 1.44, z); orbit.add(column);
      }
      const roofFrameMaterial = new THREE.LineBasicMaterial({ color: 0x75d9f0, transparent: true, opacity: 0.45 });
      const roofFrame = track(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8.35, 0.08, 7.15)), roofFrameMaterial)); roofFrame.position.y = 2.96; orbit.add(roofFrame);
      const floorGrid = track(new THREE.GridHelper(22, 34, 0x283d59, 0x19283d)); floorGrid.position.y = -0.22; orbit.add(floorGrid);

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const draw = () => { if (!reducedMotion && !pointerDown) targetRotation += 0.0007; rotation += (targetRotation - rotation) * 0.035; orbit.rotation.y = rotation; renderer.render(scene, camera); if (!reducedMotion) animation = requestAnimationFrame(draw); };
      draw();
      resize = () => { if (!host.clientWidth || !host.clientHeight) return; camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); };
      observer = new ResizeObserver(resize); observer.observe(host); window.addEventListener("resize", resize);
      const onPointer = (event) => {
        const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera); const room = raycaster.intersectObjects(Array.from(roomMeshes.values()), false).find((hit) => hit.object.userData.room)?.object.userData.room;
        if (room) { setSelected(room); onChooseRoom(room); }
      };
      const onDown = (event) => { pointerDown = { x: event.clientX, rotation: targetRotation }; renderer.domElement.setPointerCapture?.(event.pointerId); };
      const onMove = (event) => { if (pointerDown) { targetRotation = pointerDown.rotation + (event.clientX - pointerDown.x) * 0.006; if (reducedMotion) { rotation = targetRotation; orbit.rotation.y = rotation; renderer.render(scene, camera); } } };
      const onUp = (event) => { pointerDown = null; onPointer(event); };
      renderer.domElement.addEventListener("pointerdown", onDown); renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerup", onUp);
      return () => { renderer.domElement.removeEventListener("pointerdown", onDown); renderer.domElement.removeEventListener("pointermove", onMove); renderer.domElement.removeEventListener("pointerup", onUp); window.removeEventListener("resize", resize); observer?.disconnect(); cancelAnimationFrame(animation); geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material?.dispose?.()); renderer.dispose(); renderer.domElement.remove(); };
    } catch {
      setFailed(true); if (renderer) { renderer.dispose(); renderer.domElement.remove(); }
      return undefined;
    }
  }, [onChooseRoom]);

  if (failed) return <div className="architecture-fallback" role="status"><div className="fallback-house"><i /><b /><span /></div><strong>Architectural scene preview</strong><p>The 3D environment is not available in this browser. All professional sections remain accessible below.</p></div>;
  return <section className="architecture-experience" aria-label="Interactive architectural portfolio scene">
    <div className="architecture-stage" ref={hostRef}><div className="architecture-legend"><Rotate3D size={14} /> DRAG TO ROTATE · SELECT A ROOM</div><span className="architecture-stage-hint"><ArrowDown size={13} /> Scroll for verified profile information</span></div>
    <div className="architecture-room-list" aria-label="Portfolio rooms">{rooms.map((room) => <button className={room.id === selected ? "active" : ""} type="button" key={room.id} onClick={() => { setSelected(room.id); onChooseRoom(room.id); }}>{room.title}</button>)}</div>
  </section>;
}
