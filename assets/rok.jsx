import { useState } from "react";

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
      + [0,1,2,3,4,5].map(function(i){ return '<rect x="0" y="' + (i*40) + '" width="400" height="22" fill="' + c1 + '" opacity="0.82"/>'; }).join('')
      + '<rect x="0" y="0" width="400" height="240" fill="' + c1 + '" opacity="0.05"/>';
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
      + '<line x1="70" y1="0" x2="400" y2="170" stroke="white" stroke-width="1" opacity="0.22"/>'
      + '<line x1="180" y1="0" x2="400" y2="130" stroke="white" stroke-width="0.5" opacity="0.15"/>';
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

// ── Rock & mineral data ───────────────────────────────────────────────────────
const ROCKS = [
  {
    id: 1, name: "Quartz", formula: "SiO₂",
    class: "Silicate", photo: svg("#e8e4d8","#b0aca0","crystal"),
    colors: ["#e8e4d8","#c0bcb0"], swatchLabel: "White · clear",
    formation: "Igneous · metamorphic · sedimentary",
    hardness: "7 Mohs", luster: "Vitreous (glassy)",
    streak: "White", cleavage: "None — conchoidal fracture",
    description: "The most abundant mineral in Earth’s continental crust. Found in nearly every geological environment — from granite to beach sand to desert dunes.",
    distinguishing: "Glass-like shine, breaks with curved shell-like (conchoidal) fracture. Cannot be scratched by a knife or steel file. Always white streak regardless of body color.",
  },
  {
    id: 2, name: "Amethyst", formula: "SiO₂ (quartz var.)",
    class: "Silicate", photo: svg("#7a4a9a","#3e1e60","crystal"),
    colors: ["#8a5aaa","#5a3080"], swatchLabel: "Purple · violet",
    formation: "Geodes · hydrothermal veins",
    hardness: "7 Mohs", luster: "Vitreous (glassy)",
    streak: "White", cleavage: "None — conchoidal fracture",
    description: "The purple variety of quartz, colored by iron impurities under natural radiation. Found lining geodes — hollow rock cavities often from volcanic bubbles.",
    distinguishing: "Deep purple-violet, glass-like fracture. Color never fades. Often forms pointed crystal clusters. Same hardness as quartz — cannot be scratched by a knife.",
  },
  {
    id: 3, name: "Rose Quartz", formula: "SiO₂ (quartz var.)",
    class: "Silicate", photo: svg("#e8a0b8","#b06080","smooth"),
    colors: ["#e8a0b8","#c07090"], swatchLabel: "Pink · rose",
    formation: "Pegmatites · hydrothermal veins",
    hardness: "7 Mohs", luster: "Vitreous",
    streak: "White", cleavage: "None — conchoidal fracture",
    description: "The pink variety of quartz. Color from trace titanium or manganese. Usually massive rather than crystalline. Cloudy, translucent pink is distinctive.",
    distinguishing: "Cloudy soft pink with no individual crystal points. Same hardness as quartz. Translucent to opaque. Nothing else has this exact dusty-rose appearance.",
  },
  {
    id: 4, name: "Pyrite", formula: "FeS₂",
    class: "Sulfide", photo: svg("#d4a820","#907008","metallic"),
    colors: ["#d4a820","#a07010"], swatchLabel: "Brass · gold",
    formation: "Sedimentary · metamorphic · hydrothermal",
    hardness: "6–6.5 Mohs", luster: "Metallic",
    streak: "Greenish-black", cleavage: "Indistinct",
    description: "Fool’s Gold. Shiny brassy-yellow crystals that have tricked prospectors for centuries. Perfect cubic crystals and pyritohedrons are signature forms.",
    distinguishing: "Cubic or striated crystals, brass-yellow metallic shine. KEY TEST: streak is greenish-black, never gold. Harder than real gold and much lighter. Cannot be scratched by a fingernail.",
  },
  {
    id: 5, name: "Obsidian", formula: "Volcanic glass",
    class: "Mineraloid", photo: svg("#1a1810","#302e28","smooth"),
    colors: ["#1a1810","#383630"], swatchLabel: "Black · glassy",
    formation: "Volcanic — rapid lava cooling",
    hardness: "5–5.5 Mohs", luster: "Vitreous",
    streak: "White", cleavage: "None — conchoidal fracture",
    description: "Natural volcanic glass. Forms when lava cools too quickly for crystals to grow. Produces razor-sharp edges when fractured — ancient peoples used it for blades and arrowheads.",
    distinguishing: "Jet black, perfectly glassy surface and fracture. Sharp curved fracture like broken bottle glass. Slightly softer than quartz. Always found near volcanic zones.",
  },
  {
    id: 6, name: "Calcite", formula: "CaCO₃",
    class: "Carbonate", photo: svg("#f0ece0","#c0bca8","crystal"),
    colors: ["#f0ece0","#c8c4b0"], swatchLabel: "White · cream",
    formation: "Sedimentary · caves · hydrothermal",
    hardness: "3 Mohs", luster: "Vitreous to resinous",
    streak: "White", cleavage: "Perfect rhombohedral (3 directions)",
    description: "The primary mineral in limestone and marble. Forms stalactites, stalagmites, and cave formations. One of the most common minerals on Earth. Reacts to acid with fizzing.",
    distinguishing: "FIZZES with dilute acid (vinegar works) — the definitive field test. Soft: coin easily scratches it. Perfect rhombohedral cleavage. Found in limestone, marble, chalk.",
  },
  {
    id: 7, name: "Malachite", formula: "Cu₂(CO₃)(OH)₂",
    class: "Carbonate", photo: svg("#2a7a3a","#185028","banded"),
    colors: ["#2a7a3a","#1a5028"], swatchLabel: "Vivid green · banded",
    formation: "Oxidation zones of copper deposits",
    hardness: "3.5–4 Mohs", luster: "Vitreous to silky",
    streak: "Pale green", cleavage: "Perfect",
    description: "Vivid banded green copper mineral. Swirling light-and-dark green concentric patterns are unmistakable. Always found where copper ore has been exposed to air and water.",
    distinguishing: "Intense banded or swirling green — no other common mineral looks like this. Soft enough that a knife cuts it easily. Always marks a copper deposit nearby.",
  },
  {
    id: 8, name: "Fluorite", formula: "CaF₂",
    class: "Halide", photo: svg("#7080d8","#4050a0","crystal"),
    colors: ["#7080d8","#4858a8"], swatchLabel: "Purple · blue · any",
    formation: "Hydrothermal veins · sedimentary",
    hardness: "4 Mohs (exact)", luster: "Vitreous",
    streak: "White", cleavage: "Perfect octahedral (4 directions)",
    description: "Comes in nearly every color — purple, green, blue, yellow, clear. Many specimens glow blue or purple under UV light. Fluorescence itself is named after this mineral.",
    distinguishing: "Perfect cube-like cleavage. Hardness exactly 4 (scratched by knife, not by coin). Any color. Many glow strongly under UV light. The rainbow mineral.",
  },
  {
    id: 9, name: "Feldspar", formula: "KAlSi₃O₈",
    class: "Silicate", photo: svg("#d8b898","#a88060","speckle"),
    colors: ["#d8b898","#b89878"], swatchLabel: "Pink · salmon · white",
    formation: "Igneous · metamorphic",
    hardness: "6 Mohs", luster: "Vitreous to pearly",
    streak: "White", cleavage: "Perfect in 2 directions at 90°",
    description: "The most abundant mineral group in Earth’s crust. The pink-salmon speckles that give granite its color. Comes as orthoclase (pink) and plagioclase (white-gray) varieties.",
    distinguishing: "Two flat cleavage planes at right angles. Pearly sheen on cleavage surfaces. Pink or cream color in orthoclase. Dominant mineral of granite and continental rocks.",
  },
  {
    id: 10, name: "Mica", formula: "KAl₂(AlSi₃O₁₀)(OH)₂",
    class: "Silicate", photo: svg("#c8c4a0","#90907a","layered"),
    colors: ["#c8c4a0","#a0a080"], swatchLabel: "Silver · gold · clear",
    formation: "Igneous · metamorphic",
    hardness: "2–2.5 Mohs", luster: "Pearly",
    streak: "White", cleavage: "Perfect basal — splits into sheets",
    description: "The glittery silver mineral that forms the sparkle in granite and schist. Splits into thin, flexible, transparent sheets — used as windows before glass existed.",
    distinguishing: "Splits into elastic, transparent, flat sheets. Silver-gold shimmer. Very soft — fingernail can scratch it. The sparkle in rocks.",
  },
  {
    id: 11, name: "Turquoise", formula: "CuAl₆(PO₄)₄(OH)₈",
    class: "Phosphate", photo: svg("#38a0a8","#1a7880","smooth"),
    colors: ["#38a0a8","#1a7880"], swatchLabel: "Sky blue · blue-green",
    formation: "Desert copper deposits — weathering + aluminum",
    hardness: "5–6 Mohs", luster: "Waxy to dull",
    streak: "White to pale green", cleavage: "None",
    description: "The iconic sky-blue to blue-green stone of arid regions. Forms where copper deposits weather alongside aluminum-rich rock. Prized in jewelry for at least 6,000 years.",
    distinguishing: "Unmistakable blue-green waxy appearance. Not glassy — waxy or dull. Often veined with black or brown limonite matrix. Found only in dry desert copper country.",
  },
  {
    id: 12, name: "Granite", formula: "Quartz + Feldspar + Mica",
    class: "Igneous rock", photo: svg("#8a7a70","#584840","speckle"),
    colors: ["#9a8880","#c0a090"], swatchLabel: "Gray · pink · speckled",
    formation: "Intrusive igneous — slow cooling deep underground",
    hardness: "6–7 Mohs", luster: "Crystalline",
    streak: "N/A (rock)", cleavage: "N/A — interlocking crystals",
    description: "The bedrock of continents. Coarse-grained, with visible interlocking crystals of pink feldspar, white-gray quartz, and glittery mica. The rock of mountains and monuments.",
    distinguishing: "Visible crystals interlocked with no layering. Speckled pink-gray-black pattern. Very hard. The defining rock of continental crust.",
  },
  {
    id: 13, name: "Basalt", formula: "Pyroxene + Plagioclase",
    class: "Igneous rock", photo: svg("#302e28","#1a1810","smooth"),
    colors: ["#302e28","#201e18"], swatchLabel: "Dark gray · black",
    formation: "Extrusive igneous — volcanic lava flows",
    hardness: "5–6 Mohs", luster: "Dull to glassy",
    streak: "N/A (rock)", cleavage: "N/A",
    description: "The dark volcanic rock that covers most of the ocean floor and forms the Hawaiian islands. Dense and fine-grained — crystals too small to see without magnification.",
    distinguishing: "Very dark gray to black, heavy, fine-grained with no visible crystals. Often has small holes (vesicles) from trapped gas bubbles. Found near volcanoes and coastlines.",
  },
  {
    id: 14, name: "Sandstone", formula: "Quartz grains + cement",
    class: "Sedimentary rock", photo: svg("#d8a858","#a07830","layered"),
    colors: ["#d8a858","#b08038"], swatchLabel: "Tan · red · orange",
    formation: "Cemented and compressed sand grains",
    hardness: "6–7 Mohs", luster: "Granular",
    streak: "N/A (rock)", cleavage: "N/A",
    description: "Ancient sand grains compressed and cemented into rock. Cross-bedding layers reveal ancient dunes or riverbeds. The red-orange canyons of the American Southwest are carved from this.",
    distinguishing: "Gritty sandpaper texture — individual grains visible. Layered structure. Tan-red-orange color from iron staining. Found in canyons, deserts, ancient sea floors.",
  },
  {
    id: 15, name: "Limestone", formula: "CaCO₃ (marine origin)",
    class: "Sedimentary rock", photo: svg("#c8c0b0","#a09888","layered"),
    colors: ["#c8c0b0","#a09888"], swatchLabel: "Gray · cream · tan",
    formation: "Accumulated shells and marine organisms",
    hardness: "3 Mohs", luster: "Dull",
    streak: "N/A (rock)", cleavage: "N/A",
    description: "Built from accumulated shells, coral, and marine organism remains over millions of years. Often contains visible fossils. Forms the world’s cave systems and karst landscapes.",
    distinguishing: "Gray-cream color, often with visible fossils. FIZZES with acid — same calcite test as the mineral. Softer than most rocks. The fossil rock.",
  },
  {
    id: 16, name: "Slate", formula: "Compressed shale",
    class: "Metamorphic rock", photo: svg("#484e58","#303540","layered"),
    colors: ["#505860","#383e48"], swatchLabel: "Dark gray · blue-gray",
    formation: "Metamorphic — shale under heat and pressure",
    hardness: "3.5 Mohs", luster: "Silky on split surfaces",
    streak: "N/A (rock)", cleavage: "Perfect slaty cleavage",
    description: "Shale that has been slightly metamorphosed. Splits perfectly into thin flat plates — used for roofing tiles for centuries. Silky sheen on freshly split surfaces.",
    distinguishing: "Splits cleanly into thin flat plates (slaty cleavage). Dark gray-blue-purple color. Silky sheen when fresh-split. Found in mountain ranges and ancient seabeds.",
  },
  {
    id: 17, name: "Pumice", formula: "Frothy volcanic glass",
    class: "Volcanic rock", photo: svg("#b8b0a0","#908880","porous"),
    colors: ["#b8b0a0","#908880"], swatchLabel: "Light gray · white",
    formation: "Volcanic — frothy lava spray",
    hardness: "~6 Mohs", luster: "Dull",
    streak: "N/A (rock)", cleavage: "N/A",
    description: "Frozen volcanic foam. So porous it floats on water. The lightest natural rock by far. Used as an abrasive for skin and surfaces for thousands of years.",
    distinguishing: "Impossibly light and porous — looks and feels like a gray sponge. Floats on water. Light gray to white. Found on volcanic beaches and near eruption sites. The only rock that floats.",
  },
  {
    id: 18, name: "Flint", formula: "Cryptocrystalline SiO₂",
    class: "Siliceous sedimentary", photo: svg("#5a5048","#382e28","smooth"),
    colors: ["#5a5048","#3a3028"], swatchLabel: "Dark gray · brown · black",
    formation: "Biogenic silica nodules in limestone",
    hardness: "7 Mohs", luster: "Waxy",
    streak: "White", cleavage: "None — sharp conchoidal fracture",
    description: "Very fine-grained silica found as nodules inside limestone. Sparks when struck with steel. Used for arrowheads, blades, and fire-starting for hundreds of thousands of years.",
    distinguishing: "Very hard (7), dark gray-brown-black, waxy sheen. Found as rounded nodules INSIDE limestone layers. Sharp curved fracture produces cutting edges used by ancient humans.",
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
          {rock.formula} · {rock.class}
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

// ── Main component ────────────────────────────────────────────────────────────
export default function RockHound() {
  const [tab,        setTab]        = useState("browse");
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [haul,       setHaul]       = useState([]);

  const filtered = ROCKS.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.class.toLowerCase().includes(search.toLowerCase()) ||
    r.swatchLabel.toLowerCase().includes(search.toLowerCase()) ||
    r.luster.toLowerCase().includes(search.toLowerCase())
  );

  function addToHaul(rock) {
    if (!haul.find(r => r.id === rock.id)) {
      setHaul(prev => [{ ...rock, foundAt: new Date().toLocaleDateString() }, ...prev]);
    }
  }

  const activeRock = selected ? ROCKS.find(r => r.id === selected) : null;

  if (activeRock) {
    return (
      <div style={{ minHeight: "100vh", background: C.parchment, padding: "28px 16px 0" }}>
        <RockDetail
          rock={activeRock}
          onBack={() => setSelected(null)}
          onAdd={() => addToHaul(activeRock)}
          inHaul={!!haul.find(r => r.id === activeRock.id)}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.parchment, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: C.stone, padding: "32px 20px 20px", borderBottom: `3px solid ${C.amber}` }}>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: C.amber, letterSpacing: "0.2em", marginBottom: 6 }}>
          ROCK &amp; MINERAL FIELD GUIDE
        </div>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 26, color: C.parchment, fontStyle: "italic" }}>
          Rock Hound
        </div>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: `${C.slate}cc`, marginTop: 4 }}>
          {ROCKS.length} specimens · identify by color, luster &amp; streak
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.stone, borderBottom: `1px solid ${C.dim}` }}>
        {[["browse","Browse"],["haul","My Haul"]].map(([id, label]) => (
          <button type="button" key={id} onClick={() => setTab(id)} style={{
            flex: 1, background: "none", border: "none",
            borderBottom: tab === id ? `2px solid ${C.amber}` : "2px solid transparent",
            color: tab === id ? C.amber : `${C.parchment}66`,
            padding: "10px 0", fontFamily: "monospace", fontSize: 11,
            letterSpacing: "0.08em", cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>
        {tab === "browse" && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="search by name, color, luster..."
              style={{
                width: "100%", background: C.cream, border: `1px solid ${C.border}`,
                borderRadius: 24, padding: "10px 16px", color: C.stone,
                fontFamily: "monospace", fontSize: 13, outline: "none",
                marginBottom: 16, boxSizing: "border-box",
              }} />
            {filtered.map(r => (
              <RockCard key={r.id} rock={r} onClick={() => setSelected(r.id)} />
            ))}
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
              {haul.map(r => (
                <div key={r.id}>
                  <RockCard rock={r} onClick={() => setSelected(r.id)} />
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: C.dim, marginTop: -8, marginBottom: 12, paddingLeft: 4 }}>
                    found {r.foundAt}
                  </div>
                </div>
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
}
