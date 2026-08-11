import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          fontFamily: "-apple-system, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "#2563eb",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "16px solid transparent",
                borderBottom: "16px solid transparent",
                borderLeft: "26px solid #ffffff",
                marginLeft: 6,
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "#ffffff" }}>Croonbox</div>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#94a3b8" }}>
          Live AI interviews for hiring teams
        </div>
      </div>
    ),
    { ...size },
  );
}
