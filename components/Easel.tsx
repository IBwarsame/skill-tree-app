import Image from "next/image";

// The easel is the actual reference photo (public/easel.png) instead of a
// CSS recreation. The tree gets absolutely positioned on top, inside the
// white canvas area of that photo.
//
// These percentages are the canvas rectangle's real position within the
// 410x490 source image (measured directly from the pixels, not eyeballed)
// - that's what makes the tree line up with the painted canvas edges
// instead of floating over the wood.
const CANVAS_AREA = {
  top: "19.6%",
  left: "14.6%",
  right: "14.4%", // 100% - 85.6%
  bottom: "25.5%", // 100% - 74.5%
};

// This component just fills whatever width its parent gives it (locked to
// the photo's 410:490 aspect ratio) - sizing and centering on the page is
// BoardCarousel's job now, since it needs to lay out several of these side
// by side and slide between them.
export default function Easel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "410 / 490" }}>
      <Image
        src="/easel.png"
        alt="Blank canvas on a mini easel"
        fill
        sizes="(max-width: 760px) 94vw, 760px"
        // drop-shadow (not box-shadow) follows the image's actual
        // non-transparent pixels rather than its rectangular bounding box,
        // so the shadow hugs the easel's silhouette, not a square.
        className="object-contain pointer-events-none select-none"
        style={{ filter: "drop-shadow(0 18px 24px rgba(60, 45, 20, 0.18))" }}
        priority
      />

      <div className="absolute" style={CANVAS_AREA}>
        {children}
      </div>
    </div>
  );
}
