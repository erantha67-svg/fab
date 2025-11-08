import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { Filter, FilterGalleryState } from '../types';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

export const filters: Filter[] = [
    { name: 'None', style: 'none' },
    { name: 'Golden Hour', style: 'sepia(0.3) saturate(1.2) contrast(0.9) brightness(1.1)' },
    { name: 'Forest', style: 'contrast(1.1) saturate(1.1) hue-rotate(-10deg) brightness(0.95)' },
    { name: 'Ocean Deep', style: 'saturate(1.2) contrast(1.1) brightness(1.05) hue-rotate(15deg)' },
    { name: 'Silverstone', style: 'grayscale(1) contrast(1.2) brightness(1.05)' },
    { name: 'Pastel Dream', style: 'saturate(0.7) contrast(0.9) brightness(1.1) sepia(0.1)' },
    { name: 'Urban Cool', style: 'grayscale(0.2) contrast(1.1) brightness(0.9) saturate(1.1)' },
    { name: 'Retro Film', style: 'sepia(0.4) contrast(1.1) brightness(1.05) saturate(1.1)' },
    { name: 'Midnight', style: 'brightness(0.8) contrast(1.2) saturate(0.9) hue-rotate(10deg)' },
    { name: 'Radiant', style: 'brightness(1.15) contrast(1.05) saturate(1.05)' },
    { name: 'Noir', style: 'grayscale(1) contrast(1.4) brightness(0.9)' },
    { name: 'Technicolor', style: 'saturate(1.8) contrast(1.2) hue-rotate(-20deg)' },
    { name: 'Solarize', style: 'invert(0.8) contrast(1.1)' },
    { name: 'Crimson', style: 'sepia(0.2) saturate(1.5) hue-rotate(-25deg) contrast(1.1)' },
    { name: 'Arctic', style: 'saturate(0.1) contrast(1.1) brightness(1.1) sepia(0.1)' }
];


interface FilterGalleryProps {
    onApiError: (error: unknown) => void;
    clearError: () => void;
    state: FilterGalleryState;
    setState: React.Dispatch<React.SetStateAction<FilterGalleryState>>;
}

const FilterGallery: React.FC<FilterGalleryProps> = ({ onApiError, clearError, state, setState }) => {
    const { imageFile, selectedFilter } = state;

    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
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
                selectedFilter: filters[0],
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
    
    const getFilteredImageDataUrl = (): Promise<string> => {
        return new Promise((resolve, reject) => {
             if (!imagePreviewUrl) {
                return reject(new Error("No image to process."));
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error("Could not get canvas context."));
                }

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.filter = selectedFilter.style;
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            };
            img.onerror = () => {
                reject(new Error("Failed to load image for processing."));
            };
            img.src = imagePreviewUrl;
        });
    };
    
    const handleSaveToCollection = async () => {
        const imageName = window.prompt("Enter a name for this filtered image:");
        if (!imageName || !imagePreviewUrl) return;

        try {
            const dataUrl = await getFilteredImageDataUrl();
            const savedImagesRaw = localStorage.getItem('savedImagesCollection');
            const savedImages = savedImagesRaw ? JSON.parse(savedImagesRaw) : [];
            savedImages.push({
                name: imageName,
                dataUrl: dataUrl,
                timestamp: Date.now()
            });
            localStorage.setItem('savedImagesCollection', JSON.stringify(savedImages));
            alert(`'${imageName}' saved successfully!`);
        } catch (error) {
            onApiError(error);
        }
    };

    const handleStartOver = () => {
        setState({
            imageFile: null,
            selectedFilter: filters[0],
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        clearError();
    };

    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl shadow-2xl mx-auto relative overflow-hidden">
            <p className="text-[var(--text-secondary)] text-center text-sm mb-4">Apply stunning one-click filters to your images.</p>

            {!imageFile ? (
                <div 
                    className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-cyan-500 bg-gray-800' : 'border-[var(--border-color)] hover:border-gray-600'}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => handleDragEvents(e, true)}
                    onDragLeave={(e) => handleDragEvents(e, false)}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <UploadIcon />
                        <p className="mt-2 font-semibold text-sm">
                            {isDragging ? "Drop your image" : "Upload an Image"}
                        </p>
                    </div>
                     <input ref={fileInputRef} id="image-upload-filter" type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="w-full aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                        {imagePreviewUrl && (
                             <img src={imagePreviewUrl} alt="Filtered preview" className="max-w-full max-h-full object-contain transition-all duration-300" style={{ filter: selectedFilter.style }} />
                        )}
                    </div>

                    <div>
                        <div className="flex overflow-x-auto space-x-3 pb-2">
                            {filters.map(filter => (
                                <div key={filter.name} onClick={() => setState(prev => ({...prev, selectedFilter: filter}))} className="text-center cursor-pointer flex-shrink-0 group">
                                    <div className={`w-20 h-20 bg-gray-800 rounded-md overflow-hidden border-2 transition-all duration-200 ${selectedFilter.name === filter.name ? 'border-cyan-400 scale-105' : 'border-transparent group-hover:border-gray-600'}`}>
                                        {imagePreviewUrl && <img src={imagePreviewUrl} alt={`${filter.name} filter preview`} className="w-full h-full object-cover" style={{ filter: filter.style }} />}
                                    </div>
                                    <p className={`mt-1.5 text-xs font-medium transition-colors ${selectedFilter.name === filter.name ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'}`}>
                                        {filter.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                     <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                        <button onClick={handleSaveToCollection} className="w-full bg-cyan-500 text-gray-900 font-bold py-2.5 px-4 rounded-md hover:opacity-90 transition-opacity">
                            Save to Collection
                        </button>
                         <button onClick={handleStartOver} className="w-full text-center text-gray-400 hover:text-white transition-colors text-sm py-1">
                            Start Over
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterGallery;