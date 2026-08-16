import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(145deg, #0b1220 0%, #0f766e 48%, #0b1220 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#5eead4",
            marginBottom: 20,
          }}
        >
          HEAR → ETCH → ANCHOR → TEMPER
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
          {siteConfig.name}
        </div>
        <div style={{ fontSize: 32, marginTop: 24, maxWidth: 900, lineHeight: 1.35, color: "#cbd5e1" }}>
          {siteConfig.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
