import { useState, useRef } from "react";

// ── SVG texture generator ─────────────────────────────────────────────────────
function svg(c1, c2, type) {
  var inner;
  if (type === "crystal") {
    inner = '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + c1 + '"/><stop offset="100%" stop-color="' + c2 + '"/></linearGradient></defs>'
      + '<rect width="400" height="240" fill="url(#g)"/>'
      + '<polygon points="200,18 272,110 200,222 128,110" fill="white" opacity="0.09"/>'
      + '<polygon points="200,18 272,110 200,222 128,110" fill="none" stroke="white" stroke-width="1.5" opacity="0.22"/>'
      + '<polygon points="140,36 220,88 188,206 96,142" fill="white" opacity="0.05"/>'
      + '<polygon points="260,40 310,120 240,200" fill="none" stroke="white" stroke-width="1" opacity="0.15"/>';
  } else if (type === "banded") {
    inner = '<rect width="400" height="240" fill="' + c2 + '"/>'
      + [0,1,2,3,4,5].map(function(i){ return '<rect x="0" y="' + (i*40) + '" width="400" height="22" fill="' + c1 + '" opacity="0.82"/>'; }).join('');
  } else if (type === "speckle") {
    inner = '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + c1 + '"/><stop offset="100%" stop-color="' + c2 + '"/></linearGradient></defs>'
      + '<rect width="400" height="240" fill="url(#g)"/>'
      + [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19].map(function(i){
          var cx = ((i*73+11)%370)+15; var cy = ((i*59+17)%210)+15; var r = 2+(i%4);
          return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="white" opacity="' + (0.08+i%3*0.05) + '"/>';
        }).join('');
  } else if (type === "layered") {
    inner = '<rect width="400" height="240" fill="' + c1 + '"/>'
      + [0,1,2,3,4,5,6,7,8].map(function(i){
          return '<rect x="0" y="' + (i*28+i%2*4) + '" width="400" height="' + (6+i%3*3) + '" fill="' + c2 + '" opacity="' + (0.45+i*0.04) + '"/>';
        }).join('');
  } else if (type === "metallic") {
    inner = '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + c2 + '"/><stop offset="50%" stop-color="' + c1 + '"/><stop offset="100%" stop-color="' + c2 + '"/></linearGradient></defs>'
      + '<rect width="400" height="240" fill="url(#g)"/>'
      + '<line x1="0" y1="0" x2="400" y2="240" stroke="white" stroke-width="2.5" opacity="0.38"/>'
      + '<line x1="0" y1="70" x2="330" y2="240" stroke="white" stroke-width="1" opacity="0.22"/>'
      + '<line x1="70" y1="0" x2="400" y2="170" stroke="white" stroke-width="1" opacity="0.22"/>';
  } else if (type === "porous") {
    inner = '<rect width="400" height="240" fill="' + c1 + '"/>'
      + [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(function(i){
          var cx = ((i*67+30)%370)+15; var cy = ((i*53+20)%200)+20;
          var rx = 2+(i%5); var ry = 1+(i%4);
          return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + c2 + '" opacity="0.7"/>';
        }).join('');
  } else {
    inner = '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + c1 + '"/><stop offset="100%" stop-color="' + c2 + '"/></linearGradient></defs>'
      + '<rect width="400" height="240" fill="url(#g)"/>';
  }
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">' + inner + '</svg>';
  return "data:image/svg+xml;base64," + btoa(s);
}

// ── Color matching math (offline, no model) ───────────────────────────────────

// Convert hex → [r, g, b] in 0-1 range
function hexRgb(hex) {
  return [
    parseInt(hex.slice(1,3), 16) / 255,
    parseInt(hex.slice(3,5), 16) / 255,
    parseInt(hex.slice(5,7), 16) / 255,
  ];
}

// Rock's characteristic color vector = avg of its colors[] in perceptual (gamma) space
function rockColorVec(rock) {
  var vecs = rock.colors.map(hexRgb);
  var n = vecs.length;
  return [
    vecs.reduce(function(s, v){ return s + v[0]*v[0]; }, 0) / n,
    vecs.reduce(function(s, v){ return s + v[1]*v[1]; }, 0) / n,
    vecs.reduce(function(s, v){ return s + v[2]*v[2]; }, 0) / n,
  ].map(Math.sqrt); // linear-light average → back to gamma
}

// Extract dominant color vector from raw ImageData (pixel array)
function extractColorVec(imageData) {
  var d = imageData.data;
  var rSum = 0, gSum = 0, bSum = 0, count = 0;
  // Sample every 8th pixel, skip near-black/near-white (often background or glare)
  for (var i = 0; i < d.length; i += 32) {
    var r = d[i], g = d[i+1], b = d[i+2];
    var bright = (r + g + b) / 3;
    if (bright > 25 && bright < 230) {
      rSum += r; gSum += g; bSum += b; count++;
    }
  }
  // Fall back to all pixels if nothing in mid-range
  if (count === 0) {
    for (var j = 0; j < d.length; j += 32) {
      rSum += d[j]; gSum += d[j+1]; bSum += d[j+2]; count++;
    }
  }
  return [rSum/(count*255), gSum/(count*255), bSum/(count*255)];
}

// Euclidean distance in RGB space
function colorDist(a, b) {
  var dr = a[0]-b[0], dg = a[1]-b[1], db = a[2]-b[2];
  return Math.sqrt(dr*dr + dg*dg + db*db);
}

// Rank all rocks by color similarity to a captured vec (closest first)
function rankByColor(capturedVec) {
  return ROCKS
    .map(function(r){ return { rock: r, dist: colorDist(capturedVec, rockColorVec(r)) }; })
    .sort(function(a, b){ return a.dist - b.dist; });
}

// ── Specimen data (Texas + common finds) ─────────────────────────────────────
const ROCKS = [
  {
    id: 1, name: "Chert / Flint", formula: "Cryptocrystalline SiO₂",
    class: "Siliceous sedimentary", photo: svg("#5a5048","#382e28","smooth"),
    colors: ["#5a5048","#3a3028"], swatchLabel: "Dark gray · brown · black",
    formation: "Nodules in limestone — abundant in Texas Hill Country",
    hardness: "7 Mohs", luster: "Waxy",
    streak: "White", cleavage: "None — sharp conchoidal fracture",
    description: "The most common field find in Texas. Found as nodules inside limestone. Sparks with steel. Used for arrowheads for hundreds of thousands of years — you'll spot ancient knapping chips.",
    distinguishing: "Dark gray-brown-black, very hard (7), waxy sheen. Sharp curved fracture. Found as rounded nodules inside limestone layers. Strikes sparks.",
  },
  {
    id: 2, name: "Limestone", formula: "CaCO₃ (marine origin)",
    class: "Sedimentary rock", photo: svg("#c8c0b0","#a09888","layered"),
    colors: ["#c8c0b0","#a09888"], swatchLabel: "Gray · cream · tan",
    formation: "Dominant rock of Texas Hill Country and central Texas",
    hardness: "3 Mohs", luster: "Dull",
    streak: "N/A (rock)", cleavage: "N/A",
    description: "The bedrock of central Texas. Built from accumulated shells and marine organisms from the ancient inland sea. Often packed with fossils — ammonites, brachiopods, echinoids.",
    distinguishing: "Gray-cream color, often with fossils. FIZZES with acid (vinegar works). Softer than most rocks. The rock everything sits on in Texas.",
  },
  {
    id: 3, name: "Calcite", formula: "CaCO₃",
    class: "Carbonate mineral", photo: svg("#f0ece0","#c0bca8","crystal"),
    colors: ["#f0ece0","#c8c4b0"], swatchLabel: "White · cream · clear",
    formation: "Limestone veins · cave formations · Texas Hill Country",
    hardness: "3 Mohs", luster: "Vitreous to resinous",
    streak: "White", cleavage: "Perfect rhombohedral (3 directions)",
    description: "Lines the veins and geodes in Texas limestone. Found as dogtooth crystals in cave formations and as white veins cutting through gray limestone. Fizzes with acid.",
    distinguishing: "FIZZES with dilute acid. Coin scratches it. Perfect cleavage in 3 directions forming rhombs. White-cream, often clear crystals.",
  },
  {
    id: 4, name: "Agate", formula: "Chalcedony SiO₂",
    class: "Silicate — crypto quartz", photo: svg("#c87848","#904820","banded"),
    colors: ["#c87848","#904820"], swatchLabel: "Red · orange · banded",
    formation: "Big Bend · Marfa · Brewster County TX",
    hardness: "6.5–7 Mohs", luster: "Waxy",
    streak: "White", cleavage: "None — conchoidal fracture",
    description: "Banded chalcedony found in volcanic rocks and gravels across far west Texas. Plume agates, Marfa agates, and Brewster agates are prized collector pieces. Translucent when held to light.",
    distinguishing: "Banded or patterned, waxy sheen, hard (7). Translucent. Found loose in gravel or in volcanic host rock. Texas's most beloved lapidary stone.",
  },
  {
    id: 5, name: "Quartz", formula: "SiO₂",
    class: "Silicate", photo: svg("#e8e4d8","#b0aca0","crystal"),
    colors: ["#e8e4d8","#c0bcb0"], swatchLabel: "White · clear",
    formation: "Igneous · metamorphic · sedimentary — widespread",
    hardness: "7 Mohs", luster: "Vitreous (glassy)",
    streak: "White", cleavage: "None — conchoidal fracture",
    description: "Clear to milky white crystals found in veins, geodes, and gravels everywhere. Ranges from perfectly clear rock crystal to milky white. Common in Texas riverbeds.",
    distinguishing: "Glass-like shine, shell-like fracture. Cannot be scratched by a knife. White streak always. No cleavage.",
  },
  {
    id: 6, name: "Selenite (Gypsum)", formula: "CaSO₄·2H₂O",
    class: "Sulfate mineral", photo: svg("#e8e8d8","#c0c0a8","crystal"),
    colors: ["#e8e8d8","#d0d0b8"], swatchLabel: "Clear · white · silvery",
    formation: "Salt lakes · evaporite beds · Permian Basin TX",
    hardness: "2 Mohs", luster: "Vitreous to pearly",
    streak: "White", cleavage: "Perfect in 3 directions",
    description: "Transparent crystalline gypsum found in the Permian Basin and desert playas. Blades and rosettes of clear crystal. So soft a fingernail scratches it.",
    distinguishing: "Perfectly transparent blades. Fingernail scratches it (hardness 2). Pearly sheen on cleavage surfaces. Found in dry lake beds and evaporite deposits.",
  },
  {
    id: 7, name: "Pyrite", formula: "FeS₂",
    class: "Sulfide", photo: svg("#d4a820","#907008","metallic"),
    colors: ["#d4a820","#a07010"], swatchLabel: "Brass · gold",
    formation: "Sedimentary · hydrothermal · found statewide",
    hardness: "6–6.5 Mohs", luster: "Metallic",
    streak: "Greenish-black", cleavage: "Indistinct",
    description: "Fool's Gold — brassy cubic crystals that deceive. Found in Texas black shales, coal beds, and limestone. Perfect cubic form is unmistakable.",
    distinguishing: "Cubic crystals, metallic brass-yellow. KEY TEST: streak is greenish-black, never gold. Much harder than gold. Cannot be dented with a fingernail.",
  },
  {
    id: 8, name: "Petrified Wood", formula: "SiO₂ (replacement)",
    class: "Silicified organic", photo: svg("#8a6040","#5a3820","layered"),
    colors: ["#8a6040","#5a3820"], swatchLabel: "Brown · tan · gray",
    formation: "East Texas · Catahoula Formation · riverbeds",
    hardness: "6.5–7 Mohs", luster: "Waxy to dull",
    streak: "White", cleavage: "None",
    description: "Wood replaced by silica over millions of years. Common in East Texas gravels and riverbeds. Original wood grain and rings often perfectly preserved in stone.",
    distinguishing: "Looks like wood, feels like rock. Grain patterns visible. Hard — won't scratch with a knife. Found in rivers and gravel bars. Brown-gray-tan.",
  },
  {
    id: 9, name: "Malachite", formula: "Cu₂(CO₃)(OH)₂",
    class: "Carbonate mineral", photo: svg("#2a7a3a","#185028","banded"),
    colors: ["#2a7a3a","#1a5028"], swatchLabel: "Vivid green · banded",
    formation: "Copper deposits — far west Texas",
    hardness: "3.5–4 Mohs", luster: "Vitreous to silky",
    streak: "Pale green", cleavage: "Perfect",
    description: "Vivid banded green copper mineral found near copper deposits in far west Texas. Swirling light-and-dark green patterns are unmistakable. Always marks a copper zone.",
    distinguishing: "Intense banded green — no other common mineral matches this. Soft (knife cuts it easily). Always found near copper ore.",
  },
  {
    id: 10, name: "Cinnabar", formula: "HgS",
    class: "Sulfide", photo: svg("#c82020","#901010","smooth"),
    colors: ["#c82020","#901010"], swatchLabel: "Bright red · scarlet",
    formation: "Terlingua Mining District — Big Bend TX",
    hardness: "2–2.5 Mohs", luster: "Adamantine to dull",
    streak: "Scarlet-red", cleavage: "Perfect",
    description: "Brilliant scarlet mercury ore — Terlingua was once the world's third-largest mercury mining district. Intensely red, very heavy. Handle minimally — mercury compound.",
    distinguishing: "Bright scarlet-red, very heavy for its size. Streak is also red (diagnostic). Very soft. Found only in the Terlingua-Big Bend area of Texas.",
  },
  {
    id: 11, name: "Turquoise", formula: "CuAl₆(PO₄)₄(OH)₈",
    class: "Phosphate mineral", photo: svg("#38a0a8","#1a7880","smooth"),
    colors: ["#38a0a8","#1a7880"], swatchLabel: "Sky blue · blue-green",
    formation: "Copper-aluminum desert zones",
    hardness: "5–6 Mohs", luster: "Waxy to dull",
    streak: "White to pale green", cleavage: "None",
    description: "Iconic sky-blue to blue-green stone of the desert Southwest. Forms where copper deposits weather alongside aluminum-rich rock. Prized in jewelry for at least 6,000 years.",
    distinguishing: "Unmistakable blue-green waxy appearance — not glassy. Often veined with black limonite. Found only in dry desert copper country.",
  },
  {
    id: 12, name: "Celestite", formula: "SrSO₄",
    class: "Sulfate mineral", photo: svg("#a0c0e0","#6090c0","crystal"),
    colors: ["#a0c0e0","#6090c0"], swatchLabel: "Pale blue · white",
    formation: "Evaporite beds — west Texas",
    hardness: "3–3.5 Mohs", luster: "Vitreous",
    streak: "White", cleavage: "Perfect",
    description: "Sky-blue to white strontium sulfate crystals found in evaporite and limestone sequences in west Texas. Delicate tabular crystals. Named for its celestial blue color.",
    distinguishing: "Pale blue or white tabular crystals. Soft (coin scratches). Heavier than it looks (strontium). Vitreous luster. Found in evaporite beds.",
  },
  {
    id: 13, name: "Sandstone", formula: "Quartz grains + cement",
    class: "Sedimentary rock", photo: svg("#d8a858","#a07830","layered"),
    colors: ["#d8a858","#b08038"], swatchLabel: "Tan · red · orange",
    formation: "Cretaceous outcrops — statewide",
    hardness: "6–7 Mohs", luster: "Granular",
    streak: "N/A (rock)", cleavage: "N/A",
    description: "Tan-to-red cemented sand grains exposed in riverbanks and canyons across Texas. Cross-bedding visible from ancient dunes and river deltas. Common building stone.",
    distinguishing: "Gritty sandpaper texture — individual grains visible to the eye. Layered. Tan-red-orange. Found in cuts and river exposures.",
  },
  {
    id: 14, name: "Obsidian", formula: "Volcanic glass",
    class: "Mineraloid", photo: svg("#1a1810","#302e28","smooth"),
    colors: ["#1a1810","#383630"], swatchLabel: "Black · glassy",
    formation: "Volcanic zones — Trans-Pecos TX",
    hardness: "5–5.5 Mohs", luster: "Vitreous",
    streak: "White", cleavage: "None — conchoidal fracture",
    description: "Natural volcanic glass from Trans-Pecos volcanic fields. Razor-sharp edges when broken — ancient peoples traded it widely for blades. Black and glassy.",
    distinguishing: "Jet black, perfectly glassy, sharp curved fracture. Slightly softer than quartz. Found near volcanic outcrops in far west Texas.",
  },
  {
    id: 15, name: "Fluorite", formula: "CaF₂",
    class: "Halide mineral", photo: svg("#7080d8","#4050a0","crystal"),
    colors: ["#7080d8","#4858a8"], swatchLabel: "Purple · blue · green",
    formation: "Hydrothermal veins — Big Bend, Brewster Co.",
    hardness: "4 Mohs (exact)", luster: "Vitreous",
    streak: "White", cleavage: "Perfect octahedral (4 directions)",
    description: "Colorful calcium fluoride found in hydrothermal veins in the Trans-Pecos. Purple, green, blue, clear. Many specimens glow blue-purple under UV light.",
    distinguishing: "Perfect cube-like cleavage. Hardness exactly 4 (coin won't scratch, knife will). Any color. Many glow strongly under UV. The rainbow mineral.",
  },
  {
    id: 16, name: "Galena", formula: "PbS",
    class: "Sulfide", photo: svg("#70707c","#484850","speckle"),
    colors: ["#70707c","#484850"], swatchLabel: "Silver-gray · metallic",
    formation: "Hydrothermal veins — Presidio, Brewster counties TX",
    hardness: "2.5 Mohs", luster: "Metallic (bright)",
    streak: "Lead-gray", cleavage: "Perfect cubic",
    description: "Lead ore — bright silver-gray with perfect cubic cleavage. Extremely heavy for its size. The primary lead ore mineral, found in west Texas mining districts.",
    distinguishing: "Very bright silver-gray metallic luster. Perfect cubic cleavage — breaks into small cubes. Very heavy (lead density). Soft — fingernail nearly scratches.",
  },
  {
    id: 17, name: "Amethyst", formula: "SiO₂ (quartz var.)",
    class: "Silicate", photo: svg("#7a4a9a","#3e1e60","crystal"),
    colors: ["#8a5aaa","#5a3080"], swatchLabel: "Purple · violet",
    formation: "Geodes in limestone — Texas riverbeds",
    hardness: "7 Mohs", luster: "Vitreous",
    streak: "White", cleavage: "None — conchoidal fracture",
    description: "Purple quartz found lining geodes in Texas limestone. Rio Grande riverbeds produce geodes containing amethyst points. Color from iron impurities.",
    distinguishing: "Deep purple-violet, glass-like fracture. Color never fades. Often found inside geodes. Cannot be scratched by a knife.",
  },
  {
    id: 18, name: "Granite", formula: "Quartz + Feldspar + Mica",
    class: "Igneous rock", photo: svg("#8a7a70","#584840","speckle"),
    colors: ["#9a8880","#c0a090"], swatchLabel: "Gray · pink · speckled",
    formation: "Llano Uplift — central Texas basement",
    hardness: "6–7 Mohs", luster: "Crystalline",
    streak: "N/A (rock)", cleavage: "N/A",
    description: "The Precambrian basement of Texas exposed in the Llano Uplift. Pink and gray speckled, coarse-grained. The Rock of Ages — some Texas granite is 1.1 billion years old.",
    distinguishing: "Visible interlocking crystals with no layering. Speckled pink-gray-black. Very hard. Found in the Llano Uplift counties (Mason, Llano, Gillespie).",
  },
];

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  stone:     "#18160f",
  amber:     "#b87c38",
  parchment: "#f0ead6",
  slate:     "#7a8878",
  cream:     "#faf7f0",
  dim:       "#5a5248",
  border:    "#d0c8b8",
};

// ── RockCard ──────────────────────────────────────────────────────────────────
function RockCard({ rock, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.cream, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${C.border}`, cursor: "pointer", marginBottom: 12,
      boxShadow: "0 1px 4px rgba(24,22,15,0.10)",
    }}>
      <img src={rock.photo} alt={rock.name}
        style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
      <div style={{ height: 4, background: `linear-gradient(to right, ${rock.colors[0]}, ${rock.colors[1]})` }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 17, color: C.stone, fontWeight: 600, marginBottom: 2 }}>
          {rock.name}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: C.amber, fontStyle: "italic", marginBottom: 8 }}>
          {rock.formula}
        </div>
        <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, margin: "0 0 8px" }}>
          {rock.description}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[rock.swatchLabel, rock.hardness].map((t, i) => (
            <span key={i} style={{
              background: "#ede8df", borderRadius: 20, padding: "2px 10px",
              fontSize: 11, fontFamily: "monospace", color: C.dim,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── RockDetail ────────────────────────────────────────────────────────────────
function RockDetail({ rock, onBack, onAdd, inHaul }) {
  return (
    <div style={{ paddingBottom: 40 }}>
      <button type="button" onClick={onBack} style={{
        background: "none", border: "none", color: C.slate,
        fontFamily: "monospace", fontSize: 12, cursor: "pointer",
        padding: "0 0 12px", letterSpacing: "0.08em",
      }}>← catalog</button>
      <img src={rock.photo} alt={rock.name}
        style={{ width: "100%", borderRadius: 14, marginBottom: 12, display: "block", maxHeight: 240, objectFit: "cover" }} />
      <div style={{ height: 6, background: `linear-gradient(to right, ${rock.colors[0]}, ${rock.colors[1]})`, borderRadius: 3, marginBottom: 14 }} />
      <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, color: C.stone, fontWeight: 600, marginBottom: 3 }}>
        {rock.name}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: C.amber, fontStyle: "italic", marginBottom: 12 }}>
        {rock.formula} · {rock.class}
      </div>
      <p style={{ fontSize: 14, color: C.stone, lineHeight: 1.7, marginBottom: 12 }}>
        {rock.description}
      </p>
      <div style={{ background: "#ede8df", borderRadius: 10, padding: "11px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: C.slate, letterSpacing: "0.12em", marginBottom: 5 }}>
          HOW TO IDENTIFY
        </div>
        <p style={{ fontSize: 13, color: C.stone, lineHeight: 1.6, margin: 0 }}>
          {rock.distinguishing}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          ["Formation", rock.formation],
          ["Hardness",  rock.hardness],
          ["Luster",    rock.luster],
          ["Streak",    rock.streak],
          ["Cleavage",  rock.cleavage],
        ].map(([k, v]) => (
          <div key={k} style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 12px" }}>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: C.slate, letterSpacing: "0.1em", marginBottom: 2 }}>
              {k.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: C.stone }}>{v}</div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} style={{
        width: "100%", background: inHaul ? "#ede8df" : C.slate,
        color: inHaul ? C.dim : C.cream, border: "none",
        borderRadius: 24, padding: "12px", fontFamily: "'Georgia', serif",
        fontStyle: "italic", fontSize: 15, cursor: "pointer",
      }}>
        {inHaul ? "✓ in your haul" : "+ add to haul"}
      </button>
    </div>
  );
}

// ── ScanTab — camera → color vector → offline match ──────────────────────────
function ScanTab({ onSelectRock }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [phase,   setPhase]   = useState("idle"); // idle | live | results
  const [matches, setMatches] = useState([]);
  const [preview, setPreview] = useState(null);
  const [err,     setErr]     = useState(null);

  async function startCamera() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setPhase("live");
    } catch (e) {
      setErr("Camera error: " + e.message);
    }
  }

  function capture() {
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width  = v.videoWidth  || 320;
    c.height = v.videoHeight || 240;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0);
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    const vec = extractColorVec(imageData);
    const ranked = rankByColor(vec);
    setPreview(c.toDataURL("image/jpeg", 0.7));
    setMatches(ranked.slice(0, 6));
    // Stop camera stream
    try { v.srcObject.getTracks().forEach(function(t){ t.stop(); }); } catch(e){}
    setPhase("results");
  }

  function reset() {
    setPreview(null);
    setMatches([]);
    setPhase("idle");
  }

  // Score bar width: best match = 100%, others scaled by distance ratio
  function scoreWidth(dist) {
    if (matches.length === 0) return 0;
    var best = matches[0].dist;
    var worst = matches[matches.length - 1].dist;
    var range = worst - best || 1;
    return Math.round(100 * (1 - (dist - best) / range));
  }

  return (
    <div style={{ padding: 16 }}>

      {phase === "idle" && (
        <>
          <div style={{
            background: "#ede8df", borderRadius: 14, padding: "18px 16px", marginBottom: 16,
            fontFamily: "monospace", fontSize: 11, color: C.dim, lineHeight: 1.8, letterSpacing: "0.04em",
          }}>
            <div style={{ color: C.amber, fontWeight: 700, marginBottom: 6 }}>HOW IT WORKS</div>
            Point camera at your specimen → tap match →<br/>
            color spectrum extracted offline →<br/>
            closest specimens ranked by color distance.<br/>
            No internet. No model. Pure math.
          </div>
          <button type="button" onClick={startCamera} style={{
            width: "100%", background: C.stone, color: C.parchment,
            border: `2px solid ${C.amber}`, borderRadius: 24, padding: "14px",
            fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 17,
            cursor: "pointer", letterSpacing: "0.04em",
          }}>
            open camera
          </button>
          {err && (
            <div style={{ marginTop: 12, color: "#e87070", fontFamily: "monospace", fontSize: 11 }}>
              {err}
            </div>
          )}
        </>
      )}

      {phase === "live" && (
        <div>
          <div style={{
            fontFamily: "monospace", fontSize: 10, color: C.amber,
            letterSpacing: "0.14em", marginBottom: 8, textAlign: "center",
          }}>
            POINT AT SPECIMEN · FILL FRAME
          </div>
          <video ref={videoRef} playsInline style={{
            width: "100%", borderRadius: 14, display: "block",
            border: `2px solid ${C.amber}`,
          }} />
          <button type="button" onClick={capture} style={{
            width: "100%", marginTop: 12, background: C.amber,
            color: C.stone, border: "none", borderRadius: 24, padding: "14px",
            fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 17,
            cursor: "pointer", fontWeight: 700,
          }}>
            match this specimen
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {phase === "results" && (
        <div>
          {preview && (
            <img src={preview} alt="captured"
              style={{ width: "100%", borderRadius: 12, marginBottom: 4, display: "block" }} />
          )}
          <div style={{
            fontFamily: "monospace", fontSize: 9, color: C.dim,
            letterSpacing: "0.1em", marginBottom: 14, textAlign: "center",
          }}>
            COLOR SPECTRUM MATCH — OFFLINE ANALYSIS
          </div>

          {matches.map(function(m, i) {
            var w = scoreWidth(m.dist);
            return (
              <div key={m.rock.id} onClick={function(){ onSelectRock(m.rock.id); }}
                style={{
                  background: i === 0 ? C.cream : "#f5f1eb",
                  border: i === 0 ? `2px solid ${C.amber}` : `1px solid ${C.border}`,
                  borderRadius: 14, padding: "10px 14px", marginBottom: 8, cursor: "pointer",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(135deg, ${m.rock.colors[0]}, ${m.rock.colors[1]})`,
                    border: `1px solid ${C.border}`,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Georgia', serif", fontSize: 15, color: C.stone, fontWeight: 600 }}>
                      {i === 0 ? "🏆 " : (i+1) + ". "}{m.rock.name}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: C.dim }}>
                      {m.rock.swatchLabel}
                    </div>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: i === 0 ? C.amber : C.dim, textAlign: "right" }}>
                    {w}%
                  </div>
                </div>
                {/* Match bar */}
                <div style={{ background: "#e8e2d8", borderRadius: 4, height: 4, overflow: "hidden" }}>
                  <div style={{
                    width: w + "%", height: "100%",
                    background: i === 0 ? C.amber : C.slate,
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            );
          })}

          <button type="button" onClick={reset} style={{
            width: "100%", marginTop: 8, background: "none",
            color: C.slate, border: `1px solid ${C.border}`, borderRadius: 24,
            padding: "10px", fontFamily: "monospace", fontSize: 12, cursor: "pointer",
          }}>
            scan again
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RockHound() {
  const [tab,      setTab]      = useState("browse");
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [haul,     setHaul]     = useState([]);

  const filtered = ROCKS.filter(function(r) {
    var q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) ||
           r.class.toLowerCase().includes(q) ||
           r.swatchLabel.toLowerCase().includes(q) ||
           r.luster.toLowerCase().includes(q);
  });

  function addToHaul(rock) {
    if (!haul.find(function(r){ return r.id === rock.id; })) {
      setHaul(function(prev){ return [{ ...rock, foundAt: new Date().toLocaleDateString() }, ...prev]; });
    }
  }

  const activeRock = selected ? ROCKS.find(function(r){ return r.id === selected; }) : null;

  if (activeRock) {
    return (
      <div style={{ minHeight: "100vh", background: C.parchment, padding: "28px 16px 0" }}>
        <RockDetail
          rock={activeRock}
          onBack={function(){ setSelected(null); }}
          onAdd={function(){ addToHaul(activeRock); }}
          inHaul={!!haul.find(function(r){ return r.id === activeRock.id; })}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.parchment, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: C.stone, padding: "32px 20px 20px", borderBottom: `3px solid ${C.amber}` }}>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: C.amber, letterSpacing: "0.2em", marginBottom: 6 }}>
          TEXAS ROCKS &amp; MINERALS
        </div>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 26, color: C.parchment, fontStyle: "italic" }}>
          Rock Hound
        </div>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: `${C.slate}cc`, marginTop: 4 }}>
          {ROCKS.length} specimens · scan to match offline
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.stone, borderBottom: `1px solid ${C.dim}` }}>
        {[["scan","🔍 Scan"],["browse","Browse"],["haul","My Haul"]].map(function([id, label]) {
          return (
            <button type="button" key={id} onClick={function(){ setTab(id); setSearch(""); }} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: tab === id ? `2px solid ${C.amber}` : "2px solid transparent",
              color: tab === id ? C.amber : `${C.parchment}66`,
              padding: "10px 0", fontFamily: "monospace", fontSize: 10,
              letterSpacing: "0.06em", cursor: "pointer",
            }}>{label}</button>
          );
        })}
      </div>

      <div style={{ padding: tab === "scan" ? 0 : "16px" }}>

        {tab === "scan" && (
          <ScanTab onSelectRock={function(id){ setSelected(id); }} />
        )}

        {tab === "browse" && (
          <>
            <input value={search} onChange={function(e){ setSearch(e.target.value); }}
              placeholder="search by name, color, luster..."
              style={{
                width: "100%", background: C.cream, border: `1px solid ${C.border}`,
                borderRadius: 24, padding: "10px 16px", color: C.stone,
                fontFamily: "monospace", fontSize: 13, outline: "none",
                marginBottom: 16, boxSizing: "border-box",
              }} />
            {filtered.map(function(r) {
              return <RockCard key={r.id} rock={r} onClick={function(){ setSelected(r.id); }} />;
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", color: C.dim, fontFamily: "'Georgia', serif", fontStyle: "italic", marginTop: 40 }}>
                no specimens match
              </div>
            )}
          </>
        )}

        {tab === "haul" && (
          haul.length === 0 ? (
            <div style={{ textAlign: "center", color: C.dim, marginTop: 48, fontFamily: "'Georgia', serif", fontStyle: "italic", lineHeight: 2 }}>
              nothing in your haul yet —<br />open a specimen and add it
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: C.dim, letterSpacing: "0.12em", marginBottom: 12 }}>
                {haul.length} SPECIMEN{haul.length !== 1 ? "S" : ""} COLLECTED
              </div>
              {haul.map(function(r) {
                return (
                  <div key={r.id}>
                    <RockCard rock={r} onClick={function(){ setSelected(r.id); }} />
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: C.dim, marginTop: -8, marginBottom: 12, paddingLeft: 4 }}>
                      found {r.foundAt}
                    </div>
                  </div>
                );
              })}
            </>
          )
        )}
      </div>
    </div>
  );
}
