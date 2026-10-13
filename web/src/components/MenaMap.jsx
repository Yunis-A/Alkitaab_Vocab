import { useState } from "react";
import { MAP_VIEWBOX, mapShapes } from "../data/menaMap.js";

const ZOOMS = [1, 2, 3, 4];

// Clickable map. Grey shapes are neutral context; coloured ones are quiz
// places. Zoom enlarges the map inside a scrollable frame so the small Gulf
// states are easier to hit.
export default function MenaMap({ solved, wrongId, onPick, disabled }) {
  const [zoom, setZoom] = useState(1);
  const step = (d) => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, ZOOMS.indexOf(z) + d))]);

  return (
    <div className="map-wrap">
      <div className="map-zoom" dir="ltr">
        <button type="button" aria-label="Zoom out" onClick={() => step(-1)} disabled={zoom === ZOOMS[0]}>−</button>
        <button type="button" aria-label="Zoom in" onClick={() => step(1)} disabled={zoom === ZOOMS[ZOOMS.length - 1]}>+</button>
      </div>
      <div className="map-scroll">
        <svg
          className="mena-map"
          viewBox={MAP_VIEWBOX}
          style={{ width: `${zoom * 100}%` }}
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
