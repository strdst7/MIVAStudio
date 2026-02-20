
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Types
export interface ImageAnalysisResult {
    prompt: string;
    caption: string;
}

export interface EditorialCritique {
    strengths: string[];
    weaknesses: string[];
    alternatives: string[];
    suggestions: string[];
}

export interface UGCBrief {
    shotDescription: string;
    imagePrompt: string;
    videoPrompt: string;
    cameraSettings: string;
    lightingConfig: string;
    captionOrHook: string;
}

export interface PromptAnalysisResult {
    critique: string;
    faceAnalysis: string;
    keyTerms: { category: string; term: string; effect: string }[];
    options: { title: string; prompt: string; reasoning: string }[];
}

export type StatusUpdate = (msg: string) => void;

export const MIVA_ANCHOR_PROMPT = "High-end editorial portrait, neutral expression, soft studio lighting.";
export const IDENTITY_BASE_PROMPT = "Consistent identity, facial structure preserved.";
export const STYLE_OVERLAYS: Record<string, string> = {
    ANCHOR: "Clean, sharp focus, 85mm lens, soft diffused daylight.",
    SKIN_REALISM: "Hyper-detailed skin texture, pores, peach fuzz, subsurface scattering, translucent skin tone.",
    IT_GIRL: "High-fashion editorial, flash photography, controlled lighting, elite restraint.",
    INFLUENCER: "Lifestyle realism, candid luxury, natural light, social media aesthetic.",
    MOOD: "Cinematic, moody lighting, color graded, volumetric shadows, deep contrast."
};

const MIVA_ARCHETYPE_RULES = `
────────────────────────────────
MIVA WOMAN — CORE IDENTITY (HARD-CODED)
────────────────────────────────
The MIVA Woman embodies quiet power, refined intelligence, and timeless elegance.
She does not perform for attention. Her presence is intentional and unmistakably elite.

VISUAL BEHAVIOR RULES:
- Facial Expression: Neutral to soft, calm eyes. No exaggerated smiling.
- Body Language: Relaxed shoulders, controlled posture. Stillness preferred.

PHOTOREALISM STANDARDS (8K RAW OPTICS):
- Skin Architecture: Clearly visible pores with realistic distribution, fine follicle structure, and soft vellus hairs (peach fuzz). 
- Micro-Shadows: Physically accurate micro-shadows between skin texture and vellus hair follicles.
- Rendering: Subsurface scattering (SSS) within the skin, anisotropic highlights on hair and naturally moisturized areas. 
- Authenticity: Retain minor imperfections, faint capillaries, and a gentle hydrated glow across high points (nose, cheekbones).
- Flyaways: Delicate flyaways and micro-hairs caught subtly by rim lighting.
- Lighting: Physically accurate falloff, soft rim lighting, natural window light or controlled studio flash.
- Camera: 85mm or 50mm lenses, shallow depth of field (f1.8), organic natural film grain to evoke RAW photographic capture.

PROHIBITED: Over-sexualization, loud colors, cheap fabrics, "AI-smooth" skin, generic smiling.
`;

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

async function fileToPart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Enhanced retry logic with granular status reporting for UI.
 */
const callWithRetry = async <T>(
    fn: () => Promise<T>, 
    retries = 4, 
    delay = 2000,
    onStatus?: StatusUpdate
): Promise<T> => {
    try {
        return await fn();
    } catch (e: any) {
        const errorMessage = e?.message || JSON.stringify(e);
        const lowerMsg = errorMessage.toLowerCase();
        const isRateLimit = lowerMsg.includes("429") || lowerMsg.includes("quota") || lowerMsg.includes("exhausted");
        
        if (retries > 0 && isRateLimit) {
            // Try to extract seconds from message or use default delay
            const retryMatch = errorMessage.match(/retry in ([\d.]+)s/);
            const waitSeconds = retryMatch ? parseFloat(retryMatch[1]) : (delay / 1000);
            
            // Add a generous buffer to the wait time to ensure quota has actually reset
            const waitMs = (waitSeconds * 1000) + 2000; 
            
            if (onStatus) onStatus(`Quota limit hit. Cooling down for ${Math.ceil(waitMs/1000)}s...`);
            
            await new Promise(r => setTimeout(r, waitMs));
            
            if (onStatus) onStatus(`Resuming operation (${retries} attempts left)...`);
            // Increase delay for next retry in case of subsequent failures
            return callWithRetry(fn, retries - 1, delay * 2, onStatus);
        }
        
        if (lowerMsg.includes("requested entity was not found")) {
            throw new Error("Identity access expired. Please re-authenticate your API key.");
        }
        
        throw e;
    }
};

function parseJSONSafe(text: string) {
    if (!text) return null;
    let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        try {
            const relaxed = cleaned.replace(/,\s*([\]}])/g, '$1');
            return JSON.parse(relaxed);
        } catch (e2) {
            return null;
        }
    }
}

export const enhanceUserPrompt = async (
    prompt: string, 
    context?: { platform: string; theme: string; shotType: string },
    onStatus?: StatusUpdate
): Promise<string> => {
    const ai = getAI();
    if (onStatus) onStatus("Initializing prompt refinement engine...");
    
    const systemInstruction = `You are MIVA Studio’s Visual Identity Engine.
    ${MIVA_ARCHETYPE_RULES}
    TASK: Refine input for maximum photorealism.
    Inject technical descriptors: vellus hair, subsurface scattering, visible pores, anisotropic highlights, fine follicle structure, and RAW film grain.
    Ensure the output retains a 'Quiet Luxury' aesthetic.
    Return ONLY the refined prompt text.`;
    
    const contextBlock = context ? `Context: ${context.platform}, Theme: ${context.theme}, Shot: ${context.shotType}.` : '';
    
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Original Input: "${prompt}"\n${contextBlock}\nGenerate Refined MIVA Prompt:`,
        config: { systemInstruction, temperature: 0.7 }
    }), 3, 2000, onStatus);

    if (onStatus) onStatus("Prompt refinement complete.");
    return response.text?.trim() || prompt;
};

export const generateImage = async (
    prompt: string, 
    identityImage?: File, 
    resolution: '1K' | '2K' | '4K' = '1K',
    aspectRatio: string = '1:1',
    onStatus?: StatusUpdate
): Promise<string> => {
    const ai = getAI();
    const model = 'gemini-3-pro-image-preview';
    const config: any = { imageConfig: { imageSize: resolution, aspectRatio } };
    const parts: any[] = [];
    
    if (onStatus) onStatus(`Preparing synthesis at ${resolution}...`);

    if (identityImage) {
        if (onStatus) onStatus("Mapping facial geometry...");
        parts.push(await fileToPart(identityImage));
        const lockInstruction = "REFERENCE_IDENTITY: Maintain identical facial structure. Authentic skin textures with vellus hair, subsurface scattering, micro-shadows, and clearly visible pores.";
        parts.push({ text: `${lockInstruction}\n\n${prompt}` });
    } else {
        parts.push({ text: prompt });
    }

    if (onStatus) onStatus("Synthesizing pixels...");
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({ model, contents: { parts }, config }), 3, 3000, onStatus);
    
    if (onStatus) onStatus("Decoding asset stream...");
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Synthesis failure: Pixel buffer empty.");
};

export const generateImageVariations = async (
    prompt: string, 
    count: number = 3, 
    identityImage?: File, 
    resolution: '1K' | '2K' | '4K' = '1K',
    aspectRatio: string = '1:1',
    onStatus?: StatusUpdate
): Promise<string[]> => {
    const results: string[] = [];
    const errors: string[] = [];

    // Execute sequentially to avoid rate limits on the free tier (429 Resource Exhausted)
    for (let i = 0; i < count; i++) {
        try {
            if (onStatus) onStatus(`Generating variation ${i + 1} of ${count}...`);
            const image = await generateImage(prompt, identityImage, resolution, aspectRatio, (msg) => {
                if (onStatus) onStatus(`[Var ${i+1}] ${msg}`);
            });
            results.push(image);
        } catch (e: any) {
            console.error(`Variation ${i + 1} failed:`, e);
            errors.push(e.message || String(e));
            // If we hit a rate limit even with retries, waiting a small buffer before next item might help
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    if (results.length === 0) {
        const lastError = errors.length > 0 ? errors[errors.length - 1] : "Unknown error";
        throw new Error(`All variations failed. Last error: ${lastError}`);
    }

    return results;
};

export const generateFilteredImage = async (
    image: File, 
    prompt: string, 
    identityImage?: File, 
    isBatch?: boolean,
    onStatus?: StatusUpdate
): Promise<string> => {
    const ai = getAI();
    if (onStatus) onStatus("Loading source asset...");
    const parts: any[] = [await fileToPart(image)];
    if (identityImage) parts.push(await fileToPart(identityImage));
    
    parts.push({ text: `Style Re-synthesis: ${prompt}. Maintain identity architecture and RAW photographic realism with authentic skin follicle structure and micro-shadowing.` });
    
    if (onStatus) onStatus("Applying aesthetic layers...");
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts } }), 3, 2000, onStatus);
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Aesthetic re-synthesis failed.");
};

export const generateAdjustedImage = async (image: File, prompt: string, onStatus?: StatusUpdate): Promise<string> => 
    generateFilteredImage(image, `Precision tonal adjustment: ${prompt}.`, undefined, false, onStatus);

export const generateEnhancedDetailImage = async (image: File, prompt: string, onStatus?: StatusUpdate): Promise<string> => 
    generateFilteredImage(image, `Texture fidelity enhancement: ${prompt}. focus on skin pores, subsurface scattering, micro-shadows, and follicle realism.`, undefined, false, onStatus);

export const generateBackgroundRemovedImage = async (image: File, onStatus?: StatusUpdate): Promise<string> => {
    const ai = getAI();
    if (onStatus) onStatus("Isolating subjects...");
    const parts = [await fileToPart(image), { text: "Isolate subject. Remove background. Return on neutral white." }];
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts } }), 3, 2000, onStatus);
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Segmentation engine failed.");
};

export const generateBackgroundReplacedImage = async (image: File, prompt: string, onStatus?: StatusUpdate): Promise<string> => 
    generateFilteredImage(image, `Replace background with ${prompt}. Match lighting direction and shadow falloff.`, undefined, false, onStatus);

export const generateUpscaledImage = async (image: File, resolution: '2K' | '4K', onStatus?: StatusUpdate): Promise<string> => {
    const ai = getAI();
    if (onStatus) onStatus(`Upscaling to ${resolution}...`);
    const parts = [await fileToPart(image), { text: "High-fidelity upscale. Refine texture density, skin realism, and fine vellus hair structure with micro-shadowing." }];
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({ model: 'gemini-3-pro-image-preview', contents: { parts }, config: { imageConfig: { imageSize: resolution } } }), 3, 3000, onStatus);
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Upscale pipeline failure.");
};

export const generatePromptFromImage = async (image: File, onStatus?: StatusUpdate): Promise<ImageAnalysisResult> => {
    const ai = getAI();
    if (onStatus) onStatus("Analyzing visual logic...");
    const parts = [await fileToPart(image), { text: "Reverse engineer this asset. Return JSON with 'prompt' and 'caption'." }];
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: { prompt: { type: Type.STRING }, caption: { type: Type.STRING } },
                required: ['prompt', 'caption']
            }
        }
    }), 3, 2000, onStatus);
    return parseJSONSafe(response.text) || { prompt: '', caption: '' };
};

export const analyzePromptStructure = async (
    prompt: string, 
    context?: { platform: string; theme: string; shotType: string },
    onStatus?: StatusUpdate
): Promise<PromptAnalysisResult> => {
    const ai = getAI();
    if (onStatus) onStatus("Performing structural audit...");
    const systemInstruction = `You are the MIVA Visual Identity Audit System. ${MIVA_ARCHETYPE_RULES}
    Analyze user prompt for realism and editorial intent. 
    Provide variations that emphasize photographic detail: subsurface scattering, vellus hair, visible pores, and anisotropic highlights.
    Return JSON.`;
    
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Audit & Suggest Variations for: "${prompt}"\nContext: ${JSON.stringify(context)}`,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    critique: { type: Type.STRING },
                    faceAnalysis: { type: Type.STRING },
                    keyTerms: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: { category: { type: Type.STRING }, term: { type: Type.STRING }, effect: { type: Type.STRING } }
                        } 
                    },
                    options: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: { title: { type: Type.STRING }, prompt: { type: Type.STRING }, reasoning: { type: Type.STRING } }
                        } 
                    }
                }
            }
        }
    }), 3, 2000, onStatus);

    if (onStatus) onStatus("Audit complete.");
    return parseJSONSafe(response.text) || {
        critique: "Analysis fallback active due to quota limitations.",
        faceAnalysis: "Standard identity preservation protocols applied.",
        keyTerms: [],
        options: []
    };
};

export const generateThreadsContent = async (params: any, onStatus?: StatusUpdate): Promise<string> => {
    const ai = getAI();
    if (onStatus) onStatus("Architecting narrative flow...");
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: params.usePro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
        contents: `Architect high-end ${params.postType} with ${params.brandVoice} voice. Context: ${params.notes}.`,
        config: { tools: params.useSearch ? [{ googleSearch: {} }] : [] }
    }), 3, 2000, onStatus);
    return response.text || "";
};

export const generateEditorialCritique = async (content: string, onStatus?: StatusUpdate): Promise<EditorialCritique> => {
    const ai = getAI();
    if (onStatus) onStatus("Reviewing editorial quality...");
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Audit content for editorial quality: "${content}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    }), 3, 2000, onStatus);
    return parseJSONSafe(response.text) || { strengths: [], weaknesses: [], alternatives: [], suggestions: [] };
};

export const generateUGCPrompts = async (
    image: File, 
    theme: string, 
    type: string, 
    typeDesc: string, 
    persona: string, 
    gridMode: boolean, 
    platform: string,
    onStatus?: StatusUpdate
): Promise<UGCBrief> => {
    const ai = getAI();
    if (onStatus) onStatus("Consulting creative director...");
    const parts = [await fileToPart(image), { text: `UGC Production Protocol for ${platform}. Theme: ${theme}, Shot Type: ${type}. Persona: ${persona}.` }];
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    shotDescription: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                    videoPrompt: { type: Type.STRING },
                    cameraSettings: { type: Type.STRING },
                    lightingConfig: { type: Type.STRING },
                    captionOrHook: { type: Type.STRING }
                }
            }
        }
    }), 3, 2000, onStatus);
    return parseJSONSafe(response.text) || { shotDescription: '', imagePrompt: '', videoPrompt: '', cameraSettings: '', lightingConfig: '', captionOrHook: '' };
};

export const generateVideo = async (prompt: string, config: any, onStatus?: StatusUpdate): Promise<string> => {
    const ai = getAI();
    if (onStatus) onStatus("Initializing motion engine...");
    let operation = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config: { numberOfVideos: 1, ...config } });
    
    while (!operation.done) {
        if (onStatus) onStatus("Rendering cinematic motion...");
        await new Promise(r => setTimeout(r, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    
    if (onStatus) onStatus("Finalizing clip encoding...");
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    return videoUri ? `${videoUri}&key=${process.env.API_KEY}` : '';
};

export const generateVideoFromImage = async (image: File, prompt: string, config: any, onStatus?: StatusUpdate): Promise<string> => {
    const ai = getAI();
    if (onStatus) onStatus("Preparing source frame for motion synthesis...");
    
    // Convert File to base64 and mimeType for Veo
    const imgData: { imageBytes: string; mimeType: string } = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            resolve({ imageBytes: base64Data, mimeType: image.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(image);
    });

    if (onStatus) onStatus("Initializing motion engine with image context...");
    let operation = await ai.models.generateVideos({ 
        model: 'veo-3.1-fast-generate-preview', 
        prompt: prompt || undefined, 
        image: imgData,
        config: { numberOfVideos: 1, ...config } 
    });
    
    while (!operation.done) {
        if (onStatus) onStatus("Synthesizing cinematic transition...");
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    
    if (onStatus) onStatus("Finalizing video buffer...");
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    return videoUri ? `${videoUri}&key=${process.env.API_KEY}` : '';
};

export const generateAvatarTwin = async (image: File | null, scenario: string, customPrompt: string, onStatus?: StatusUpdate): Promise<string> => {
    const ai = getAI();
    if (onStatus) onStatus("Establishing biometric lock...");
    const base = image ? IDENTITY_BASE_PROMPT : MIVA_ANCHOR_PROMPT;
    const overlay = STYLE_OVERLAYS[scenario] || "";
    const parts: any[] = [{ text: `IDENTITY SYNTHESIS: ${base} ${overlay} ${customPrompt}` }];
    if (image) parts.unshift(await fileToPart(image));
    
    if (onStatus) onStatus("Mapping style overlays...");
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts } }), 3, 2000, onStatus);
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Avatar synthesis engine stalled.");
};
