import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Sun, Contrast, Crop, X, Check } from 'lucide-react';

interface ImageEditorProps {
    image: string;
    onSave: (editedImage: string) => void;
    onCancel: () => void;
}

export function ImageEditor({ image, onSave, onCancel }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);

    useEffect(() => {
        applyFilters();
    }, [rotation, brightness, contrast, image]);

    const applyFilters = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Adjust canvas size based on rotation
            if (rotation === 90 || rotation === 270) {
                canvas.width = img.height;
                canvas.height = img.width;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply rotation
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-img.width / 2, -img.height / 2);

            // Apply filters
            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
            ctx.drawImage(img, 0, 0);
            ctx.restore();
        };
        img.src = image;
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const editedImage = canvas.toDataURL('image/jpeg', 0.9);
        onSave(editedImage);
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 p-4 flex justify-between items-center">
                <button onClick={onCancel} className="text-white p-2">
                    <X size={24} />
                </button>
                <h2 className="text-white font-semibold">Editar Imagem</h2>
                <button onClick={handleSave} className="text-green-400 p-2">
                    <Check size={24} />
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                <canvas ref={canvasRef} className="max-w-full max-h-full" />
            </div>

            {/* Controls */}
            <div className="bg-gray-900 p-4 space-y-4">
                {/* Rotation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <RotateCw size={20} />
                        <span className="text-sm">Rotação</span>
                    </div>
                    <button
                        onClick={handleRotate}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg"
                    >
                        {rotation}°
                    </button>
                </div>

                {/* Brightness */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white">
                        <Sun size={20} />
                        <span className="text-sm">Brilho: {brightness}%</span>
                    </div>
                    <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full"
                    />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white">
                        <Contrast size={20} />
                        <span className="text-sm">Contraste: {contrast}%</span>
                    </div>
                    <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
}
