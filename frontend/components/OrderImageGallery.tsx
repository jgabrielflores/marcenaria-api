"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Lightbox } from "@/components/Lightbox";
import { ImageUploader, MAX_ORDER_IMAGES } from "@/components/ImageUploader";
import {
  ApiError,
  deleteOrderImage,
  fetchOrderImageBlob,
  uploadOrderImages,
  type OrderImageRead,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { C, inkButtonStyle } from "@/lib/theme";

/** Displays an order's environment photos. When `editable`, also lets the
 * viewer add and remove photos (the order must still be awaiting analysis).
 * `onImagesChange` hands the updated image list back so the parent can keep
 * its order state in sync without clobbering its other in-progress fields. */
export function OrderImageGallery({
  orderId,
  images,
  editable = false,
  onImagesChange,
}: {
  orderId: string;
  images: OrderImageRead[];
  editable?: boolean;
  onImagesChange?: (images: OrderImageRead[]) => void;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let active = true;
    const created: string[] = [];
    (async () => {
      const entries: [string, string][] = [];
      for (const img of images) {
        try {
          const url = await fetchOrderImageBlob(token, orderId, img.id);
          created.push(url);
          entries.push([img.id, url]);
        } catch {
          // Skip a single broken image rather than failing the whole gallery.
        }
      }
      if (active) setUrls(Object.fromEntries(entries));
    })();
    return () => {
      active = false;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [orderId, images]);

  async function handleUpload() {
    const token = getToken();
    if (!token || files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const updated = await uploadOrderImages(token, orderId, files);
      setFiles([]);
      onImagesChange?.(updated.images);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao enviar as imagens.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(imageId: string) {
    const token = getToken();
    if (!token) return;
    setError("");
    try {
      await deleteOrderImage(token, orderId, imageId);
      onImagesChange?.(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao remover a imagem.");
    }
  }

  if (images.length === 0 && !editable) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {images.map((img) => (
            <div key={img.id} style={{ position: "relative" }}>
              <Lightbox src={urls[img.id] ?? ""} alt={img.filename}>
                <div
                  style={{
                    aspectRatio: "1",
                    borderRadius: "2px",
                    overflow: "hidden",
                    border: `1px solid ${C.border}`,
                    background: "oklch(0.96 0 0)",
                  }}
                >
                  {urls[img.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urls[img.id]}
                      alt={img.filename}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
              </Lightbox>
              {editable && (
                <button
                  type="button"
                  aria-label="Remover imagem"
                  onClick={() => handleDelete(img.id)}
                  style={{
                    position: "absolute",
                    top: "0.35rem",
                    right: "0.35rem",
                    width: "1.65rem",
                    height: "1.65rem",
                    borderRadius: "50%",
                    border: "none",
                    background: "oklch(0 0 0 / 0.6)",
                    color: "oklch(1 0 0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && (
        <>
          <ImageUploader
            files={files}
            onChange={setFiles}
            maxFiles={MAX_ORDER_IMAGES - images.length}
            disabled={busy}
          />
          {files.length > 0 && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={busy}
              className="btn-ink"
              style={{ ...inkButtonStyle, alignSelf: "flex-start" }}
            >
              {busy ? "Enviando…" : `Enviar ${files.length === 1 ? "foto" : "fotos"}`}
            </button>
          )}
        </>
      )}

      {error && (
        <p style={{ fontSize: "0.78rem", color: C.danger }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
