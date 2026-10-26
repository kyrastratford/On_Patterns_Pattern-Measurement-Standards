import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// 🎨 1. LINE COLOR CONFIGURATION
const COLOR_CONFIG = {
  default: "#e2fbaf",  // Volt Default
  hover: "#869caa",    // Electric Cyan
  selected: "#977E92", // High-visibility Pink / Magenta
};

const NON_CLICKABLE_KEYWORDS = ["SHOE"];

export default function ShoeMeasurementPart({
  partKey,
  position,
  rotation,
  scale,
  material,
  onSelectPart,
  activePart,
  onHoverPart,
  hoveredPart,
  geometry,
  nodeType,
}) {
  const meshRef = useRef();
  const currentOpacity = useRef(1.0);

  const displayTitle = partKey
    ? partKey
        .replace(/_/g, " ")
        .replace(/35MM/g, "3/5MM")
        .replace(/3 5MM/g, "3/5MM")
        .trim()
        .toUpperCase()
    : "";

  const isNonClickable = NON_CLICKABLE_KEYWORDS.some((keyword) =>
    displayTitle.includes(keyword)
  );

  const isSelected = activePart === displayTitle;
  const isHovered = hoveredPart === displayTitle && !isNonClickable;

  // 🎯 2. ASSIGN REAL RAYCAST HANDLERS (Prevents R3F from wiping mesh.raycast)
  const raycastHandler = useMemo(() => {
    if (isNonClickable) {
      // The shoe geometry gets a no-op so rays pass straight through to the lines
      return () => {};
    }
    // Lines and measurement meshes retain their proper Three.js raycast methods
    if (nodeType === "LineSegments") return THREE.LineSegments.prototype.raycast;
    if (nodeType === "Line") return THREE.Line.prototype.raycast;
    return THREE.Mesh.prototype.raycast;
  }, [isNonClickable, nodeType]);

  const clonedMaterial = useMemo(() => {
    if (!material) {
      return new THREE.MeshStandardMaterial({
        color: COLOR_CONFIG.default,
        roughness: 0.1,
        metalness: 0.0,
        transparent: true,
        opacity: 1.0,
        side: isNonClickable ? THREE.FrontSide : THREE.DoubleSide,
      });
    }

    const mat = Array.isArray(material)
      ? material.map((m) => m.clone())
      : material.clone();

    const mats = Array.isArray(mat) ? mat : [mat];
    mats.forEach((m) => {
      m.transparent = true;
      m.side = isNonClickable ? THREE.FrontSide : THREE.DoubleSide;

      if (!isNonClickable && m.color) {
        m.color.set(COLOR_CONFIG.default);
      }
    });

    return mat;
  }, [material, isNonClickable]);

  // Reset pointer cursor when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    let targetAlpha = 1.0;

    if (activePart) {
      if (isSelected) {
        targetAlpha = 1.0;
      } else if (isNonClickable) {
        targetAlpha = 0.25; // Ghosted shoe silhouette
      } else {
        targetAlpha = 0.05; // Fade inactive lines so the active line stands out
      }
    } else {
      targetAlpha = 1.0;
    }

    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetAlpha,
      0.15
    );

    // Layer ordering: Selected line (10) > Inactive lines (5) > Ghost shoe (1)
    meshRef.current.renderOrder = isSelected ? 10 : isNonClickable ? 1 : 5;

    const mats = Array.isArray(meshRef.current.material)
      ? meshRef.current.material
      : [meshRef.current.material];

    mats.forEach((mat) => {
      if (!mat) return;

      mat.opacity = currentOpacity.current;
      mat.visible = currentOpacity.current > 0.01;

      // 🎯 DEPTH-SORTING FIX: Turn off depthWrite on the shoe while ghosted
      if (isNonClickable) {
        mat.depthWrite = !activePart;
      } else {
        mat.depthWrite = false;
      }

      if (isSelected) {
        if ("color" in mat && mat.color) mat.color.set(COLOR_CONFIG.selected);
        if ("emissive" in mat && mat.emissive) {
          mat.emissive.set(COLOR_CONFIG.selected);
          mat.emissiveIntensity = 0.9;
        }
      } else if (isHovered && !activePart && !isNonClickable) {
        if ("color" in mat && mat.color) mat.color.set(COLOR_CONFIG.hover);
        if ("emissive" in mat && mat.emissive) {
          mat.emissive.set(COLOR_CONFIG.hover);
          mat.emissiveIntensity = 0.7;
        }
      } else {
        if (!isNonClickable && "color" in mat && mat.color) {
          mat.color.set(COLOR_CONFIG.default);
        }

        if ("emissive" in mat && mat.emissive) {
          if (!isNonClickable) {
            mat.emissive.set(COLOR_CONFIG.default);
            mat.emissiveIntensity = 0.35;
          } else {
            mat.emissive.set("#000000");
            mat.emissiveIntensity = 0.0;
          }
        }
      }
    });
  });

  let ComponentType = "mesh";
  if (nodeType === "LineSegments") {
    ComponentType = "lineSegments";
  } else if (nodeType === "Line") {
    ComponentType = "line";
  }

  return (
    <ComponentType
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      geometry={geometry}
      material={clonedMaterial}
      raycast={raycastHandler}
      onClick={(e) => {
        e.stopPropagation();
        if (isNonClickable) return;
        onSelectPart(isSelected ? null : displayTitle);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isNonClickable) return;
        document.body.style.cursor = "pointer";
        if (!activePart) onHoverPart(displayTitle);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (isNonClickable) return;
        document.body.style.cursor = "auto";
        if (!activePart) onHoverPart(null);
      }}
    >
      {isSelected && (
        <Html
          position={[0, 0, 0]}
          style={{
            transform: "translate(220px, -50%)",
            pointerEvents: "auto",
          }}
        >
          <aside
            className="glazed-glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <button
                className="close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPart(null);
                }}
              >
                ×
              </button>
            </div>

            <h2>{displayTitle}</h2>
          </aside>
        </Html>
      )}
    </ComponentType>
  );
}