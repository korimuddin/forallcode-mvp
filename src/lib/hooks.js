import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  ));

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
}

export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previousTitle = document.title;
    document.title = title.includes("ForAllCode") ? title : `${title} · ForAllCode`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
