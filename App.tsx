import React, { useState } from 'react';
import ImageEnhancer, { defaultAdjustments } from './components/ImageEnhancer';
import PortraitStudio from './components/PortraitStudio';
import FilterGallery, { filters } from './components/FilterGallery';
import Gallery from './components/Gallery';
import BackgroundRemover from './components/BackgroundRemover';
import { ImageEnhancerState, PortraitStudioState, FilterGalleryState, BackgroundRemoverState } from './types';
import { dataUrlToFile } from './services/geminiService';
import Logo from './components/Logo';

type AppMode = 'image' | 'portrait' | 'background' | 'filter' | 'gallery';

// SVG Icons for New Navigation
const ImageEnhancerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 17l-4 4 4-4 6.293-6.293a1 1 0 011.414 0L21 12m-4-4l4 4" /></svg>;
const PortraitStudioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BackgroundRemoverIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 20C18 17.7909 15.3137 16 12 16C8.68629 16 6 17.7909 6 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 4L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20 4L20 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20 20L20 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 20L4 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 4L4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M17 4L20 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M17 20L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 20L4 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const FilterGalleryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100 4m0-4a2 2 0 110 4m0-4v2m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const GalleryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const navItems: { id: AppMode; label: string; icon: React.FC }[] = [
    { id: 'gallery', label: 'Collection', icon: GalleryIcon },
    { id: 'filter', label: 'Filters', icon: FilterGalleryIcon },
    { id: 'image', label: 'Edit', icon: ImageEnhancerIcon },
    { id: 'portrait', label: 'Portrait', icon: PortraitStudioIcon },
    { id: 'background', label: 'Cutout', icon: BackgroundRemoverIcon },
];

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('image');
    const [error, setError] = useState<string | null>(null);
    
    const [imageEnhancerState, setImageEnhancerState] = useState<ImageEnhancerState>({
        imageFile: null,
        resultImageUrl: null,
        prompt: '',
        adjustments: defaultAdjustments,
        exportQuality: 'medium',
        exportFormat: 'jpeg',
        exportFilename: 'my-creation',
    });
    
    const [portraitStudioState, setPortraitStudioState] = useState<PortraitStudioState>({
        imageFile: null,
        resultImageUrl: null,
        customPrompt: '',
        exportQuality: 'original',
    });

    const [backgroundRemoverState, setBackgroundRemoverState] = useState<BackgroundRemoverState>({
        imageFile: null,
        resultImageUrl: null,
    });

    const [filterGalleryState, setFilterGalleryState] = useState<FilterGalleryState>({
        imageFile: null,
        selectedFilter: filters[0],
    });
    
    const handleApiError = (e: unknown) => {
        let message = 'An unknown error occurred.';
        if (e instanceof Error) {
            message = e.message;
            if (message.includes('quota')) {
                message = "You've exceeded your API quota. Please check your plan and billing details.";
            } else if (message.includes('Requested entity was not found')) {
                message = 'API Key not found or invalid. Please select a valid key.';
            }
        }
        setError(message);
        console.error(e);
    };

    const clearError = () => setError(null);

    const handleSendToTool = async (targetMode: AppMode, imageDataUrl: string) => {
        clearError();
        try {
            const filename = `edited-image-${Date.now()}.png`;
            const file = await dataUrlToFile(imageDataUrl, filename);
            const baseFilename = file.name.substring(0, file.name.lastIndexOf('.')) || 'edited-image';

            if (targetMode === 'image') {
                setImageEnhancerState({
                    imageFile: file,
                    resultImageUrl: null,
                    prompt: '',
                    adjustments: defaultAdjustments,
                    exportQuality: 'medium',
                    exportFormat: 'jpeg',
                    exportFilename: baseFilename,
                });
            } else if (targetMode === 'portrait') {
                setPortraitStudioState({
                    imageFile: file,
                    resultImageUrl: null,
                    customPrompt: '',
                    exportQuality: 'original',
                });
            } else if (targetMode === 'background') {
                setBackgroundRemoverState({
                    imageFile: file,
                    resultImageUrl: null,
                });
            } else if (targetMode === 'filter') {
                setFilterGalleryState({
                    imageFile: file,
                    selectedFilter: filters[0],
                });
            }
            
            setMode(targetMode);
        } catch (error) {
            handleApiError(error);
        }
    };

    const currentTool = navItems.find(item => item.id === mode);

    return (
        <div className="max-w-lg mx-auto h-[100dvh] bg-[var(--bg-primary)] flex flex-col shadow-2xl shadow-black overflow-hidden">
            <header className="p-4 flex items-center gap-3 border-b border-[var(--border-color)] text-[var(--text-primary)] flex-shrink-0">
                <Logo />
                <div>
                    <h1 className="text-base font-bold tracking-wide leading-tight">Lumina</h1>
                    <p className="text-xs text-gray-400 leading-tight">{currentTool?.label}</p>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
                <div className="p-4">
                    {error && (
                         <div className="bg-[var(--error-bg)] border border-[var(--error-border)] text-red-400 px-4 py-3 rounded-lg relative mb-6 flex items-start gap-4" role="alert">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <strong className="font-bold">Error Occurred</strong>
                                <span className="block text-sm">{error}</span>
                            </div>
                            <button className="absolute top-3 right-3 text-red-400/70 hover:text-red-400" onClick={clearError}>
                                <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                            </button>
                        </div>
                    )}
                    {mode === 'image' && <ImageEnhancer onApiError={handleApiError} clearError={clearError} state={imageEnhancerState} setState={setImageEnhancerState} onSendToTool={handleSendToTool} />}
                    {mode === 'portrait' && <PortraitStudio onApiError={handleApiError} clearError={clearError} state={portraitStudioState} setState={setPortraitStudioState} onSendToTool={handleSendToTool} />}
                    {mode === 'background' && <BackgroundRemover onApiError={handleApiError} clearError={clearError} state={backgroundRemoverState} setState={setBackgroundRemoverState} onSendToTool={handleSendToTool} />}
                    {mode === 'filter' && <FilterGallery onApiError={handleApiError} clearError={clearError} state={filterGalleryState} setState={setFilterGalleryState} />}
                    {mode === 'gallery' && <Gallery />}
                </div>
            </main>

            <nav className="flex justify-around items-center bg-[var(--bg-secondary)] py-2 border-t border-[var(--border-color)] flex-shrink-0">
                {navItems.map((item, index) => {
                    const isCentralButton = item.id === 'image';
                    if (isCentralButton) {
                        return (
                             <button
                                key={item.id}
                                onClick={() => setMode(item.id)}
                                className={`-mt-8 w-16 h-16 flex items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-cyan-500/30 transition-transform duration-200 ${mode === item.id ? 'scale-110 accent-glow' : 'scale-100'}`}
                                aria-label={item.label}
                            >
                                <item.icon />
                            </button>
                        );
                    }
                    return (
                        <button
                            key={item.id}
                            onClick={() => setMode(item.id)}
                            className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors duration-200 ${mode === item.id ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            <item.icon />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                })}
            </nav>
        </div>
    );
};

export default App;
