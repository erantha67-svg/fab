import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

// Utility to convert a file to a base64 string
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove 'data:image/jpeg;base64,' prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const enhanceImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API key not found");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    // Safely access the image data using optional chaining
    const generatedImagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (generatedImagePart && generatedImagePart.inlineData) {
        return generatedImagePart.inlineData.data;
    }

    // If no image is found, provide a more informative error.
    // This could be due to safety blocking or other issues.
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
         throw new Error(`Request was blocked due to: ${blockReason}. Please adjust your prompt or image.`);
    }

    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("The AI did not return a response. This could be due to a network issue, an invalid API key, or a content policy violation.");
    }
    
    const textResponse = response.text;
    if (textResponse) {
        throw new Error(`Image generation failed. AI response: ${textResponse}`);
    }

    throw new Error("Image generation failed. The AI did not return an image. Please try a different prompt or image.");
};

export const getPromptSuggestions = async (imageBase64: string, mimeType: string): Promise<string[]> => {
    if (!process.env.API_KEY) throw new Error("API key not found");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const metaPrompt = `Analyze this image and suggest 4 creative editing prompts for an AI image editor.
    The prompts should be short, actionable, and diverse, focusing on style, content, or atmosphere.
    Examples: "Make the sky a dramatic sunset", "Add a vintage film look", "Turn this into a fantasy landscape".
    Return the suggestions as a JSON array of strings, like this: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType,
                    },
                },
                {
                    text: metaPrompt,
                },
            ],
        },
        config: {
            responseMimeType: "application/json",
        },
    });

    try {
        const jsonText = response.text.trim();
        const suggestions = JSON.parse(jsonText);
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        throw new Error("Invalid JSON format for suggestions.");
    } catch (e) {
        console.error("Failed to parse prompt suggestions:", e);
        throw new Error("The AI returned an unexpected format for suggestions. Please try again.");
    }
};


// Utility to convert a data URL to a File object
export const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const mimeType = blob.type || 'image/png'; // Fallback MIME type
  return new File([blob], filename, { type: mimeType });
};