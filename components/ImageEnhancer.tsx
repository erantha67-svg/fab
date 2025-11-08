import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { fileToBase64, enhanceImage, dataUrlToFile, getPromptSuggestions } from '../services/geminiService';
import Loader from './Loader';
import { ImageEnhancerState, ManualAdjustments } from '../types';

// Icons for the editor UI
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const PresetsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const AdjustIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100 4m0-4a2 2 0 110 4m0-4v2m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const AiPromptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 17l-4 4 4-4 6.293-6.293a1 1 0 011.414 0L21 12m-4-4l4 4" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const ExtendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SuggestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586zM12 6a1 1 0 100-2 1 1 0 000 2zM12 18a1 1 0 100-2 1 1 0 000 2zM6 12a1 1 0 10-2 0 1 1 0 002 0zM18 12a1 1 0 10-2 0 1 1 0 002 0z" /></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 15l3-3m0 0l-3-3m3 3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// A sample image for preset previews, base64 encoded to avoid external assets.
const SAMPLE_PRESET_IMAGE_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIbGNtcwIQAABtbnRyUkdCIFhZWiAH4gADABQACQAOAB1hY3NwTVNGVAAAAABzYXdzY3RybAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWhhbmSdkQA9QAAAAAAAEnByYVRoY3IAABiUAAAAbW1vZGIAAAAAAHoAAABgAAAAAAAARGVzYwAAAAAAAAAeAAAAa2ZyZ0IAAAAAAABFAAAAa2RkZ2IAAAAAAAB4AAAAVG9sZCYAAAAAAAAAKAAAAGR2ZWdkBgAAAAAKwAAAZHVlZG0AAAAAAAARAAAAhHZpZWcAAAAAAABUAAAAjG1sdWMAAAAAAAAAAQAAAAxlblVTAAAAFAAAAdxkbWRkAAAAAAAAHAAAAdwAAAAAAG1sdWMAAAAAAQAAAAxlblVTAAAARAAAAxBTUkdCLGljYwAAbW1vZGIAAAAAAHoAAABgAAAAAAAARGVzYwAAAAAAAAAeAAAAa2ZyZ0IAAAAAAABFAAAAa2RkZ2IAAAAAAAB4AAAAVG9sZCYAAAAAAAAAKAAAAGR2ZWdkBgAAAAAKwAAAZHVlZG0AAAAAAAARAAAAhHZpZWcAAAAAAABUAAAAjAAAAABYWVogAAAAAAAA9tYAAQAAAADTLVhZWiAAAAAAAABgSQAAhDUAACY/WFlaIAAAAAAAAG+iAAA49gAAA5BYWVogAAAAAAAAYpMAALeIAAAY2lhZWiAAAAAAAAAkoAAAD4UAALbA2N1cnYAAAAAAAAEAAAAAAUACgAPABQAGQAeACMAKAAtADIANwA7AEAARQBKAE8AVABZAGMAZwBqAG4AbwBwAHUAdwB8AIAAjACUAKEAagBGAG8AdwBSAHoAVwB8AIoAigAlAKIAUgB6AIwAiwCJAJIAkQCZAKAAoQCkAKkArQDEAMgA1gDRANoA4ADlAPEA9gD7AQEBBwENARMBGQEfASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4ClAKlAqwCsALKAsoCzALgAuoC7gL7AwMDBwMQAxcDLwM4A0MDTwNaA2YDcgN+A4oDlgOiA64DugPHA9MD4APsA/kEBgQTBCAELQQ7BEgEVQRjBHEEfgSMBJoEqAS2BMQE0wThBPAE/gUNBRwFKwU6BUkFWAVnBXcFgYWMBY0FjAWbBZwFpgW2BeYGBgYWBicGNwZIBlkGagZ7BowGnQavBsAG0QbjBvUHBwcZBysHPQdPB2EHdAeGB5kHrAe/B9IH5Qf4CAsIHwgyCEYIWghuCIIIlgiqCL4I0gjnCPsJEAklCToJTwlkCXkJjwmkCboJzwnlCfsKEQonCj0KVApqCoEKmAquCsUK3ArzCwsLIgs5C1EnLgtnC2kLfguYC7gL3gvsDBIMMgxMDHMMjg1BDVcNYw12DnIOehGcEfgSTBKcEzgTLBNsE4gTmBOkE6ATrBPUE9gT7BQMFBwUVBSsFOgVOBV4FYoVrBWcFdQV+BYYFlgWmBbUFxQXVBeYGBgYWBicGNwZIBlkGagZ7BowGnQavBsAG0QbjBvUHBwcZBysHPQdPB2EHdAeGB5kHrAe/B9IH5Qf4CAwIEggWCDYIQghGCIsIxgjSiOoI8gkeCRoJQQleCbgJrwncCeQJ/goGCiEKGgp4CrEKwgrFCt4LBYsWCysLpgu5i8sL/uyC/oLCgsiCzoLPgvUC94L/wwpDGEMfQyIDKINcw0NDTkNSg1fDWcNeA59DpQOsg6JDqQOuw7cDvQPKw9CD1EPXg96D5YPsw/PD+wQCRAmEEMQYRB+EJsQuRDXEPURExExEU8RbRGMEaoRyRHoEgcSJhJFEmQShBKjEsMS4xMDEyMTQxNjE4MTpBPFE+UUBhQnFEkUahSLFK0UzhTwFRIVNBVWFXgVmxW9FeAWAxYmFkkWbBaPFrIWhb6Fx0XQRdlF4kXrhfSF/cYGxhAGGUYihivGNUY+hkaGUwZthnwGjIaMBp2Gn4ajhrOGsAbSRtJG2YbfBuSG9ob2hveHAYfAxzDHMQc0hziHPAdfh1+HXAfAx/DHyMfQyEDJQMpAy0DNQM/A0YDQ0NPA1oDZgNyA34DigOWA6IDrgO6A8cD0wPgA+wD+QQGBBMEIAQtBDsESARVBGMEcQR+BIwEmgSoBLYExATTBOEE8AT+BQ0FHAUrBToFSQVYBWcFdwWGBYwFjQWMJZgFoAWtBcoF3QYUASAINAloCXoJggn0CgQKagqBCpgK7QskCzkLUgtpC4ALmAuwC94L/wwpDGEMfQyIDKINcw0NDTkNSg1fDWcNeA59DpQOsg6JDqQOuw7cDvQPKw9CD1EPXg96D5YPsw/PD+wQCRAmEEMQYRB+EJsQuRDXEPURExExEU8RbRGMEaoRyRHoEgcSJhJFEmQShBKjEsMS4xMDEyMTQxNjE4MTpBPFE+UUBhQnFEkUahSLFK0UzhTwFRIVNBVWFXgVmxW9FeAWAxYmFkkWbBaPFrIWhb6Fx0XQRdlF4kXrhfSF/cYGxhAGGUYihivGNUY+hkaGUwZthnwGjIaMBp2Gn4ajhrOGsAbSRtJG2YbfBuSG9ob2hveHAYfAxzDHMQc0hziHPAdfh1+HXAfAx/DHyMfQyEDJQMpAy0DNQM/A0YDQ0NPA1oDZgNyA34DigOWA6IDrgO6A8cD0wPgA+wD+QQGBBMEIAQtBDsESARVBGMEcQR+BIwEmgSoBLYExATTBOEE8AT+BQ0FHAUrBToFSQVYBWcFdwWGBYwFjQWMJZgFoAWtBcoF3QYUASAINAloCXoJggn0CgQKagqBCpgK7QskCzkLUgtpC4ALmAuwC94L/wwpDGEMfQyIDKINcw0NDTkNSg1fDWcNeA59DpQOsg6JDqQOuw7cDvQPKw9CD1EPXg96D5YPsw/PD+wQCP/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/ABEIAIAAgAMBIgACEQEDEQH/xAAZAAEBAQEBAQAAAAAAAAAAAAABAgADBAf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAGQEBAQEBAQEAAAAAAAAAAAAAAgEDAAQF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A9QAEFAAAAAAAAAAAAAAAAKAAIAAAAAAAAABQAAAgFAACgAAAAAAAAAAAAgFAAAAAACgAAAA//Z';

interface ImageEnhancerProps {
    onApiError: (error: unknown) => void;
    clearError: () => void;
    state: ImageEnhancerState;
    setState: React.Dispatch<React.SetStateAction<ImageEnhancerState>>;
    onSendToTool: (targetMode: 'portrait' | 'filter', imageDataUrl: string) => void;
}

export const defaultAdjustments: ManualAdjustments = { exposure: 0, highlights: 0, shadows: 0, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, blur: 0, hueRotate: 0, invert: 0 };

const presetCategories = {
    'Enhancements': [
        { name: 'Subtle Boost', prompt: "Slightly increase sharpness, clarity, and vibrancy. Make colors pop naturally without looking oversaturated.", previewStyle: "saturate(1.2) contrast(1.1)" },
        { name: 'Crisp & Clear', prompt: "Denoise the image, enhance details and sharpness for a crisp, high-definition look.", previewStyle: "contrast(1.2) brightness(1.05)" },
        { name: 'Restore Old Photo', prompt: "Restore this old, faded, and scratched photo. Remove scratches, correct color fading, and improve sharpness.", previewStyle: "grayscale(0.5) sepia(0.5) brightness(1.1)" },
    ],
    'Creative Filters': [
        { name: 'Vintage Film', prompt: "Give the image a vintage film look, with faded colors, subtle grain, and a warm tone.", previewStyle: "sepia(0.5) contrast(0.9) brightness(1.05) saturate(0.9)" },
        { name: 'Golden Hour', prompt: "Add a warm, soft, sun-kissed glow to the image, as if it were taken during the golden hour.", previewStyle: "sepia(0.4) saturate(1.2) contrast(0.9) brightness(1.1)" },
        { name: 'Cyberpunk Neon', prompt: "Add neon lighting effects in blues and pinks. Increase contrast for a futuristic, cyberpunk feel.", previewStyle: "hue-rotate(180deg) saturate(1.8) contrast(1.3)" },
    ],
};

const adjustmentControls = [
    { name: 'exposure', label: 'Exposure', min: -100, max: 100, unit: '' },
    { name: 'highlights', label: 'Highlights', min: -100, max: 100, unit: '' },
    { name: 'shadows', label: 'Shadows', min: -100, max: 100, unit: '' },
    { name: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%' },
    { name: 'saturate', label: 'Saturation', min: 0, max: 200, unit: '%' },
    { name: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%' },
    { name: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%' },
    { name: 'invert', label: 'Invert', min: 0, max: 100, unit: '%' },
    { name: 'hueRotate', label: 'Hue Rotate', min: 0, max: 360, unit: 'deg' },
    { name: 'blur', label: 'Blur', min: 0, max: 10, step: 0.1, unit: 'px' },
];

interface HistoryEntry {
    id: number;
    name: string;
    state: ImageEnhancerState;
}

const ImageEnhancer: React.FC<ImageEnhancerProps> = ({ onApiError, clearError, state, setState }) => {
    const { imageFile, resultImageUrl, prompt, adjustments, exportQuality, exportFormat, exportFilename } = state;

    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [activeTool, setActiveTool] = useState<'presets' | 'prompt' | 'adjust' | 'export' | 'extend' | 'history' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const adjustmentsRef = useRef<HTMLDivElement>(null);

    // Batch processing state
    const [batchFiles, setBatchFiles] = useState<File[]>([]);
    const [loaderMessage, setLoaderMessage] = useState("AI is working its magic...");
    
    // History state
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
    
    // Adjustment Undo/Redo state
    const [adjustmentHistory, setAdjustmentHistory] = useState<ManualAdjustments[]>([defaultAdjustments]);
    const [currentAdjustmentHistoryIndex, setCurrentAdjustmentHistoryIndex] = useState(0);

    // Prompt suggestions state
    const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);


    const isBatchMode = batchFiles.length > 0;
    const totalImageCount = 1 + batchFiles.length;
    
    useEffect(() => {
        let objectUrl: string | null = null;
        if (imageFile) {
            objectUrl = URL.createObjectURL(imageFile);
            setImagePreviewUrl(objectUrl);
        } else {
            setImagePreviewUrl(null);
            setActiveTool(null);
        }
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [imageFile]);

    const addHistoryEntry = (name: string, newState: ImageEnhancerState) => {
        const truncatedHistory = history.slice(0, currentHistoryIndex + 1);
        const newEntry = { name, state: newState, id: Date.now() };
        setHistory([...truncatedHistory, newEntry]);
        setCurrentHistoryIndex(truncatedHistory.length);
    };
    
    const handleRevertToHistory = (index: number) => {
        if (index >= 0 && index < history.length) {
            const revertedState = history[index].state;
            setState(revertedState);
            setCurrentHistoryIndex(index);
            // Reset adjustment history to the reverted state
            setAdjustmentHistory([revertedState.adjustments]);
            setCurrentAdjustmentHistoryIndex(0);
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (files && files.length > 0) {
            const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
            if (imageFiles.length === 0) return;

            const firstFile = imageFiles[0];
            const baseFilename = firstFile.name.substring(0, firstFile.name.lastIndexOf('.')) || 'my-creation';
            
            clearError();
            const initialState: ImageEnhancerState = {
                imageFile: firstFile, resultImageUrl: null, prompt: '',
                adjustments: defaultAdjustments, exportQuality: 'medium',
                exportFormat: 'jpeg', exportFilename: baseFilename,
            };
            setState(initialState);
            setBatchFiles(imageFiles.length > 1 ? imageFiles.slice(1) : []);
            
            // Initialize history
            setHistory([{ name: 'Initial State', state: initialState, id: Date.now() }]);
            setCurrentHistoryIndex(0);
             // Initialize adjustment history
            setAdjustmentHistory([defaultAdjustments]);
            setCurrentAdjustmentHistoryIndex(0);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files);
    const handleDragEvents = (e: DragEvent<HTMLDivElement>, isOver: boolean) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(isOver);
    };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        handleDragEvents(e, false); handleFileSelect(e.dataTransfer.files);
    };
    
    const handleEnhance = async (preset?: {name: string, prompt: string}) => {
        const finalPrompt = preset?.prompt || prompt;
        if (!imageFile || !finalPrompt) {
            onApiError(new Error('Please provide an editing prompt or select a preset.'));
            return;
        }
        clearError();
        setIsLoading(true);
        setLoaderMessage("AI is working its magic...");
        setActiveTool(null);
            
        try {
            const imageBase64 = await fileToBase64(imageFile);
            const resultBase64 = await enhanceImage(finalPrompt, imageBase64, imageFile.type);
            
            const newState: ImageEnhancerState = {
                ...state,
                resultImageUrl: `data:${imageFile.type};base64,${resultBase64}`,
                adjustments: defaultAdjustments,
                prompt: finalPrompt
            };
            setState(newState);
            addHistoryEntry(preset ? `Preset: ${preset.name}` : 'AI Prompt', newState);

            // Reset adjustment history after an AI operation
            setAdjustmentHistory([defaultAdjustments]);
            setCurrentAdjustmentHistoryIndex(0);

        } catch (e) { onApiError(e); } finally { setIsLoading(false); }
    };

    const handleExtendImage = async () => {
        if (!prompt) {
            onApiError(new Error('Please provide a prompt to describe the extension.'));
            setActiveTool('extend');
            return;
        }
        clearError();
        setIsLoading(true);
        setLoaderMessage("Extending your image...");
        setActiveTool(null);

        try {
            const sourceUrl = resultImageUrl || imagePreviewUrl;
            if (!sourceUrl) throw new Error("No image available to extend.");

            const adjustedImage = await getProcessedImageDataUrl(sourceUrl, 'png', 'high');
            const tempFile = await dataUrlToFile(adjustedImage, `temp-extend-${Date.now()}.png`);
            const imageBase64 = await fileToBase64(tempFile);
            
            const extendPrompt = `Extend this image to create a larger scene. The new areas should be filled based on the following description: "${prompt}". Seamlessly blend the original image into the new, wider context, preserving the original's quality and details.`;
            
            const resultBase64 = await enhanceImage(extendPrompt, imageBase64, tempFile.type);
            const newResultUrl = `data:image/png;base64,${resultBase64}`;
            const newImageFile = await dataUrlToFile(newResultUrl, imageFile?.name.replace(/(\.[\w\d_-]+)$/i, '_extended$1') || `extended-image.png`);

            const newState: ImageEnhancerState = {
                ...state,
                resultImageUrl: newResultUrl,
                imageFile: newImageFile,
                adjustments: defaultAdjustments,
            };
            setState(newState);
            addHistoryEntry('Image Extended', newState);

            // Reset adjustment history after an AI operation
            setAdjustmentHistory([defaultAdjustments]);
            setCurrentAdjustmentHistoryIndex(0);

        } catch (e) { onApiError(e); } finally { setIsLoading(false); }
    };
    
    const getProcessedImageDataUrl = (imageUrl: string, format: 'jpeg' | 'png' | 'webp', qualitySetting: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Could not get canvas context."));
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.filter = generateFilterStyle().filter as string;
                ctx.drawImage(img, 0, 0);

                const mimeType = `image/${format}`;
                let qualityValue;

                if (format !== 'png') {
                    const qualityMap = { low: 0.5, medium: 0.75, high: 0.92 };
                    qualityValue = qualityMap[qualitySetting as keyof typeof qualityMap] || 0.75;
                }
                
                resolve(canvas.toDataURL(mimeType, qualityValue));
            };
            img.onerror = () => reject(new Error("Failed to load image for processing."));
            img.src = imageUrl;
        });
    };
    
    const handleSaveToCollection = async () => {
        if (isBatchMode) {
            await handleSaveBatchToCollection();
            return;
        }
        if (!exportFilename) {
            onApiError(new Error("Please enter a filename in the Export settings."));
            setActiveTool('export');
            return;
        }
        
        setIsLoading(true);
        setLoaderMessage("Saving your creation...");
        try {
            const sourceUrl = resultImageUrl || imagePreviewUrl;
            if (!sourceUrl) throw new Error("No image to save");

            const dataUrl = await getProcessedImageDataUrl(sourceUrl, exportFormat, exportQuality);
            const savedImagesRaw = localStorage.getItem('savedImagesCollection');
            const savedImages = savedImagesRaw ? JSON.parse(savedImagesRaw) : [];
            savedImages.unshift({ name: exportFilename, dataUrl, timestamp: Date.now() });
            localStorage.setItem('savedImagesCollection', JSON.stringify(savedImages));
            alert(`'${exportFilename}' saved successfully!`);
        } catch (error) { onApiError(error); } finally { setIsLoading(false); }
    };

    const handleSaveBatchToCollection = async () => {
        const baseName = exportFilename;
        if (!baseName) {
            onApiError(new Error("Please enter a base filename in the Export settings."));
            setActiveTool('export');
            return;
        }

        const allFiles = [imageFile, ...batchFiles].filter(Boolean) as File[];
        const savedImages = JSON.parse(localStorage.getItem('savedImagesCollection') || '[]');
        
        setIsLoading(true);

        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            setLoaderMessage(`Processing image ${i + 1} of ${allFiles.length}...`);
            try {
                let sourceImageUrl: string;
                if (prompt) {
                    const imageBase64 = await fileToBase64(file);
                    const resultBase64 = await enhanceImage(prompt, imageBase64, file.type);
                    sourceImageUrl = `data:${file.type};base64,${resultBase64}`;
                } else {
                    sourceImageUrl = URL.createObjectURL(file);
                }

                const finalDataUrl = await getProcessedImageDataUrl(sourceImageUrl, exportFormat, exportQuality);
                savedImages.unshift({ name: `${baseName}_${i + 1}`, dataUrl: finalDataUrl, timestamp: Date.now() });

                if (!prompt) URL.revokeObjectURL(sourceImageUrl);
            } catch(e) {
                onApiError(new Error(`An error occurred on image ${i + 1}. Batch process stopped.`));
                setIsLoading(false);
                return;
            }
        }

        localStorage.setItem('savedImagesCollection', JSON.stringify(savedImages));
        setIsLoading(false);
        alert(`Batch process complete! ${allFiles.length} images saved to your collection.`);
        handleStartOver();
    };

    const processPresetBatch = async (preset: { name: string; prompt: string }) => {
        const baseName = exportFilename;
        if (!baseName) {
            onApiError(new Error("Please enter a base filename in the Export settings before applying a batch preset."));
            setActiveTool('export');
            return;
        }

        clearError();
        setIsLoading(true);
        setActiveTool(null);
        setState(prev => ({ ...prev, adjustments: defaultAdjustments, prompt: preset.prompt }));

        const allFiles = [imageFile, ...batchFiles].filter(Boolean) as File[];
        const savedImages = JSON.parse(localStorage.getItem('savedImagesCollection') || '[]');

        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            setLoaderMessage(`Applying "${preset.name}" to image ${i + 1} of ${allFiles.length}...`);
            try {
                const imageBase64 = await fileToBase64(file);
                const resultBase64 = await enhanceImage(preset.prompt, imageBase64, file.type);
                const sourceImageUrl = `data:${file.type};base64,${resultBase64}`;

                const finalDataUrl = await getProcessedImageDataUrl(sourceImageUrl, exportFormat, exportQuality);
                savedImages.unshift({ name: `${baseName}_${i + 1}`, dataUrl: finalDataUrl, timestamp: Date.now() });

            } catch (e) {
                onApiError(new Error(`An error occurred on image ${i + 1}. Batch process stopped.`));
                setIsLoading(false);
                return;
            }
        }

        localStorage.setItem('savedImagesCollection', JSON.stringify(savedImages));
        setIsLoading(false);
        alert(`Batch process complete! All ${allFiles.length} images with the "${preset.name}" preset have been saved.`);
        handleStartOver();
    };
    
    const handlePresetClick = (preset: { name: string; prompt: string }) => {
        if (isBatchMode) {
            processPresetBatch(preset);
        } else {
            handleEnhance(preset);
        }
    };

    const handleStartOver = () => {
        setState({ 
            imageFile: null, resultImageUrl: null, prompt: '', 
            adjustments: defaultAdjustments, exportQuality: 'medium',
            exportFormat: 'jpeg', exportFilename: 'my-creation',
        });
        setBatchFiles([]);
        setHistory([]);
        setCurrentHistoryIndex(-1);
        // Reset adjustment history
        setAdjustmentHistory([defaultAdjustments]);
        setCurrentAdjustmentHistoryIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        clearError();
    };

    const handleAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setState(prev => ({ ...prev, adjustments: { ...prev.adjustments, [name]: Number(value) } }));
    };

    const handleSuggestPrompts = async () => {
        clearError();
        setIsSuggesting(true);
        setPromptSuggestions([]); // Clear old suggestions
        try {
            const sourceUrl = resultImageUrl || imagePreviewUrl;
            if (!sourceUrl) throw new Error("No image available to analyze.");
    
            // We need a File object to get mimeType and base64
            const currentFile = resultImageUrl ? await dataUrlToFile(resultImageUrl, 'current-view.png') : imageFile;
            if (!currentFile) throw new Error("Could not create file from image data.");
    
            const imageBase64 = await fileToBase64(currentFile);
            const suggestions = await getPromptSuggestions(imageBase64, currentFile.type);
            setPromptSuggestions(suggestions);
        } catch (e) {
            onApiError(e);
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleAdjustmentEnd = () => {
        const lastSavedAdjustments = adjustmentHistory[currentAdjustmentHistoryIndex];
        if (JSON.stringify(lastSavedAdjustments) !== JSON.stringify(adjustments)) {
            const newHistory = adjustmentHistory.slice(0, currentAdjustmentHistoryIndex + 1);
            newHistory.push(adjustments);
            setAdjustmentHistory(newHistory);
            setCurrentAdjustmentHistoryIndex(newHistory.length - 1);
        }
    };

    const handleUndo = () => {
        if (currentAdjustmentHistoryIndex > 0) {
            const newIndex = currentAdjustmentHistoryIndex - 1;
            setState(prev => ({ ...prev, adjustments: adjustmentHistory[newIndex] }));
            setCurrentAdjustmentHistoryIndex(newIndex);
        }
    };
    
    const handleRedo = () => {
        if (currentAdjustmentHistoryIndex < adjustmentHistory.length - 1) {
            const newIndex = currentAdjustmentHistoryIndex + 1;
            setState(prev => ({ ...prev, adjustments: adjustmentHistory[newIndex] }));
            setCurrentAdjustmentHistoryIndex(newIndex);
        }
    };

    const generateFilterStyle = (): React.CSSProperties => {
        const { exposure, highlights, shadows, contrast, saturate, sepia, grayscale, blur, hueRotate, invert } = adjustments;
        
        // A simple approximation for highlights and shadows using brightness and contrast
        const finalBrightness = 100 + exposure + (highlights / 2) + (shadows / 2);
        const finalContrast = contrast + (highlights / 2) - (shadows / 2);

        const filters = [
            `brightness(${Math.max(0, finalBrightness)}%)`, 
            `contrast(${Math.max(0, finalContrast)}%)`, 
            `saturate(${saturate}%)`, 
            `sepia(${sepia}%)`, 
            `grayscale(${grayscale}%)`, 
            `blur(${blur}px)`, 
            `hue-rotate(${hueRotate}deg)`, 
            `invert(${invert}%)`
        ];
        return { filter: filters.join(' ') };
    };

    const toggleTool = (tool: 'presets' | 'prompt' | 'adjust' | 'export' | 'extend' | 'history') => {
        // When closing the adjust tool, snapshot the final adjustments to the main history if they changed.
        if (activeTool === 'adjust' && tool !== 'adjust') {
            const lastMajorHistoryState = history[currentHistoryIndex]?.state;
            if (lastMajorHistoryState && JSON.stringify(lastMajorHistoryState.adjustments) !== JSON.stringify(state.adjustments)) {
                addHistoryEntry('Adjustments', state);
            }
        }
        setActiveTool(activeTool === tool ? null : tool);
        setPromptSuggestions([]);
    };

    if (!imageFile) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div 
                    className={`relative w-full max-w-sm mx-auto aspect-video bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-cyan-400' : 'border-[var(--border-color)]'}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => handleDragEvents(e, true)}
                    onDragLeave={(e) => handleDragEvents(e, false)}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center text-gray-400 cursor-pointer p-4">
                        <UploadIcon />
                        <p className="mt-2 font-semibold text-sm">{isDragging ? "Drop your image(s)" : "Upload image(s)"}</p>
                        <p className="text-xs">or drag & drop</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" multiple />
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-[calc(100vh-140px)] flex flex-col text-white relative -m-4 bg-[var(--bg-primary)]">
            {isLoading && <Loader message={loaderMessage} />}
            <header className="flex justify-between items-center p-4 flex-shrink-0 bg-[var(--bg-primary)]">
                <button onClick={handleStartOver} className="text-sm text-gray-300 hover:text-white">Cancel</button>
                <h2 className="font-bold text-base">Edit</h2>
                <button onClick={handleSaveToCollection} className="text-sm font-bold text-cyan-400 hover:text-cyan-300">
                    {isBatchMode ? `Save Batch (${totalImageCount})` : 'Save'}
                </button>
            </header>

            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
                <img src={resultImageUrl || imagePreviewUrl || ''} alt="Preview" className="max-w-full max-h-full object-contain" style={generateFilterStyle()} />
            </div>

            {isBatchMode && (
                <div className="flex-shrink-0 bg-gray-900/50 text-center py-2 px-4">
                    <p className="text-sm font-medium text-cyan-300">
                        Batch Mode: 1 of {totalImageCount} shown. Edits will apply to all images.
                    </p>
                </div>
            )}

            {activeTool && (
                <div className="flex-shrink-0 bg-[var(--bg-secondary)] p-4 rounded-t-xl">
                    {activeTool === 'presets' && (
                        <div>
                            {Object.entries(presetCategories).map(([category, presets]) => (
                                <div key={category} className="mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">{category}</h3>
                                    <div className="flex overflow-x-auto space-x-3 pb-2">
                                        {presets.map(p => (
                                            <div key={p.name} onClick={() => handlePresetClick(p)} className="text-center cursor-pointer flex-shrink-0 group">
                                                <div className="w-20 h-20 bg-gray-800 rounded-md overflow-hidden border-2 border-transparent group-hover:border-gray-600"><img src={SAMPLE_PRESET_IMAGE_URL} alt={p.name} className="w-full h-full object-cover" style={{ filter: p.previewStyle }} /></div>
                                                <p className="mt-1.5 text-xs text-gray-300">{p.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTool === 'prompt' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Prompt</h3>
                                <button 
                                    onClick={handleSuggestPrompts} 
                                    disabled={isSuggesting}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-wait transition-colors"
                                >
                                    {isSuggesting ? (
                                        <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : <SuggestIcon />}
                                    <span>{isSuggesting ? 'Thinking...' : 'Suggest Ideas'}</span>
                                </button>
                            </div>
                            <textarea value={prompt} onChange={(e) => setState(prev => ({...prev, prompt: e.target.value}))} placeholder="e.g., Make the sky dramatic and moody..." className="w-full bg-gray-900 border border-[var(--border-color)] rounded-md p-2 focus:ring-2 focus:ring-cyan-500 transition" rows={2}></textarea>
                            
                            {promptSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {promptSuggestions.map((s, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setState(prev => ({...prev, prompt: s}))}
                                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded-full transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            <button onClick={() => handleEnhance()} disabled={!prompt} className="w-full bg-cyan-500 text-gray-900 font-semibold py-2.5 rounded-md disabled:opacity-50 transition-transform hover:scale-105">
                                {isBatchMode ? 'Apply AI to Preview' : 'Apply AI Edit'}
                            </button>
                        </div>
                    )}
                    {activeTool === 'adjust' && (
                         <div className="space-y-3">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manual Adjustments</h3>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleUndo} 
                                        disabled={currentAdjustmentHistoryIndex <= 0}
                                        className="p-1 rounded-full text-gray-300 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Undo Adjustment"
                                    >
                                        <UndoIcon />
                                    </button>
                                    <button 
                                        onClick={handleRedo} 
                                        disabled={currentAdjustmentHistoryIndex >= adjustmentHistory.length - 1}
                                        className="p-1 rounded-full text-gray-300 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Redo Adjustment"
                                    >
                                        <RedoIcon />
                                    </button>
                                </div>
                            </div>
                            <div 
                                ref={adjustmentsRef} 
                                onMouseUp={handleAdjustmentEnd}
                                onTouchEnd={handleAdjustmentEnd}
                                className="grid grid-cols-2 gap-x-4 gap-y-3 max-h-48 overflow-y-auto"
                            >
                                {adjustmentControls.map(c => (
                                    <div key={c.name}>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">{c.label}</label>
                                        <input name={c.name} type="range" min={c.min} max={c.max} step={c.step || 1} value={adjustments[c.name as keyof ManualAdjustments]} onChange={handleAdjustmentChange} className="w-full custom-range" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                     {activeTool === 'extend' && (
                        <div className="space-y-3">
                             <textarea 
                                value={prompt} 
                                onChange={(e) => setState(prev => ({...prev, prompt: e.target.value}))} 
                                placeholder="e.g., a beautiful garden with a pond..." 
                                className="w-full bg-gray-900 border border-[var(--border-color)] rounded-md p-2 focus:ring-2 focus:ring-cyan-500 transition" 
                                rows={2}
                            ></textarea>
                            <button onClick={handleExtendImage} disabled={!prompt} className="w-full bg-cyan-500 text-gray-900 font-semibold py-2.5 rounded-md disabled:opacity-50 transition-transform hover:scale-105">
                                Generate Extension
                            </button>
                        </div>
                    )}
                    {activeTool === 'history' && (
                        <div className="max-h-48 overflow-y-auto">
                           <ul className="space-y-1">
                                {history.map((entry, index) => (
                                    <li key={entry.id}>
                                        <button 
                                            onClick={() => handleRevertToHistory(index)}
                                            className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${currentHistoryIndex === index ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-gray-300 hover:bg-gray-700'}`}
                                        >
                                            {entry.name}
                                        </button>
                                    </li>
                                )).reverse()}
                           </ul>
                        </div>
                    )}
                    {activeTool === 'export' && (
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                             <div>
                                <label htmlFor="filename" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filename</label>
                                <input 
                                    id="filename"
                                    type="text"
                                    value={exportFilename}
                                    onChange={(e) => setState(prev => ({...prev, exportFilename: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')}))}
                                    className="w-full bg-gray-900 border border-[var(--border-color)] rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 transition"
                                    placeholder="Enter filename..."
                                />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Format</h3>
                                <div className="flex justify-around bg-gray-900 rounded-lg p-1">
                                    {(['jpeg', 'png', 'webp'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setState(prev => ({...prev, exportFormat: f}))}
                                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-full ${exportFormat === f ? 'bg-cyan-500 text-gray-900' : 'text-gray-300 hover:bg-gray-700'}`}
                                        >
                                            {f.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={`${exportFormat === 'png' ? 'opacity-50' : ''}`}>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quality</h3>
                                <div className="flex justify-around bg-gray-900 rounded-lg p-1">
                                    {(['low', 'medium', 'high'] as const).map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setState(prev => ({...prev, exportQuality: q}))}
                                            disabled={exportFormat === 'png'}
                                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-full ${exportQuality === q && exportFormat !== 'png' ? 'bg-cyan-500 text-gray-900' : 'text-gray-300 hover:bg-gray-700'} disabled:cursor-not-allowed`}
                                        >
                                            {q.charAt(0).toUpperCase() + q.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-2">
                                     {exportFormat === 'png'
                                        ? "Quality setting is not applicable for PNG format."
                                        : "Lower quality results in a smaller file size."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <footer className="grid grid-cols-6 items-center bg-[var(--bg-secondary)] py-3 border-t border-[var(--border-color)] flex-shrink-0">
                <button onClick={() => toggleTool('presets')} className={`flex flex-col items-center gap-1 w-full ${activeTool === 'presets' ? 'text-cyan-400' : 'text-gray-400'}`}> <PresetsIcon /> <span className="text-xs">Presets</span></button>
                <button onClick={() => toggleTool('adjust')} className={`flex flex-col items-center gap-1 w-full ${activeTool === 'adjust' ? 'text-cyan-400' : 'text-gray-400'}`}><AdjustIcon /> <span className="text-xs">Adjust</span></button>
                <button onClick={() => toggleTool('prompt')} className={`flex flex-col items-center gap-1 w-full ${activeTool === 'prompt' ? 'text-cyan-400' : 'text-gray-400'}`}><AiPromptIcon /> <span className="text-xs">AI Prompt</span></button>
                <button onClick={() => toggleTool('extend')} className={`flex flex-col items-center gap-1 w-full ${activeTool === 'extend' ? 'text-cyan-400' : 'text-gray-400'}`}><ExtendIcon /> <span className="text-xs">Extend</span></button>
                <button onClick={() => toggleTool('history')} className={`flex flex-col items-center gap-1 w-full ${activeTool === 'history' ? 'text-cyan-400' : 'text-gray-400'}`}><HistoryIcon /> <span className="text-xs">History</span></button>
                <button onClick={() => toggleTool('export')} className={`flex flex-col items-center gap-1 w-full ${activeTool === 'export' ? 'text-cyan-400' : 'text-gray-400'}`}><ExportIcon /> <span className="text-xs">Export</span></button>
            </footer>
        </div>
    );
};

export default ImageEnhancer;