import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { fileToBase64, enhanceImage } from '../services/geminiService';
import Loader from './Loader';
import { BackgroundRemoverState } from '../types';

// SVG Icons
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const WandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
);

interface BackgroundRemoverProps {
    onApiError: (error: unknown) => void;
    clearError: () => void;
    state: BackgroundRemoverState;
    setState: React.Dispatch<React.SetStateAction<BackgroundRemoverState>>;
    onSendToTool: (targetMode: 'image' | 'filter' | 'portrait', imageDataUrl: string) => void;
}

const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({ onApiError, clearError, state, setState }) => {
    const { imageFile, resultImageUrl } = state;

    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        if (imageFile) {
            objectUrl = URL.createObjectURL(imageFile);
            setImagePreviewUrl(objectUrl);
        } else {
            setImagePreviewUrl(null);
        }
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [imageFile]);

    const handleFileSelect = (file: File | null) => {
        if (file && (file.type.startsWith('image/'))) {
            clearError();
            setState({
                imageFile: file,
                resultImageUrl: null,
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files?.[0] || null);
    };
    
    const handleDragEvents = (e: DragEvent<HTMLDivElement>, isOver: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isOver);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        handleDragEvents(e, false);
        handleFileSelect(e.dataTransfer.files?.[0] || null);
    };

    const handleRemoveBackground = async () => {
        if (!imageFile) {
            onApiError(new Error('Please upload an image first.'));
            return;
        }
        clearError();
        setIsLoading(true);
        const prompt = "Remove the background of this image and make the background transparent. The subject should be perfectly preserved with clean edges.";
        try {
            const imageBase64 = await fileToBase64(imageFile);
            const resultBase64 = await enhanceImage(prompt, imageBase64, imageFile.type);
            setState(prev => ({...prev, resultImageUrl: `data:image/png;base64,${resultBase64}`}));
        } catch (e) {
            onApiError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToCollection = async () => {
        const imageName = window.prompt("Enter a name for your creation:");
        if (!imageName || !resultImageUrl) return;
        
        const savedImagesRaw = localStorage.getItem('savedImagesCollection');
        const savedImages = savedImagesRaw ? JSON.parse(savedImagesRaw) : [];
        savedImages.push({ name: imageName, dataUrl: resultImageUrl, timestamp: Date.now() });
        localStorage.setItem('savedImagesCollection', JSON.stringify(savedImages));
        alert(`'${imageName}' saved successfully!`);
    };

    const handleStartOver = () => {
        setState({ imageFile: null, resultImageUrl: null });
        if (fileInputRef.current) fileInputRef.current.value = "";
        clearError();
    };
    
    const checkerboardStyle: React.CSSProperties = {
        backgroundImage: 'linear-gradient(45deg, #4b5563 25%, transparent 25%), linear-gradient(-45deg, #4b5563 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4b5563 75%), linear-gradient(-45deg, transparent 75%, #4b5563 75%)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    };

    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl shadow-2xl mx-auto relative overflow-hidden">
            {isLoading && <Loader message="Removing background..." />}
            <p className="text-[var(--text-secondary)] text-center text-sm mb-4">Upload an image to instantly remove the background.</p>

             {!imageFile ? (
                <div 
                    className={`relative w-full aspect-video bg-[var(--bg-primary)] rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-cyan-500' : 'border-[var(--border-color)]'}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => handleDragEvents(e, true)}
                    onDragLeave={(e) => handleDragEvents(e, false)}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center text-gray-400 cursor-pointer p-4">
                        <UploadIcon />
                        <p className="mt-2 font-semibold text-sm">{isDragging ? "Drop your image" : "Upload an Image"}</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="w-full aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                           {imagePreviewUrl && <img src={imagePreviewUrl} alt="Original preview" className="w-full h-full object-contain" />}
                        </div>
                        <div className="w-full aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-[var(--border-color)]" style={checkerboardStyle}>
                           {resultImageUrl ? <img src={resultImageUrl} alt="Background removed result" className="w-full h-full object-contain" /> : <div className="text-gray-600 text-sm">Result</div>}
                        </div>
                    </div>
                    
                    {!resultImageUrl ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-3 pt-4 border-t border-[var(--border-color)]">
                           <button onClick={handleRemoveBackground} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-gray-900 font-bold py-2.5 rounded-md hover:opacity-90 disabled:opacity-50">
                                <WandIcon />
                                Remove Background
                            </button>
                            <button onClick={handleStartOver} className="text-gray-400 hover:text-white transition-colors text-sm py-1">
                                Change Image
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                             <button onClick={handleSaveToCollection} className="w-full bg-cyan-500 text-gray-900 font-bold py-2.5 rounded-md hover:opacity-90">
                                Save to Collection
                            </button>
                            <button onClick={handleStartOver} className="w-full text-gray-400 hover:text-white transition-colors text-sm py-1">
                                Start Over
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BackgroundRemover;