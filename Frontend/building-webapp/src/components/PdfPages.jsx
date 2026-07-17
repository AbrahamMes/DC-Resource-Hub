import { useEffect, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function PdfPage({ pdf, pageNumber }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    let disposed = false;
    let page;
    let renderTask;
    let resizeTimer;
    let hasEnteredViewport = false;

    async function render() {
      if (!page || disposed || !hasEnteredViewport) return;
      if (renderTask) {
        renderTask.cancel();
        await renderTask.promise.catch(() => {});
      }

      const base = page.getViewport({ scale: 1 });
      const width = Math.max(320, container.clientWidth);
      const viewport = page.getViewport({ scale: width / base.width });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const context = canvas.getContext("2d", { alpha: false });

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0]
      });

      try {
        await renderTask.promise;
        if (!disposed) canvas.style.opacity = "1";
      } catch (renderError) {
        if (!disposed && renderError?.name !== "RenderingCancelledException") setError(true);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        hasEnteredViewport = true;
        render();
      }
    }, { rootMargin: "900px 0px" });

    pdf.getPage(pageNumber).then((loadedPage) => {
      if (disposed) return;
      page = loadedPage;
      const viewport = page.getViewport({ scale: 1 });
      container.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
      observer.observe(container);
    }).catch(() => !disposed && setError(true));

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 180);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      renderTask?.cancel();
    };
  }, [pdf, pageNumber]);

  return (
    <div ref={containerRef} style={{ width: "100%", background: "#fff", position: "relative" }}>
      {error ? (
        <div style={{ padding: 30, color: "#a00" }}>This schedule page could not be rendered.</div>
      ) : (
        <canvas ref={canvasRef} style={{ width: "100%", display: "block", opacity: 0, transition: "opacity 120ms ease" }} />
      )}
    </div>
  );
}

export default function PdfPages({ src, title }) {
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let disposed = false;
    const task = getDocument({ url: src, withCredentials: true });

    task.promise
      .then((document) => !disposed && setPdf(document))
      .catch((loadError) => {
        console.error("Error loading schedule PDF:", loadError);
        if (!disposed) setError(true);
      });

    return () => {
      disposed = true;
      task.destroy();
    };
  }, [src]);

  if (error) return <div style={{ padding: 30, color: "#ff8a8a" }}>The schedule could not be loaded.</div>;
  if (!pdf) return <div style={{ padding: 30, color: "#aaa" }}>Loading {title || "schedule"}…</div>;

  return (
    <div style={{ display: "grid", gap: 12, background: "#2a2a2a" }}>
      {Array.from({ length: pdf.numPages }, (_, index) => (
        <PdfPage key={index + 1} pdf={pdf} pageNumber={index + 1} />
      ))}
    </div>
  );
}
