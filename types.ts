// For ImageEnhancer
export interface ManualAdjustments {
    brightness: number;
    contrast: number;
    saturate: number;
    sepia: number;
    grayscale: number;
    blur: number;
    hueRotate: number;
    invert: number;
}

export interface ImageEnhancerState {
    imageFile: File | null;
    resultImageUrl: string | null;
    prompt: string;
    adjustments: ManualAdjustments;
    exportQuality: string;
    exportFormat: 'jpeg' | 'png' | 'webp';
    exportFilename: string;
}

// For PortraitStudio
export interface PortraitStudioState {
    imageFile: File | null;
    resultImageUrl: string | null;
    customPrompt: string;
    exportQuality: string;
}

// For BackgroundRemover
export interface BackgroundRemoverState {
    imageFile: File | null;
    resultImageUrl: string | null;
}

// For FilterGallery
export interface Filter {
    name: string;
    style: string;
}
export interface FilterGalleryState {
    imageFile: File | null;
    selectedFilter: Filter;
}