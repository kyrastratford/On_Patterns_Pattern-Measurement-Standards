import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// 🎨 1. LINE COLOR CONFIGURATION
const COLOR_CONFIG = {
  default: "#e2fbaf",  // 🎯 Pure White
  hover: "#869caa",    // Electric Cyan
  selected: "#977e92", // Bright Purple
};

const NON_CLICKABLE_KEYWORDS = ["SHOE"];

const MEASUREMENT_SPECS = {
  "TOP EYESTAY WIDTH MEASURED AT TOP EYELET": {
    category: "FACING & LACING",
    unitRange: "40 - 55 mm",
    refPoint: "Top Eyelet Center Points",
    description:
      "Transverse distance across the upper eyelets. Governs high-instep lockdown, collar opening closure gap, and tongue overlap margins under lace tension.",
  },
  "BOTTOM EYESTAY WIDTH MEASURED AT BOTTOM EYELET": {
    category: "FACING & LACING",
    unitRange: "28 - 38 mm",
    refPoint: "Bottom Eyelet Junction",
    description:
      "Width at the throat entrance. Regulates forefoot flex transition, lace bite prevention, and ease of step-in entry across the instep.",
  },
  "TOE APEX": {
    category: "LAST & PROFILE",
    unitRange: "Reference Zero (0 mm)",
    refPoint: "Anterior Forefoot Boundary",
    description:
      "The forward-most longitudinal point of the toe box. Serves as the primary datum line for all upper length and outsole alignment measurements.",
  },
  "TONGUE START / U THROAT BOTTOM / FACING START": {
    category: "UPPER ANATOMY",
    unitRange: "75 - 95 mm from Apex",
    refPoint: "U-Throat Perimeter Base",
    description:
      "Anatomical inflection point where the vamp meets the eyestay facings. Critical for preventing flex-wrinkling and lace tension discomfort across metatarsal heads.",
  },
  "QUARTER HEIGHT MEASURING POSITION": {
    category: "COLLAR & FIT",
    unitRange: "55 - 70 mm",
    refPoint: "Midfoot Quarter Seam",
    description:
      "Standard vertical measuring axis along the quarter panel. Governs lateral ankle clearance and lateral malleolus containment.",
  },
  "TOP EYESTAY HEIGHT": {
    category: "FACING & LACING",
    unitRange: "65 - 80 mm",
    refPoint: "Strobel Line to Top Eyelet",
    description:
      "Vertical elevation of the highest lacing eyelet. Determines instep leverage, heel lock efficiency, and rearfoot retention angle.",
  },
  "QUARTER HEIGHT (+3/5MM MEDIAL QUARTER)": {
    category: "COLLAR & FIT",
    unitRange: "58 - 75 mm",
    refPoint: "Medial Quarter Collar Line",
    description:
      "Medial collar height, engineered 3mm to 5mm higher than the lateral quarter to match the natural anatomical elevation offset of the medial malleolus.",
  },
  "BACK HEIGHT": {
    category: "HEEL & ACHILLES",
    unitRange: "65 - 85 mm",
    refPoint: "Strobel Center to Achilles Notch",
    description:
      "Total rear seam height from the featherline to the Achilles collar curve. Balances calcaneal lockdown with Achilles tendon freedom.",
  },
  "COUNTER HEIGHT": {
    category: "HEEL & ACHILLES",
    unitRange: "45 - 60 mm",
    refPoint: "Internal Heel Board Apex",
    description:
      "Vertical span of the rigid internal heel counter board. Stabilizes calcaneal alignment and prevents heel slippage during gate transitions.",
  },
  "COLLAR OPENING": {
    category: "COLLAR & FIT",
    unitRange: "210 - 260 mm (Perimeter)",
    refPoint: "Topline Collar Edge Plane",
    description:
      "Total entry collar perimeter length. Controls foot entry accessibility, padding wrap compression, and ankle seal stability.",
  },
  "TONGUE LENGTH": {
    category: "FACING & LACING",
    unitRange: "110 - 145 mm",
    refPoint: "Throat Base to Tongue Topline",
    description:
      "Total longitudinal length of the tongue panel. Ensures full instep coverage underneath lace criss-cross matrix without instep bite.",
  },
  "EYESTAY APEX": {
    category: "FACING & LACING",
    unitRange: "Peak Elevation Datum",
    refPoint: "Eyestay Curve Inflexion",
    description:
      "Highest geometric point along the eyestay contour curve. Regulates structural wrap and lace force vector distribution into the saddle overlays.",
  },
  "TIP LENGTH": {
    category: "UPPER ANATOMY",
    unitRange: "40 - 65 mm",
    refPoint: "Toe Apex to Tip Seam",
    description:
      "Longitudinal distance from the forward toe apex to the posterior seam of the toe cap overlay. Protects toes against scuffs and structural collapsing.",
  },
  "VAMP LENGTH": {
    category: "UPPER ANATOMY",
    unitRange: "80 - 110 mm",
    refPoint: "Toe Apex to Facing Start",
    description:
      "Distance spanning from toe tip to the throat opening. Dictates upper forefoot dynamic flexing character and vamp proportion aesthetic.",
  },
  "TOOLING LIP": {
    category: "SOLE & LASTING",
    unitRange: "5 - 12 mm Wall Margin",
    refPoint: "Upper Lasting Featherline",
    description:
      "Perimeter bonding margin overlap between lower upper textile and outsole sidewall lip. Ensures cement bond durability under lateral loads.",
  },
  "LAST BOTTOM / STROBEL": {
    category: "SOLE & LASTING",
    unitRange: "Full Footprint Perimeter",
    refPoint: "Strobel Board Outer Margin",
    description:
      "2D planar footprint establishing lasting margin boundaries, strobel sock-stitch perimeter geometry, and midsole cavity fitting.",
  },
};

function getSpecForMeasurement(rawKey) {
  if (!rawKey) {
    return {
      category: "FOOTWEAR DIMENSION",
      unitRange: "N/A",
      refPoint: "Standard Datum Axis",
      description: "Precision 3D shoe measurement specification layer.",
    };
  }

  const clean = rawKey
    .toUpperCase()
    .replace(/[^A-Z0-9\s/()+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (MEASUREMENT_SPECS[clean]) {
    return MEASUREMENT_SPECS[clean];
  }

  const specKeys = Object.keys(MEASUREMENT_SPECS);
  const matchedKey = specKeys.find(
    (key) => clean.includes(key) || key.includes(clean)
  );

  if (matchedKey) {
    return MEASUREMENT_SPECS[matchedKey];
  }

  return {
    category: "FOOTWEAR DIMENSION",
    unitRange: "Standard Spec",
    refPoint: "3D Coordinate Datum",
    description: `Technical shoe measurement specification governing structural geometry for ${clean}.`,
  };
}

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
    ? partKey.replace(/_/g, " ").trim().toUpperCase()
    : "";

  const isNonClickable = NON_CLICKABLE_KEYWORDS.some((keyword) =>
    displayTitle.includes(keyword)
  );

  const isSelected = activePart === displayTitle;
  const isHovered = hoveredPart === displayTitle && !isNonClickable;

  const spec = getSpecForMeasurement(displayTitle);

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
      // 🎯 When inspecting a specific line, dim non-selected lines to 12%
      targetAlpha = isSelected ? 1.0 : isNonClickable ? 0.35 : 0.12;
    } else {
      // 🎯 FIX 1: Keep idle lines at 100% full opacity (1.0) so white doesn't blend into dark grey
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
        
        // 🎯 FIX 2: Boost self-illumination slightly when idle so scene shadows don't dim white into grey
        if ("emissive" in mat && mat.emissive) {
          if (!isNonClickable) {
            mat.emissive.set(COLOR_CONFIG.default);
            mat.emissiveIntensity = 0.35; // Soft glow prevents shadow darkening
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
            <div className="divider" />
            <p>{spec.description}</p>
          </aside>
        </Html>
      )}
    </ComponentType>
  );
}