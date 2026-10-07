import { rewardFor } from "./engine.js";

const symbols = {
  helmet: "M5 17V10a7 7 0 0 1 14 0v7l-5 3v-7h-4v7z M5 11h14",
  chest: "M7 3 3 7l3 4v9h12v-9l3-4-4-4-5 3z",
  boots: "M5 3h6v11l3 3v4H3v-5z M15 3h5v11l2 3v4h-6",
  gloves: "M7 12V5l3-2 2 3 2-2 3 3v10l-5 5-7-6V9z",
  shoulders: "M2 14 4 7l6-3 2 6 2-6 6 3 2 7-7 3-3-7-3 7z",
  belt: "M2 8h20v8H2z M9 6h6v12H9z",
  cape: "M8 3h8l6 18-10-3-10 3z",
  shield: "M12 2 3 6v7q0 6 9 9 9-3 9-9V6z M12 6v11 M7 10h10",
  weapon: "m4 3 14 12-3 3L3 4z M12 19l7-7 M17 17l4 4",
  amulet: "m12 10 5 6-5 6-5-6z M5 2q0 13 7 8 7 5 7-8",
};
export function itemIcon(slot) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${symbols[slot] || symbols.amulet}"/></svg>`;
}

export function avatar(gender, results = [], prefix = "avatar") {
  const gear = Object.fromEntries(
    results.map((r) => {
      const item = rewardFor(r.level, r.score);
      return [item.slot, item];
    }),
  );
  const female = gender === "female";
  const metal = (slot) => (gear[slot] ? `url(#${prefix}-${slot})` : "#263345");
  const part = (slot, d, other = "") =>
    gear[slot]
      ? `<g fill="${metal(slot)}" stroke="#101622" stroke-width="3"><path d="${d}"/>${other}</g>`
      : "";
  const etch = Object.keys(gear)
    .filter((k) => gear[k].score >= 7)
    .map(
      (k, i) =>
        `<circle cx="${174 + (i % 3) * 13}" cy="${225 + Math.floor(i / 3) * 12}" r="2" fill="${gear[k].color}"/>`,
    )
    .join("");
  return `<svg class="avatar-art" viewBox="0 0 380 480" role="img" aria-label="${female ? "Guardiã" : "Guardião"} com ${results.length} peças de equipamento">
    <defs>
      <radialGradient id="${prefix}-aura"><stop stop-color="#8c6ddd" stop-opacity=".28"/><stop offset="1" stop-color="#8c6ddd" stop-opacity="0"/></radialGradient>
      <linearGradient id="${prefix}-cloth" x2="1" y2="1"><stop stop-color="#455175"/><stop offset="1" stop-color="#141c30"/></linearGradient>
      ${Object.entries(gear)
        .map(
          ([slot, r]) =>
            `<linearGradient id="${prefix}-${slot}" x2="1" y2="1"><stop stop-color="${r.color}"/><stop offset=".42" stop-color="${r.color}"/><stop offset="1" stop-color="#243144"/></linearGradient>`,
        )
        .join("")}
    </defs>
    <circle cx="190" cy="230" r="190" fill="url(#${prefix}-aura)"/>
    <g fill="none" stroke="#ad91dc" opacity=".2"><circle cx="190" cy="226" r="148"/><circle cx="190" cy="226" r="157" stroke-dasharray="2 14"/><path d="M190 48v28m0 300v28M20 226h28m284 0h28"/></g>
    <ellipse cx="191" cy="431" rx="104" ry="17" fill="#080b14"/><ellipse cx="191" cy="431" rx="106" ry="20" fill="none" stroke="#b99357" opacity=".35"/>
    ${part("cape", "M144 157 122 189 92 398 178 377 211 392 284 405 254 185 229 157Z")}
    ${female ? '<path d="M147 118Q135 49 187 57Q245 54 237 126L251 210 205 190 145 211Z" fill="#4b2d36" stroke="#161724" stroke-width="4"/>' : ""}
    <g stroke="#101622" stroke-width="4" stroke-linejoin="round">
      <path d="m155 289-11 110 9 19h32l9-123 16 123h34l-7-130Z" fill="#20283e"/>
      <path d="m150 400-14 26v10h49v-36m28 0v36h48v-10l-20-26" fill="#343446"/>
      <path d="M143 160 114 181 96 270 109 298 128 283 145 206M233 161l28 20 24 89-14 28-20-15-12-77" fill="url(#${prefix}-cloth)"/>
      <path d="m99 268-6 27 9 15 17-5 9-24m127-13-4 23 12 17 16-3 10-16-7-21" fill="#c08d73"/>
      <path d="M148 152 177 143h27l29 12 11 84-4 68-44 19-54-22 1-65Z" fill="url(#${prefix}-cloth)"/>
      <path d="M177 123v26l14 17 14-18v-25" fill="#c08d73"/>
      <path d="M156 93q-2-29 34-31 35 1 35 31l-6 39-27 22-29-22Z" fill="#d6a183"/>
      <path d="M154 100q-10-42 30-44 41-4 46 44l-18-24-26 12-22 0Z" fill="${female ? "#55333c" : "#302a35"}"/>
      ${female ? "" : '<path d="m165 124 25 11 29-11-8 22-19 9-20-10Z" fill="#302a35"/>'}
      <path d="M168 105h10m26 0h10" fill="none" stroke-width="3"/>
      <path d="m192 106-3 12h6" fill="none" stroke="#a66e5b" stroke-width="2"/>
      <path d="m155 180 37 38 37-38M151 252h86" fill="none" stroke="#7c6c67" stroke-width="3"/>
    </g>
    ${part("boots", "M145 355 183 362 180 420 180 438h-51v-11l12-14ZM207 362l33-7 7 59 18 13v11h-55Z", '<path d="m147 371 30 6m39 0 23-6" fill="none" stroke="#e8e4de" opacity=".4"/>')}
    ${part("chest", "M149 163 169 157 191 177 213 157 233 164 239 229 222 262 191 275 159 260 141 228Z", '<path d="m153 179 38 35 35-35m-35 35v44m-41-28 32 12m48-12-30 12" fill="none" stroke="#eef0ff" opacity=".4"/>')}
    ${part("belt", "M142 266 190 280 239 266v19l-48 15-49-15Z", '<path d="m191 271 14 14-14 14-14-14Z" fill="#e9cd85"/>')}
    ${part("gloves", "m96 264 33 9-6 29-18 13-17-18ZM252 271l33-9 11 32-17 20-22-12Z")}
    ${part("shoulders", "M139 153 112 166 104 198 139 211 158 178ZM238 153l29 13 12 32-38 13-18-33Z", '<path d="m112 178 23 13m109 0 23-13" stroke="#edf4ff" opacity=".4"/>')}
    ${part("helmet", "M151 93 159 61 188 48 222 62 232 94 219 104 214 80 191 94 167 80 165 106ZM156 94l11 8 7 34-18-11ZM216 102l13-10-4 33-18 12Z", gear.helmet?.score >= 8 ? '<path d="m169 58 20-29 22 28-20-9Z"/>' : "")}
    ${part("weapon", "m271 286 12-13 40 94 2 29-22-19Z", '<path d="m259 278 36-15m-20 16-10-24" fill="none" stroke="#e5c786" stroke-width="8"/>')}
    ${part("shield", "M65 268 109 250 146 270 143 329 105 370 67 328Z", '<path d="m105 273 21 30-21 33-20-33Z" fill="#101622" opacity=".6"/><path d="M105 284v36m-12-17h24" stroke="#f4dc99" stroke-width="3"/>')}
    ${part("amulet", "m192 190 13 18-13 20-13-20Z", '<path d="m167 159 25 38 24-39" fill="none" stroke="#e8cc80" stroke-width="3"/><circle cx="192" cy="208" r="4" fill="#fff"/>')}
    ${etch}
    <g fill="#d3bd8b" opacity=".7"><path d="m67 103 3 8 8 3-8 3-3 8-3-8-8-3 8-3ZM303 171l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></g>
  </svg>`;
}
