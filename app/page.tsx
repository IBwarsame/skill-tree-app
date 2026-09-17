import BoardCarousel from "@/components/BoardCarousel";

export default function Home() {
  return (
    <main
      className="min-h-screen"
      style={{
        // One continuous vignette across the whole page (header included),
        // not a flat color handed off to a separate gradient below it -
        // two adjacent approximations of the same color left a visible
        // seam where they met.
        background:
          "radial-gradient(ellipse 70% 55% at 50% 45%, #fdfcfa 0%, #f2efe7 60%, #e9e3d4 100%)",
      }}
    >
      <BoardCarousel />
    </main>
  );
}
