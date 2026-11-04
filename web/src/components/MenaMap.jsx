import { useState } from "react";
import { MAP_VIEWBOX, mapShapes } from "../data/menaMap.js";

// The map has two views: the whole region, and a close-up of the Bahrain area (Bahrain, Qatar and the
// neighbouring coast) where the small Gulf states are big enough to hit.
const GULF_VIEWBOX = "818 148 110 61";

// Clickable map. Grey shapes are neutral context; coloured ones are quiz places.
export default function MenaMap({ solved, wrongId, onPick, disabled }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="map-wrap">
      <div className="map-zoom" dir="ltr">
        <button type="button" aria-label="Zoom out" onClick={() => setZoomed(false)} disabled={!zoomed}>−</button>
        <button type="button" aria-label="Zoom in" onClick={() => setZoomed(true)} disabled={zoomed}>+</button>
      </div>
      <div className="map-scroll">
        <svg
          className="mena-map"
          viewBox={zoomed ? GULF_VIEWBOX : MAP_VIEWBOX}
          style={{ width: "100%" }}
          role="img"
          aria-label="Map of the Middle East and North Africa"
          dir="ltr"
        >
          <rect width="100%" height="100%" className="map-sea" />
          {mapShapes.map((s, i) => {
            if (!s.id) return <path key={i} d={s.d} className="map-context" />;
            const cls = [
              "map-country",
              solved.has(s.id) ? "solved" : "",
              wrongId === s.id ? "wrong" : "",
              disabled ? "disabled" : "",
            ].join(" ");
            const pick = () => !disabled && !solved.has(s.id) && onPick(s.id);
            return (
              <g key={i} className="map-group">
                <path d={s.d} className={cls} onClick={pick} />
                {/* Small places get a wider invisible target. */}
                {s.small && <path d={s.d} className="map-hit" onClick={pick} />}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
