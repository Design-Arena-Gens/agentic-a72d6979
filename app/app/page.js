"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import ChaseScene from "./scene/ChaseScene";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.canvasWrapper}>
        <Suspense
          fallback={<div className={styles.loading}>Initializing cinematic...</div>}
        >
          <Canvas
            shadows
            camera={{ position: [0, 3.4, 12], fov: 55, near: 0.1, far: 1000 }}
          >
            <color attach="background" args={["#030711"]} />
            <ChaseScene duration={20} />
          </Canvas>
        </Suspense>
      </div>
      <div className={styles.overlay}>
        <div className={styles.titles}>
          <span className={styles.tagline}>CINEMATIC SEQUENCE</span>
          <h1 className={styles.heading}>Pursuit Through the Nebula</h1>
          <p className={styles.subtitle}>
            A 20-second sci-fi chase between the interceptor <strong>Valkyrie</strong> and
            the rogue courier <strong>Specter</strong>.
          </p>
        </div>
        <div className={styles.timeline}>
          <span className={styles.timecode}>00s</span>
          <div className={styles.timelineTrack}>
            <div className={styles.timelineProgress} />
          </div>
          <span className={styles.timecode}>20s</span>
        </div>
      </div>
    </div>
  );
}
