import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aether Chat",
    short_name: "Aether",
    description: "Next-Gen Real-Time Messaging & Team Collaboration Platform",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0F17",
    theme_color: "#00A884",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}