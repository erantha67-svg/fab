import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { fileToBase64, enhanceImage } from '../services/geminiService';
import Loader from './Loader';
import { PortraitStudioState } from '../types';

// Shared SVG Icons
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

interface PortraitStudioProps {
    onApiError: (error: unknown) => void;
    clearError: () => void;
    state: PortraitStudioState;
    setState: React.Dispatch<React.SetStateAction<PortraitStudioState>>;
    onSendToTool: (targetMode: 'image' | 'filter', imageDataUrl: string) => void;
}

const PortraitStudio: React.FC<PortraitStudioProps> = ({ onApiError, clearError, state, setState, onSendToTool }) => {
    const { imageFile, resultImageUrl, customPrompt } = state;

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
        if (file && file.type.startsWith('image/')) {
            clearError();
            setState({
                imageFile: file,
                resultImageUrl: null,
                customPrompt: '',
                exportQuality: 'original',
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

    const handleTransform = async (prompt: string) => {
        if (!imageFile || !prompt) {
            onApiError(new Error('Please upload an image and provide a prompt.'));
            return;
        }
        clearError();
        setIsLoading(true);
        try {
            const imageBase64 = await fileToBase64(imageFile);
            const resultBase64 = await enhanceImage(prompt, imageBase64, imageFile.type);
            setState(prev => ({...prev, resultImageUrl: `data:${imageFile.type};base64,${resultBase64}`}));
        } catch (e) {
            onApiError(e);
        } finally {
            setIsLoading(false);
        }
    };
    
     const handleSaveToCollection = async () => {
        const imageName = window.prompt("Enter a name for your creation:");
        if (!imageName || !resultImageUrl) return;

        setIsLoading(true);
        try {
            const savedImagesRaw = localStorage.getItem('savedImagesCollection');
            const savedImages = savedImagesRaw ? JSON.parse(savedImagesRaw) : [];
            savedImages.push({ name: imageName, dataUrl: resultImageUrl, timestamp: Date.now() });
            localStorage.setItem('savedImagesCollection', JSON.stringify(savedImages));
            alert(`'${imageName}' saved successfully!`);
        } catch (error) { onApiError(error); } finally { setIsLoading(false); }
    };

    const handleStartOver = () => {
        setState({ imageFile: null, resultImageUrl: null, customPrompt: '', exportQuality: 'original' });
        if (fileInputRef.current) fileInputRef.current.value = "";
        clearError();
    };

    const presets = [
        { name: 'Professional', prompt: "Transform into a professional corporate headshot. Add a suit, and a blurred, neutral office background. Keep their facial identity." },
        { name: 'Add a Smile', prompt: "Subtly and realistically edit the person's expression to a gentle, happy smile." },
        { name: 'Vintage', prompt: "Convert this portrait to a classic, grainy, black and white photograph from the 1950s." },
        { name: 'To Male', prompt: "Change the gender to male. Realistically modify facial features and hair, while keeping the person's identity recognizable." },
        { name: 'To Female', prompt: "Change the gender to female. Realistically modify facial features and hair, while keeping the person's identity recognizable." },
        { name: 'Cartoonify', prompt: "Turn this portrait into a stylized 3D cartoon character, while retaining their likeness." },
    ];

    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl shadow-2xl mx-auto relative overflow-hidden">
            {isLoading && <Loader message="AI is transforming your portrait..." />}
             <p className="text-[var(--text-secondary)] text-center text-sm mb-4">Transform portraits with one-click presets or your own creative instructions.</p>
            
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
                        <p className="mt-2 font-semibold text-sm">{isDragging ? "Drop your image" : "Upload a Portrait"}</p>
                    </div>
                    <input ref={fileInputRef} id="image-upload-portrait" type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="w-full aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                           {imagePreviewUrl && <img src={imagePreviewUrl} alt="Original preview" className="w-full h-full object-contain" />}
                        </div>
                        <div className="w-full aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                           {resultImageUrl ? <img src={resultImageUrl} alt="Transformed result" className="w-full h-full object-contain" /> : <div className="text-gray-600 text-sm">Result</div> }
                        </div>
                    </div>

                    {resultImageUrl ? (
                        <div className="space-y-3">
                            <button onClick={handleSaveToCollection} className="w-full bg-cyan-500 text-gray-900 font-bold py-2.5 rounded-md hover:opacity-90">Save to Collection</button>
                            <button onClick={handleStartOver} className="w-full text-gray-400 hover:text-white transition-colors text-sm py-1">Start Over</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {presets.map(preset => (
                                        <button key={preset.name} onClick={() => handleTransform(preset.prompt)} disabled={isLoading} className={`w-full text-xs font-bold py-2.5 px-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50`}>
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div className="pt-4 border-t border-[var(--border-color)]">
                                <textarea id="custom-prompt" value={customPrompt} onChange={(e) => setState(prev => ({...prev, customPrompt: e.target.value}))} placeholder="e.g., Change hair to blue..." className="w-full bg-gray-900 border border-[var(--border-color)] rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500" rows={2}></textarea>
                                 <button onClick={() => handleTransform(customPrompt)} disabled={!customPrompt || isLoading} className="w-full mt-2 bg-gray-700 text-white font-bold py-2.5 rounded-md hover:bg-gray-600 disabled:opacity-50">
                                    Apply Custom Edit
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PortraitStudio;