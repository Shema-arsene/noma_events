"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function QrScanner({ onScan, disabled }: { onScan: (payload: string) => void; disabled?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          tick();
        }
      } catch {
        setCameraError("Caméra indisponible. Utilisez la saisie manuelle ci-dessous.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(imageData.data, imageData.width, imageData.height);
          if (result?.data) {
            const now = Date.now();
            const last = lastScanRef.current;
            if (!disabled && (!last || last.value !== result.data || now - last.at > 3000)) {
              lastScanRef.current = { value: result.data, at: now };
              onScan(result.data);
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    void startCamera();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-card bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {cameraActive && (
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-4 border-gold/80" />
        )}
        {!cameraActive && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Activation de la caméra...
          </div>
        )}
      </div>
      {cameraError && <p className="mt-2 text-center text-sm text-amber-700">{cameraError}</p>}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manualCode.trim()) {
            onScan(manualCode.trim());
            setManualCode("");
          }
        }}
      >
        <Input
          placeholder="Ou saisissez le code du billet manuellement"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
        />
        <Button type="submit" variant="outline" disabled={disabled}>
          Valider
        </Button>
      </form>
    </div>
  );
}
