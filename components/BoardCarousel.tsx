"use client";

import { useEffect, useRef, useState } from "react";
import Easel from "./Easel";
import SkillTree from "./SkillTree";
import { skillBoards } from "@/lib/skillTreeData";

// Gap between canvases in the strip, and how much smaller each canvas is
// than the outer viewport - that difference is what leaves room for the
// neighbouring canvas to peek in from the side.
const GAP_PX = 40;
const ITEM_WIDTH = "min(72vw, 560px)";
const VIEWPORT_WIDTH = "min(94vw, 760px)";

export default function BoardCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Slide the strip so the active canvas sits centered in the viewport.
  // Uses offsetLeft (the item's position in normal layout flow) rather than
  // getBoundingClientRect, because a CSS transform doesn't change layout
  // position - only offsetLeft stays stable regardless of the transform
  // we're about to apply, so it's the right thing to measure from.
  function centerActiveItem() {
    const viewport = viewportRef.current;
    const item = itemRefs.current[activeIndex];
    if (!viewport || !item) return;

    const viewportWidth = viewport.getBoundingClientRect().width;
    const itemWidth = item.getBoundingClientRect().width;
    const targetLeft = (viewportWidth - itemWidth) / 2;
    setTranslateX(targetLeft - item.offsetLeft);
  }

  useEffect(() => {
    centerActiveItem();
  }, [activeIndex]);

  useEffect(() => {
    window.addEventListener("resize", centerActiveItem);
    return () => window.removeEventListener("resize", centerActiveItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const active = skillBoards[activeIndex];

  return (
    <div>
      <h1 className="text-center text-2xl font-medium pt-8 text-gray-800">{active.title}</h1>
      <p className="text-center text-sm text-gray-500 mb-2">
        Hover a node for details. Hold to mark it complete.
      </p>

      <div
        ref={viewportRef}
        className="mx-auto overflow-hidden py-10 px-4"
        style={{ width: VIEWPORT_WIDTH }}
      >
        <div
          className="flex"
          style={{
            gap: GAP_PX,
            transform: `translateX(${translateX}px)`,
            transition: "transform 500ms ease",
          }}
        >
          {skillBoards.map((board, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={board.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={() => !isActive && setActiveIndex(i)}
                style={{
                  width: ITEM_WIDTH,
                  flexShrink: 0,
                  cursor: isActive ? "default" : "pointer",
                  opacity: isActive ? 1 : 0.55,
                  transform: `scale(${isActive ? 1 : 0.92})`,
                  transition: "opacity 500ms ease, transform 500ms ease",
                }}
              >
                {/* Only the active canvas should respond to hovering/holding
                    its own nodes - a peeking neighbour is just something to
                    click on to switch to, not to interact with yet. */}
                <div style={{ pointerEvents: isActive ? "auto" : "none" }}>
                  <Easel>
                    <SkillTree boardId={board.id} nodes={board.nodes} edges={board.edges} />
                  </Easel>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
