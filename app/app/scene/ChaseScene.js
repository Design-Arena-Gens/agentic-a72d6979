"use client";

import { forwardRef, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars, Trail } from "@react-three/drei";
import * as THREE from "three";

const forward = new THREE.Vector3(0, 0, 1);
const up = new THREE.Vector3(0, 1, 0);
const tmpQuaternion = new THREE.Quaternion();
const tmpVec = new THREE.Vector3();
const tmpVec2 = new THREE.Vector3();
const tmpVec3 = new THREE.Vector3();

export default function ChaseScene({ duration = 20 }) {
  const targetRef = useRef(null);
  const chaserRef = useRef(null);
  const rigRef = useRef(null);

  const { targetCurve, chaserCurve, nebulaCurve } = useMemo(() => {
    const targetPoints = [
      new THREE.Vector3(-18, 3, -24),
      new THREE.Vector3(-12, 6, -6),
      new THREE.Vector3(-6, 5, 6),
      new THREE.Vector3(2, 2, 14),
      new THREE.Vector3(8, 4, 26),
      new THREE.Vector3(16, 7, 32),
      new THREE.Vector3(24, 4, 44),
    ];

    const chaserOffset = [
      new THREE.Vector3(-20, 2, -28),
      new THREE.Vector3(-14, 4, -10),
      new THREE.Vector3(-7, 3.5, 4),
      new THREE.Vector3(1, 1.2, 12),
      new THREE.Vector3(8, 3.8, 22),
      new THREE.Vector3(14, 5.5, 30),
      new THREE.Vector3(20, 3, 40),
    ];

    const nebulaPoints = [
      new THREE.Vector3(-40, -4, -60),
      new THREE.Vector3(-10, 12, -30),
      new THREE.Vector3(18, -6, -10),
      new THREE.Vector3(-14, 4, 10),
      new THREE.Vector3(20, 10, 30),
      new THREE.Vector3(-8, -2, 60),
    ];

    return {
      targetCurve: new THREE.CatmullRomCurve3(targetPoints, false, "catmullrom", 0.5),
      chaserCurve: new THREE.CatmullRomCurve3(chaserOffset, false, "catmullrom", 0.65),
      nebulaCurve: new THREE.CatmullRomCurve3(nebulaPoints, false, "centripetal", 0.8),
    };
  }, []);

  useFrame((state, delta) => {
    if (!targetRef.current || !chaserRef.current) return;

    const elapsed = state.clock.getElapsedTime();
    const normalized = Math.min(elapsed / duration, 1);
    const eased = smoothstep(normalized);

    const targetPoint = targetCurve.getPointAt(eased);
    const targetTangent = targetCurve.getTangentAt(eased).normalize();

    targetRef.current.position.copy(targetPoint);
    tmpQuaternion.setFromUnitVectors(forward, targetTangent);
    targetRef.current.quaternion.slerp(tmpQuaternion, 0.25);

    const chaserProgress = Math.max(eased - 0.065, 0);
    const chaserPoint = chaserCurve.getPointAt(Math.min(chaserProgress * 1.08, 0.995));
    const chaserTangent = chaserCurve.getTangentAt(Math.min(chaserProgress * 1.08, 0.995)).normalize();

    chaserRef.current.position.copy(chaserPoint);
    tmpQuaternion.setFromUnitVectors(forward, chaserTangent);
    chaserRef.current.quaternion.slerp(tmpQuaternion, 0.2);
    tmpVec.copy(targetPoint).sub(chaserPoint).normalize();
    tmpQuaternion.setFromUnitVectors(forward, tmpVec);
    chaserRef.current.quaternion.slerp(tmpQuaternion, 0.1);

    if (rigRef.current) {
      const cinematicFocus = tmpVec2.copy(targetPoint).lerp(chaserPoint, 0.25);
      const chaseVector = tmpVec3.copy(chaserPoint)
        .addScaledVector(chaserTangent, -6)
        .addScaledVector(up, THREE.MathUtils.lerp(2.2, 5.4, eased));

      rigRef.current.position.lerp(chaseVector, 0.08);
      state.camera.position.copy(rigRef.current.position);
      state.camera.lookAt(cinematicFocus);
    }

    state.camera.updateProjectionMatrix();
  });

  return (
    <>
      <fog attach="fog" args={["#050910", 24, 120]} />
      <group ref={rigRef} position={[0, 3.4, 12]} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 12, -10]}
        intensity={1.4}
        color="#5b8dff"
        castShadow
      />
      <spotLight
        position={[-14, 6, -6]}
        angle={0.7}
        intensity={0.9}
        color="#f4d9ff"
        penumbra={0.6}
        distance={120}
      />

      <NebulaCloud curve={nebulaCurve} />
      <SpeedStreaks />
      <Stars radius={120} depth={60} count={4000} factor={4} fade />

      <group ref={targetRef}>
        <Spacecraft
          name="Specter"
          hullColor="#5ef4ff"
          accentColor="#75d5ff"
          engineColor="#89faff"
          engineSize={1.6}
          scale={1.3}
        />
        <Trail
          local
          width={0.6}
          length={24}
          color={new THREE.Color("#53ffff")}
          attenuation={(t) => t}
        >
          <mesh position={[0, 0, 0.8]}>
            <sphereGeometry args={[0.01, 4, 4]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </Trail>
      </group>

      <group ref={chaserRef}>
        <Spacecraft
          name="Valkyrie"
          hullColor="#ff6536"
          accentColor="#ffaf6d"
          engineColor="#ffdd93"
          engineSize={1.9}
          scale={1.6}
        />
        <Trail
          local
          width={0.8}
          length={32}
          color={new THREE.Color("#ff9052")}
          attenuation={(t) => t}
        >
          <mesh position={[0, 0, 1]}>
            <sphereGeometry args={[0.01, 4, 4]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </Trail>
      </group>
    </>
  );
}

const Spacecraft = forwardRef(function Spacecraft(
  { hullColor, accentColor, engineColor, scale = 1, engineSize = 1.4 },
  ref
) {
  const pulseRef = useRef(null);

  useFrame((state) => {
    if (!pulseRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 12) * 0.1;
    pulseRef.current.scale.set(engineSize * pulse, engineSize * pulse, pulse);
    pulseRef.current.material.emissiveIntensity = 1.4 + Math.sin(state.clock.elapsedTime * 20) * 0.4;
  });

  return (
    <group ref={ref} scale={scale}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.42, 2.4, 12, 1, true]} />
        <meshStandardMaterial
          color={hullColor}
          metalness={0.65}
          roughness={0.32}
          transparent
          opacity={0.85}
          emissive={hullColor}
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh castShadow position={[0, 0.2, -0.6]}>
        <cylinderGeometry args={[0.22, 0.35, 1.2, 16]} />
        <meshStandardMaterial
          color={accentColor}
          metalness={0.75}
          roughness={0.2}
          emissive={accentColor}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh castShadow position={[0, -0.22, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.12, 0.9, 2.2]} />
        <meshStandardMaterial color="#141720" metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, -1.3]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={accentColor} metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh ref={pulseRef} position={[0, 0, 1.4]}>
        <coneGeometry args={[0.21, 1.8, 16, 1, true]} />
        <meshStandardMaterial
          color={engineColor}
          emissive={engineColor}
          emissiveIntensity={1.6}
          transparent
          opacity={0.75}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
});

function NebulaCloud({ curve }) {
  const particlesRef = useRef(null);
  const { positions, colors } = useMemo(() => {
    const count = 1200;
    const positionsArray = new Float32Array(count * 3);
    const colorsArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const t = Math.random();
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      const normal = new THREE.Vector3()
        .copy(tangent)
        .cross(up)
        .normalize()
        .multiplyScalar((Math.random() - 0.5) * 14);
      const binormal = new THREE.Vector3()
        .crossVectors(tangent, normal)
        .normalize()
        .multiplyScalar((Math.random() - 0.5) * 10);

      const pos = new THREE.Vector3()
        .copy(point)
        .add(normal)
        .add(binormal)
        .addScaledVector(tangent, (Math.random() - 0.5) * 10);

      positionsArray[i * 3] = pos.x;
      positionsArray[i * 3 + 1] = pos.y;
      positionsArray[i * 3 + 2] = pos.z;

      const color = new THREE.Color().setHSL(
        0.58 + Math.random() * 0.08,
        0.6 + Math.random() * 0.2,
        0.32 + Math.random() * 0.25
      );
      colorsArray[i * 3] = color.r;
      colorsArray[i * 3 + 1] = color.g;
      colorsArray[i * 3 + 2] = color.b;
    }

    return { positions: positionsArray, colors: colorsArray };
  }, [curve]);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    particlesRef.current.rotation.y -= delta * 0.02;
    particlesRef.current.rotation.x += delta * 0.008;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.32}
        vertexColors
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function SpeedStreaks() {
  const streaksRef = useRef(null);
  const streakCount = 160;

  const streaks = useMemo(() => {
    const instances = [];
    for (let i = 0; i < streakCount; i += 1) {
      instances.push({
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 40,
        z: Math.random() * -150,
        length: 4 + Math.random() * 8,
        speed: 20 + Math.random() * 30,
      });
    }
    return instances;
  }, [streakCount]);

  useFrame((_, delta) => {
    if (!streaksRef.current) return;
    streaks.forEach((streak, index) => {
      streak.z += streak.speed * delta;
      if (streak.z > 10) {
        streak.z = -150;
        streak.x = (Math.random() - 0.5) * 80;
        streak.y = (Math.random() - 0.5) * 40;
      }
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3(streak.x, streak.y, streak.z);
      const scale = new THREE.Vector3(0.08, 0.08, streak.length);
      matrix.compose(position, new THREE.Quaternion(), scale);
      streaksRef.current.setMatrixAt(index, matrix);
    });
    streaksRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={streaksRef} args={[null, null, streakCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#7db9ff" transparent opacity={0.3} />
    </instancedMesh>
  );
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}
