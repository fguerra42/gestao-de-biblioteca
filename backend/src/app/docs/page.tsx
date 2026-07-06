"use client";

import { useEffect } from "react";

export default function DocsPage() {
  useEffect(() => {
    const linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(linkEl);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      // @ts-ignore
      window.SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
      });
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(linkEl);
      document.body.removeChild(script);
    };
  }, []);

  return <div id="swagger-ui" style={{ padding: "1rem" }} />;
}