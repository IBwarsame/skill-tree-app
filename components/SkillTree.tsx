"use client";

import { useEffect, useRef, useState } from "react";
import type { NodeStatus, SkillNode, SkillEdge } from "@/lib/skillTreeData";

// Matches the aspect ratio of the canvas area in the easel photo
// (public/easel.png) - see CANVAS_AREA in Easel.tsx. Node x/y positions in
// skillTreeData.ts are percentages, so they don't need to change when this
// ratio changes; only the pixel shape they're mapped onto does.
const VB_W = 600;
const VB_H = 554;
const RADIUS = 30;

// How long you need to hold a node before it toggles complete/incomplete.
const HOLD_MS = 650;
const RING_RADIUS = RADIUS + 7;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const statusColor: Record<NodeStatus, { fill: string; stroke: string; text: string }> = {
  completed: { fill: "#C0DD97", stroke: "#3B6D11", text: "#173404" },
  in_progress: { fill: "#FAC775", stroke: "#854F0B", text: "#412402" },
  locked: { fill: "#D3D1C7", stroke: "#5F5E5A", text: "#2C2C2A" },
};

function toXY(xPct: number, yPct: number) {
  return { x: (xPct / 100) * VB_W, y: (yPct / 100) * VB_H };
}

// Which side the tooltip opens on. Default is centered above the node,
// but a node with something else directly above it in the same column
// (linux -> bash, docker -> kubernetes, aws -> terraform) would have its
// tooltip cover that node - so those open sideways instead: left-branch
// nodes open left, right-branch nodes open right, and linux (bottom
// center, with bash directly above it) opens right too.
type TooltipSide = "top" | "left" | "right";

function tooltipSide(nodeId: string, xPct: number): TooltipSide {
  if (nodeId === "linux") return "right";
  if (xPct < 50) return "left";
  if (xPct > 50) return "right";
  return "top";
}

// The node's own radius, as a percentage of the container width (same
// units as x/y). Left/right tooltips are anchored at the node's edge
// rather than its center - anchoring at the center and only offsetting by
// a small pixel gap left the tooltip overlapping the node itself, since
// that gap has to clear the node's radius first.
const NODE_RADIUS_PCT = (RADIUS / VB_W) * 100;
const SIDE_GAP_PX = 16;

function tooltipStyle(node: { x: number; y: number; id: string }): React.CSSProperties {
  const side = tooltipSide(node.id, node.x);
  if (side === "left") {
    return {
      left: `calc(${node.x}% - ${NODE_RADIUS_PCT}%)`,
      top: `${node.y}%`,
      transform: `translate(calc(-100% - ${SIDE_GAP_PX}px), -50%)`,
    };
  }
  if (side === "right") {
    return {
      left: `calc(${node.x}% + ${NODE_RADIUS_PCT}%)`,
      top: `${node.y}%`,
      transform: `translate(${SIDE_GAP_PX}px, -50%)`,
    };
  }
  return { left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -140%)" };
}

interface SkillTreeProps {
  boardId: string;
  nodes: SkillNode[];
  edges: SkillEdge[];
}

export default function SkillTree({ boardId, nodes, edges }: SkillTreeProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Start from the hardcoded defaults in skillTreeData.ts so the tree
  // renders immediately, then overwrite with whatever's actually saved in
  // SQLite once the fetch below comes back.
  const [statuses, setStatuses] = useState<Record<string, NodeStatus>>(
    Object.fromEntries(nodes.map((n) => [n.id, n.status]))
  );
  const [proofLinks, setProofLinks] = useState<Record<string, string>>(
    Object.fromEntries(nodes.map((n) => [n.id, n.proofLink ?? ""]))
  );

  // Hold-to-complete state: which node is currently being held, and how
  // far through the hold we are (0 to 1), driven by a plain interval timer
  // rather than a CSS animation so the logic stays plain JS.
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStart = useRef(0);

  // There's a visual gap between a node and its tooltip (the tooltip floats
  // above it), so the mouse briefly leaves both while moving from one to
  // the other. Closing on a short delay instead of immediately gives it
  // time to land in the tooltip before it disappears; entering either one
  // cancels the pending close.
  const closeTooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openTooltip(id: string) {
    if (closeTooltipTimeout.current !== null) {
      clearTimeout(closeTooltipTimeout.current);
      closeTooltipTimeout.current = null;
    }
    setHoveredId(id);
  }

  function scheduleCloseTooltip() {
    closeTooltipTimeout.current = setTimeout(() => {
      setHoveredId(null);
      closeTooltipTimeout.current = null;
    }, 300);
  }

  useEffect(() => {
    fetch(`/api/status/${boardId}`)
      .then((res) => res.json())
      .then((rows: { id: string; status: NodeStatus; proof_link: string }[]) => {
        setStatuses((prev) => {
          const next = { ...prev };
          for (const row of rows) next[row.id] = row.status;
          return next;
        });
        setProofLinks((prev) => {
          const next = { ...prev };
          for (const row of rows) next[row.id] = row.proof_link ?? "";
          return next;
        });
      });
  }, [boardId]);

  // Clear any pending timers if the tree unmounts mid-hover or mid-hold.
  useEffect(() => {
    return () => {
      if (holdInterval.current !== null) clearInterval(holdInterval.current);
      if (closeTooltipTimeout.current !== null) clearTimeout(closeTooltipTimeout.current);
    };
  }, []);

  const hovered = nodes.find((n) => n.id === hoveredId) ?? null;

  // All node ids that have an edge pointing INTO this node - these are
  // the nodes that must be completed before this one can be.
  function getIncomingIds(nodeId: string) {
    return edges.filter((e) => e.to === nodeId).map((e) => e.from);
  }

  // A node can be completed once every incoming node (prereq or
  // requirement, we don't distinguish here) is already completed.
  function canComplete(nodeId: string, current: Record<string, NodeStatus>) {
    return getIncomingIds(nodeId).every((id) => current[id] === "completed");
  }

  function persistStatus(id: string, status: NodeStatus) {
    fetch(`/api/status/${boardId}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function persistProofLink(id: string, proofLink: string) {
    fetch(`/api/status/${boardId}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofLink }),
    });
  }

  function toggleStatus(id: string) {
    // Work out the next status from the current `statuses` state directly,
    // rather than inside the setStatuses updater - updater functions can
    // run twice in dev (React double-invokes them to catch impure code),
    // which would fire persistStatus's network request twice per toggle.
    const isCompleted = statuses[id] === "completed";
    let nextStatus: NodeStatus;

    if (isCompleted) {
      // Un-completing is always allowed, no gate going backwards.
      nextStatus = "locked";
    } else if (!canComplete(id, statuses)) {
      // Completing is gated - do nothing if prerequisites aren't met yet.
      return;
    } else {
      nextStatus = "completed";
    }

    setStatuses((prev) => ({ ...prev, [id]: nextStatus }));
    persistStatus(id, nextStatus);
  }

  // Whether pressing-and-holding this node would actually do anything -
  // used to decide whether to even start the hold ring, so a locked node
  // with unmet prerequisites doesn't animate a ring that goes nowhere.
  function canInteract(id: string) {
    return statuses[id] === "completed" || canComplete(id, statuses);
  }

  function stopHold() {
    if (holdInterval.current !== null) clearInterval(holdInterval.current);
    holdInterval.current = null;
    setHoldingId(null);
    setHoldProgress(0);
  }

  function startHold(id: string) {
    if (!canInteract(id)) return;

    setHoldingId(id);
    holdStart.current = performance.now();

    holdInterval.current = setInterval(() => {
      const progress = Math.min((performance.now() - holdStart.current) / HOLD_MS, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        stopHold();
        toggleStatus(id);
      }
    }, 16); // ~60fps
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto">
        {edges.map((edge, i) => {
          const from = nodes.find((n) => n.id === edge.from)!;
          const to = nodes.find((n) => n.id === edge.to)!;
          const a = toXY(from.x, from.y);
          const b = toXY(to.x, to.y);
          const dashed = edge.kind === "requirement";
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={dashed ? "#cbb896" : "#9c8968"}
              strokeWidth={dashed ? 1 : 1.5}
              strokeDasharray={dashed ? "5 5" : undefined}
            />
          );
        })}

        {nodes.map((node) => {
          const { x, y } = toXY(node.x, node.y);
          const status = statuses[node.id];
          const colors = statusColor[status];
          return (
            <g
              key={node.id}
              onMouseEnter={() => openTooltip(node.id)}
              onMouseLeave={scheduleCloseTooltip}
              onPointerDown={() => startHold(node.id)}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              className="cursor-pointer select-none"
              style={{ touchAction: "none" }}
            >
              <circle
                cx={x}
                cy={y}
                r={RADIUS}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={hoveredId === node.id ? 3 : 1.5}
                style={{ filter: "drop-shadow(0 2px 3px rgba(40, 30, 10, 0.25))" }}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.text}
                className="text-[13px] font-medium select-none"
              >
                {node.abbr}
              </text>

              {/* the hold progress ring - only rendered while this node is
                  being held, fills clockwise from the top as you hold */}
              {holdingId === node.id && (
                <circle
                  cx={x}
                  cy={y}
                  r={RING_RADIUS}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - holdProgress)}
                  transform={`rotate(-90 ${x} ${y})`}
                />
              )}
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="absolute z-10 w-60 rounded-lg border border-gray-200 bg-white p-3 shadow-md"
          style={tooltipStyle(hovered)}
          onMouseEnter={() => openTooltip(hovered.id)}
          onMouseLeave={scheduleCloseTooltip}
        >
          <p className="text-sm font-medium">{hovered.title}</p>
          <p className="mt-1 text-xs text-gray-500">{hovered.description}</p>
          <p className="mt-1 text-xs text-gray-400">
            <span className="font-medium text-gray-600">To unlock: </span>
            {hovered.requirement}
          </p>

          <div className="mt-2 flex items-center gap-1">
            <input
              type="url"
              placeholder="Repo link (proof of work)"
              value={proofLinks[hovered.id] ?? ""}
              onChange={(e) =>
                setProofLinks((prev) => ({ ...prev, [hovered.id]: e.target.value }))
              }
              onBlur={(e) => persistProofLink(hovered.id, e.target.value)}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs outline-none focus:border-gray-400"
            />
            {proofLinks[hovered.id] && (
              <a
                href={proofLinks[hovered.id]}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs text-blue-500 hover:underline"
              >
                Open
              </a>
            )}
          </div>

          <p className="mt-2 text-[11px] uppercase tracking-wide text-gray-400">
            {statuses[hovered.id] === "completed"
              ? "Hold to un-complete"
              : canComplete(hovered.id, statuses)
              ? "Hold to mark complete"
              : "Locked - complete prerequisites first"}
          </p>
        </div>
      )}
    </div>
  );
}
