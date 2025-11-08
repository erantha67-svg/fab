import React, { useState, useEffect } from 'react';

// --- SVG Icons ---
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const EmptyCollectionIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

// --- Types ---
interface SavedItem {
    name: string;
    dataUrl: string;
    timestamp: number;
}

// --- Component ---
const Gallery: React.FC = () => {
    const [collection, setCollection] = useState<SavedItem[]>([]);

    useEffect(() => {
        loadCollection();
    }, []);
    
    const loadCollection = () => {
        try {
            const savedImagesRaw = localStorage.getItem('savedImagesCollection');
            if (savedImagesRaw) {
                const savedImages: SavedItem[] = JSON.parse(savedImagesRaw);
                savedImages.sort((a, b) => b.timestamp - a.timestamp);
                setCollection(savedImages);
            }
        } catch (error) {
            console.error("Failed to load collection from localStorage:", error);
            setCollection([]);
        }
    };

    const handleDelete = (timestamp: number, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            const updatedCollection = collection.filter(item => item.timestamp !== timestamp);
            setCollection(updatedCollection);
            localStorage.setItem('savedImagesCollection', JSON.stringify(updatedCollection));
        }
    };

    const handleDownload = (item: SavedItem) => {
        const a = document.createElement('a');
        a.href = item.dataUrl;
        const mimeType = item.dataUrl.match(/:(.*?);/)?.[1] ?? 'image/png';
        const extension = mimeType.split('/')[1] ?? 'png';
        a.download = `${item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (collection.length === 0) {
        return (
            <div className="text-center border-2 border-dashed border-[var(--border-color)] rounded-lg py-16 px-6 bg-[var(--bg-secondary)]">
                <EmptyCollectionIcon />
                <h3 className="mt-4 text-lg font-semibold text-gray-300">Your collection is empty</h3>
                <p className="mt-2 text-gray-400 text-sm">
                    Use the "Save" button in the editor to add your creations here.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            {collection.map(item => (
                <div key={item.timestamp} className="bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-color)] flex flex-col">
                    <div className="w-full aspect-square bg-black">
                        <img src={item.dataUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                     <div className="p-2 flex-grow flex flex-col justify-between">
                        <div>
                            <p className="font-bold text-xs text-gray-200 truncate" title={item.name}>{item.name}</p>
                            <p className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <button 
                                onClick={() => handleDownload(item)} 
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white font-semibold py-1.5 px-2 rounded-md transition-colors text-xs"
                                title="Download"
                            >
                                <DownloadIcon />
                            </button>
                            <button 
                                onClick={() => handleDelete(item.timestamp, item.name)} 
                                className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 font-bold rounded-md transition-colors"
                                title="Delete"
                            >
                                <DeleteIcon />
                            </button>
                       </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Gallery;