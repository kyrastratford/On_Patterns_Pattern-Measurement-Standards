import React, { useState, useEffect, useCallback, Suspense, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import ShoeMeasurementPart from "./ShoeMeasurementPart";

const MODEL_PATH =
"https://raw.githubusercontent.com/kyrastratford/On_3D-Assets/main/shoe_measurements.glb";

const NON_CLICKABLE_KEYWORDS = ["SHOE"];

class CanvasErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bottom-hud-container">
          <div className="glass-callout">
            <span>⚠️ WebGL re-rendering recovered. Click below to reset.</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ShoeModel({ activePart, setActivePart, hoveredPart, setHoveredPart, onPartsExtracted }) {
  const { nodes, materials } = useGLTF(MODEL_PATH);

  useEffect(() => {
    if (!nodes) return;
    const validParts = Object.keys(nodes)
      .filter((nodeName) => {
        const node = nodes[nodeName];
        if (!node || (!node.isMesh && !node.isLine && !node.isLineSegments)) return false;
        const upper = nodeName.replace(/_/g, " ").trim().toUpperCase();
        return !NON_CLICKABLE_KEYWORDS.some((k) => upper.includes(k));
      })
      .map((nodeName) => nodeName.replace(/_/g, " ").trim().toUpperCase());

    const uniqueParts = Array.from(new Set(validParts));
    if (onPartsExtracted) {
      onPartsExtracted(uniqueParts);
    }
  }, [nodes, onPartsExtracted]);

  return (
    <group dispose={null}>
      {Object.keys(nodes).map((nodeName) => {
        const node = nodes[nodeName];
        if (!node || (!node.isMesh && !node.isLine && !node.isLineSegments)) return null;

        return (
          <ShoeMeasurementPart
            key={nodeName}
            partKey={nodeName}
            geometry={node.geometry}
            material={node.material || materials[node.material?.name]}
            position={node.position}
            rotation={node.rotation}
            scale={node.scale}
            activePart={activePart}
            onSelectPart={setActivePart}
            hoveredPart={hoveredPart}
            onHoverPart={setHoveredPart}
            nodeType={node.type}
          />
        );
      })}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);

export default function ShoeMeasurementViewer() {
  const [activePart, setActivePart] = useState(null);
  const [hoveredPart, setHoveredPart] = useState(null);
  const [partsList, setPartsList] = useState([]);

  const handlePartsExtracted = useCallback((extractedList) => {
    setPartsList(extractedList);
  }, []);

  return (
    <div className="app-container">
      <div className="viewport-matrix">
        <aside className="sidebar-panel">
          <div className="sidebar-header">
            <h3>MEASUREMENTS</h3>
          </div>
          <div className="sidebar-list">
            {partsList.map((partName) => {
              const isSelected = activePart === partName;
              const isHovered = hoveredPart === partName;
              return (
                <button
                  key={partName}
                  className={`sidebar-btn ${isSelected ? "active" : ""} ${isHovered ? "hovered" : ""}`}
                  onClick={() => setActivePart(isSelected ? null : partName)}
                  onMouseEnter={() => !activePart && setHoveredPart(partName)}
                  onMouseLeave={() => !activePart && setHoveredPart(null)}
                >
                  <span className="indicator-dot" />
                  <span className="btn-text">{partName}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="canvas-wrapper">
          <CanvasErrorBoundary>
            <Canvas
              gl={{ toneMapping: THREE.NoToneMapping }}
              /* Generous hit radius so clicking anywhere near a line triggers it */
              raycaster={{ params: { Line: { threshold: 0.08 } } }}
              camera={{ position: [1.2, 0.8, 1.8], fov: 45 }}
              onPointerMissed={() => setActivePart(null)}
            >
              <color attach="background" args={["#050508"]} />

              <ambientLight intensity={1.0} />
              <directionalLight position={[10, 15, 10]} intensity={1.5} />

              <Suspense fallback={null}>
              <Center scale={0.004}>
                  <group rotation={[-Math.PI / 0.5, -Math.PI / 1.4, 0]}>
                    <ShoeModel
                      activePart={activePart}
                      setActivePart={setActivePart}
                      hoveredPart={hoveredPart}
                      setHoveredPart={setHoveredPart}
                      onPartsExtracted={handlePartsExtracted}
                    />
                  </group>
                </Center>
              </Suspense>

              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                makeDefault
              />
            </Canvas>
          </CanvasErrorBoundary>

          <div className="top-controls">
            <button
              className={`glass-toggle-btn ${activePart ? "active-mode" : ""}`}
              onClick={() => setActivePart(null)}
            >
              {activePart ? "Reset Selection" : "Click Line to Inspect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}