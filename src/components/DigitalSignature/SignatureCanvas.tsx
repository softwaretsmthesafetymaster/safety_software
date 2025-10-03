import React, { useRef, useEffect, useState } from 'react';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';
import Button from '../UI/Button';

interface SignatureCanvasProps {
  onSave: (signature: Blob) => void;
  onCancel: () => void;
  isOpen: boolean;
  signerName: string;
  signerRole: string;
}

const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  onCancel,
  isOpen,
  signerName,
  signerRole
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
      }
      
      const handleMouseDown = (e: MouseEvent) => startDrawing(e);
      const handleMouseMove = (e: MouseEvent) => draw(e);
      const handleMouseUp = () => stopDrawing();
      const handleMouseLeave = () => stopDrawing();

      const handleTouchStart = (e: TouchEvent) => startDrawing(e);
      const handleTouchMove = (e: TouchEvent) => draw(e);
      const handleTouchEnd = () => stopDrawing();

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isOpen, isDrawing]);

  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event instanceof TouchEvent) {
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      const mouseEvent = event as MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (event: MouseEvent | TouchEvent) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const coords = getCoordinates(event);
    if (ctx && coords) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
    event.preventDefault();
  };

  const draw = (event: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const coords = getCoordinates(event);
    if (ctx && coords) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    event.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const signatureDataURL = canvas.toDataURL('image/png');
      const signatureBlob = dataURLtoBlob(signatureDataURL);
      onSave(signatureBlob);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Digital Signature Required
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Please provide your digital signature to proceed
          </p>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Signer: {signerName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Role: {signerRole}
            </p>
          </div>
        </div>

        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-48 cursor-crosshair"
          />
          <div className="p-2 bg-gray-50 dark:bg-gray-700 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Sign above with your mouse or touch
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            icon={RotateCcw}
            onClick={clearSignature}
            disabled={!hasSignature}
          >
            Clear
          </Button>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              icon={X}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              icon={Check}
              onClick={saveSignature}
              disabled={!hasSignature}
            >
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};