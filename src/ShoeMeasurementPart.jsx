import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// 🎨 1. LINE COLOR CONFIGURATION
const COLOR_CONFIG = {
  default: "#e2fbaf",  // Pure White / Volt Default
  hover: "#869caa",    // Electric Cyan
  selected: "#977e92", // Bright Purple
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

  const clonedMaterial = useMemo(() => {
    if (!material) {
      return new THREE.MeshStandardMaterial({
        color: COLOR_CONFIG.default,
        roughness: 0.1,
        metalness: 0.0,
        transparent: true,
        opacity: 1.0,
      });
    }

    const mat = Array.isArray(material)
      ? material.map((m) => m.clone())
      : material.clone();

    const mats = Array.isArray(mat) ? mat : [mat];
    mats.forEach((m) => {
      m.transparent = true;
      m.depthWrite = true;

      if (!isNonClickable && m.color) {
        m.color.set(COLOR_CONFIG.default);
      }
    });

    return mat;
  }, [material, isNonClickable]);

  useFrame(() => {
    if (!meshRef.current) return;

    let targetAlpha = 1.0;

    if (activePart) {
      targetAlpha = isSelected ? 1.0 : isNonClickable ? 0.35 : 0.12;
    } else {
      targetAlpha = 1.0;
    }

    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetAlpha,
      0.1
    );

    const mats = Array.isArray(meshRef.current.material)
      ? meshRef.current.material
      : [meshRef.current.material];

    mats.forEach((mat) => {
      if (!mat) return;

      mat.opacity = currentOpacity.current;
      mat.visible = currentOpacity.current > 0.01;

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
      raycast={isNonClickable ? () => {} : THREE.Mesh.prototype.raycast}
      onClick={(e) => {
        e.stopPropagation();
        if (isNonClickable) return;
        onSelectPart(isSelected ? null : displayTitle);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isNonClickable) return;
        if (!activePart) onHoverPart(displayTitle);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (isNonClickable) return;
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
          {/* 🎯 TITLE-ONLY LABEL CARD */}
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