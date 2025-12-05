import React, { useRef, useEffect, useState } from 'react';
import { uploadEvidenceToServer } from '../services/permit/upload';

interface Props {
  onSignatureCaptured: (url: string) => void;
  setCanvasHasDrawing: (value: boolean) => void;
}

const SignatureCanvas: React.FC<Props> = ({ onSignatureCaptured, setCanvasHasDrawing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  // 🧠 Get correct position from event (touch or mouse)
  const getPosition = (e: TouchEvent | MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as MouseEvent).clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top
      };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    // ✅ Native Touch Events with preventDefault
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setDrawing(true);
      const { x, y } = getPosition(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = getPosition(e, canvas);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleTouchEnd = async () => {
      if (!drawing) return;
      setDrawing(false);
      setCanvasHasDrawing(true);

      const base64Image = canvas.toDataURL("image/png");

      try {
        const res = await fetch(base64Image);
        const blob = await res.blob();
        const file = new File([blob], "signature.png", { type: "image/png" });

        const fileUrl = await uploadEvidenceToServer(file);
        onSignatureCaptured(fileUrl);
      } catch (err) {
        console.error("Signature upload failed:", err);
      }
    };

    // Add event listeners with passive: false
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [drawing, onSignatureCaptured, setCanvasHasDrawing]);

  // Desktop Mouse Events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx?.beginPath();
    ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx?.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx?.stroke();
  };

  const stopDrawing = async () => {
    if (!drawing) return;
    setDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setCanvasHasDrawing(true);
      const base64Image = canvas.toDataURL("image/png");
  
      try {
        const res = await fetch(base64Image);
        const blob = await res.blob();
        const file = new File([blob], "signature.png", { type: "image/png" });
  
        const fileUrl = await uploadEvidenceToServer(file);
        onSignatureCaptured(fileUrl);
      } catch (err) {
        console.error("Signature upload failed:", err);
      }
    }
  };
  

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setCanvasHasDrawing(false);
      onSignatureCaptured('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Digital Signature (Required)
      </label>
      <canvas
        ref={canvasRef}
        width={window.innerWidth < 500 ? 320 : 400}
        height={120}
        className="w-full max-w-md border border-gray-300 rounded-lg bg-white cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="flex justify-between mt-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="text-sm text-blue-600 hover:underline"
        >
          Clear Signature
        </button>
      </div>
    </div>
  );
};

export default SignatureCanvas;