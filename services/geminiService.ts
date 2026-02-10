
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
She does not perform for attention. She does not chase trends.
Her presence is calm, intentional, and unmistakably elite.
She feels: Self-possessed, Grounded, Unbothered, Internally confident.

VISUAL BEHAVIOR RULES:
- Facial Expression: Neutral to soft, calm eyes. No exaggerated smiling, no flirtation, no influencer clichés.
- Body Language: Relaxed shoulders, controlled posture, minimal gestures. Stillness preferred.
- Presence: She occupies space quietly. The camera observes her — she does not perform for it.

STYLE & AESTHETIC LOCK:
- Fashion: Old-money elegance, timeless silhouettes, tailored or fluid. Quality over novelty.
- Fabrics: Silk, Wool, Linen, Cashmere blends.
- Palette: Ivory, Stone, Camel, Taupe, Soft grey, Black, Espresso.
- PROHIBITED: Loud colors, logos, prints, trend-driven cuts, statement accessories.

ENVIRONMENT RULES:
- Allowed: Refined interiors, architectural spaces, sunlit cafés, quiet city streets, minimalist homes.
- Disallowed: Flashy nightlife, party scenes, influencer-style sets, fantasy locations.

CAMERA & FRAMING:
- Eye-level or subtle angles only. No dramatic low angles. No dominance framing.
- Editorial realism over cinematic drama. Natural light preferred.
- 85mm or 50mm lenses preferred.

PSYCHOLOGICAL SIGNAL:
"She knows who she is. She does not need to prove it."
If input feels try-hard, trendy, or attention-seeking -> CORRECT IT immediately to match the archetype.
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

const callWithRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    try {
        return await fn();
    } catch (e) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return callWithRetry(fn, retries - 1);
        }
        throw e;
    }
};

// Robust JSON Parsing Helper
function parseJSONSafe(text: string) {
    if (!text) return null;
    
    // 1. Remove Markdown Code Blocks
    let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1');
    
    // 2. Find valid JSON bounds
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Fallback: try removing common trailing commas before closing braces/brackets
        try {
            const relaxed = cleaned.replace(/,\s*([\]}])/g, '$1');
            return JSON.parse(relaxed);
        } catch (e2) {
            console.error("JSON Parsing Failed. Raw text snippet:", text.substring(0, 100));
            throw new Error("Failed to parse JSON response. The model output may be truncated or malformed.");
        }
    }
}

export const enhanceUserPrompt = async (prompt: string, context?: { platform: string; theme: string; shotType: string }): Promise<string> => {
    const ai = getAI();
    const contextBlock = context ? `
    CONTEXT CONFIGURATION:
    - Target Platform: ${context.platform}
    - Visual Theme: ${context.theme}
    - Shot Intent: ${context.shotType}
    
    Adjust the prompt to specifically optimize for this context while strictly maintaining the MIVA archetype.
    ` : '';

    const systemInstruction = `You are MIVA Studio’s Visual Identity Engine.
    
    ${MIVA_ARCHETYPE_RULES}

    ────────────────────────────────
    TASK: PROMPT REFINEMENT
    ────────────────────────────────
    Refine the user's input into a final, production-ready image generation prompt.
    
    1. **Identity Lock**: Ensure the prompt starts with instructions to lock facial structure if a reference is implied.
    2. **Mode Enforcement**: Detect if "Hijab" or "Free Hair" mode is implied or stated.
       - If Hijab: Modest, intentional, smooth drape, no excessive volume.
       - If Free Hair: Natural, realistic density, no glam styling.
    3. **Platform Logic**: If a platform (Instagram, LinkedIn, Threads) is detected/implied, apply the specific Pose/Mood mappings defined in MIVA logic (e.g. LinkedIn -> Still Icon/Calm Authority).
    4. **Photorealism & Physics**: Add keywords for 8k resolution, authentic skin texture (pores, peach fuzz), subsurface scattering, and natural lighting. Ensure facial features are described with high fidelity to handle complex subjects like faces effectively (e.g. 'visible pores', 'vellus hair', 'authentic skin texture').
    5. **Clarity & Detail**: Expand vague descriptions into clear, actionable visual details (e.g., "sitting" -> "seated with relaxed posture on a velvet chair"). Ensure the prompt is effective for high-end generation models.
    6. **Guardrails**: REMOVE any requested elements that violate the MIVA Woman archetype (e.g. if user asks for "flashy neon party", convert to "quiet evening elegance").

    Return ONLY the refined prompt text. Do not explain.
    `;
    
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Original User Input: "${prompt}"\n${contextBlock}\nGenerate the MIVA-compliant prompt:`,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7 
        }
    }));
    return response.text?.trim() || prompt;
};

export const generateImage = async (
    prompt: string, 
    identityImage?: File, 
    resolution: '1K' | '2K' | '4K' = '1K',
    aspectRatio: string = '1:1'
): Promise<string> => {
    const ai = getAI();
    
    const model = 'gemini-3-pro-image-preview';
    const config: any = {
        imageConfig: {
            imageSize: resolution,
            aspectRatio: aspectRatio
        }
    };

    const parts: any[] = [];
    
    if (identityImage) {
        parts.push(await fileToPart(identityImage));
        const lockInstruction = "REFERENCE_FACE_IMAGE: Maintain identical face, facial structure, bone geometry, eye shape, nose, lips, skin tone, and proportions EXACTLY. No face swapping, beautification drift, or age change. Photorealistic skin texture, natural pores, real human realism.";
        parts.push({ text: `${lockInstruction}\n\n${prompt}` });
    } else {
        parts.push({ text: prompt });
    }

    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated.");
};

export const generateImageVariations = async (
    prompt: string, 
    count: number = 3, 
    identityImage?: File, 
    resolution: '1K' | '2K' | '4K' = '1K',
    aspectRatio: string = '1:1'
): Promise<string[]> => {
    const promises = Array(count).fill(0).map(() => generateImage(prompt, identityImage, resolution, aspectRatio));
    const results = await Promise.allSettled(promises);
    const successful = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value);
    
    if (successful.length === 0) throw new Error("Failed to generate any variations.");
    return successful;
};

export const generateAndDownloadAssets = async (prompts: string[]): Promise<string[]> => {
    const promises = prompts.map(prompt => generateImage(prompt));
    const results = await Promise.allSettled(promises);
    const successful = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value);
    
    if (successful.length === 0) throw new Error("Failed to generate assets.");
    return successful;
};

export const generateFilteredImage = async (image: File, prompt: string, identityImage?: File, isBatch?: boolean): Promise<string> => {
    const ai = getAI();
    const parts: any[] = [await fileToPart(image)];
    if (identityImage) {
        parts.push(await fileToPart(identityImage));
    }
    parts.push({ text: `Apply the following style/filter to the first image: ${prompt}. Maintain the subject's identity and composition exactly. Ensure realistic lighting falloff and MIVA editorial standards.` });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Failed to filter image.");
};

export const generateAdjustedImage = async (image: File, prompt: string): Promise<string> => {
    return generateFilteredImage(image, `Fine-tune adjustment: ${prompt}. Keep original composition. Maintain realistic shadow density.`);
};

export const generateEnhancedDetailImage = async (image: File, prompt: string): Promise<string> => {
    return generateFilteredImage(image, `Enhance details: ${prompt}. Increase texture fidelity, subsurface scattering details, and sharpness without altering content.`);
};

export const generateBackgroundRemovedImage = async (image: File): Promise<string> => {
    const ai = getAI();
    const parts = [await fileToPart(image), { text: "Remove the background from this image. Place the subject on a pure white background or transparent if supported." }];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Failed to remove background.");
};

export const generateBackgroundReplacedImage = async (image: File, prompt: string): Promise<string> => {
    return generateFilteredImage(image, `Replace background with: ${prompt}. Keep the foreground subject exactly as is. Match lighting direction and shadow softness to MIVA editorial standards.`);
};

export const generateUpscaledImage = async (image: File, resolution: '2K' | '4K'): Promise<string> => {
    const ai = getAI();
    const parts = [await fileToPart(image), { text: "Upscale this image to higher resolution. Improve details, skin texture, and sharpness. Maintain photorealistic fidelity." }];
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: {
            imageConfig: {
                imageSize: resolution
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Failed to upscale image.");
};

export const generatePromptFromImage = async (image: File): Promise<ImageAnalysisResult> => {
    const ai = getAI();
    const parts = [await fileToPart(image), { text: "Analyze this image. Provide a detailed prompt to recreate it including lighting and camera settings, and a short editorial caption." }];
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prompt: { type: Type.STRING },
                    caption: { type: Type.STRING }
                },
                required: ['prompt', 'caption']
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned");
    return parseJSONSafe(text) as ImageAnalysisResult;
};

export const generateVideo = async (prompt: string, config: { resolution: '720p'|'1080p', aspectRatio: '16:9'|'9:16' }): Promise<string> => {
    const ai = getAI();
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: config.resolution,
            aspectRatio: config.aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed.");
    
    return `${videoUri}&key=${process.env.API_KEY}`;
};

export const generateVideoFromImage = async (image: File, prompt: string, config: { resolution: '720p'|'1080p', aspectRatio: '16:9'|'9:16' }): Promise<string> => {
    const ai = getAI();
    const imagePart = await fileToPart(image);
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this image cinematically, maintaining the MIVA editorial style.",
        image: {
            imageBytes: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType
        },
        config: {
            numberOfVideos: 1,
            resolution: config.resolution,
            aspectRatio: config.aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed.");
    
    return `${videoUri}&key=${process.env.API_KEY}`;
};

export const generateThreadsContent = async (params: { goal: string, postType: string, brandVoice: string, topic: string, product: string, notes: string, usePro: boolean, useSearch: boolean }): Promise<string> => {
    const ai = getAI();
    const prompt = `Write a ${params.postType} for Threads/Twitter.
    Goal: ${params.goal}
    Voice: ${params.brandVoice} (Adhere to MIVA Woman archetype: self-possessed, grounded, elite)
    Topic: ${params.topic}
    Context: ${params.notes}
    
    Make it engaging but refined. Use magnetic hooks.`;

    const config: any = {
        tools: params.useSearch ? [{ googleSearch: {} }] : []
    };

    const response = await ai.models.generateContent({
        model: params.usePro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
        contents: prompt,
        config
    });

    return response.text || "No content generated.";
};

export const generateEditorialCritique = async (content: string): Promise<EditorialCritique> => {
    const ai = getAI();
    const prompt = `Critique the following social media content based on the MIVA Woman archetype (Quiet Luxury, Old Money, Elite, Self-Possessed).
    Content: "${content}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
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
    });

    const text = response.text;
    if (!text) throw new Error("No critique generated");
    return parseJSONSafe(text) as EditorialCritique;
};

export const analyzePromptStructure = async (prompt: string, context?: { platform: string; theme: string; shotType: string }): Promise<PromptAnalysisResult> => {
    const ai = getAI();
    const systemInstruction = `You are the MIVA Visual Identity Engine Audit System.
    ${MIVA_ARCHETYPE_RULES}
    
    Task: Analyze the input prompt for adherence to the MIVA Woman archetype and general photorealistic quality.
    Identify any deviations (trend-chasing, over-sexualization, loud colors, cheap fabrics).
    Suggest high-end editorial corrections.
    `;

    const contextBlock = context ? `
    CONTEXT:
    Platform: ${context.platform}
    Theme: ${context.theme}
    Shot Type: ${context.shotType}
    ` : '';

    const promptText = `Analyze this image generation prompt${contextBlock} for clarity, detail, and effectiveness:
    
    1. **General Critique**: Evaluate composition, lighting, and style against MIVA standards. Check for potential artifacts or lack of detail in complex areas like faces.
    2. **Face & Identity Analysis**: Specifically analyze facial descriptions. Suggest improvements for photorealism (pores, vellus hair, lighting interaction) and identity consistency.
    3. **Impact Matrix**: Identify key terms.
    4. **Style Suggestions**: Suggest 3 MIVA-compliant editorial variations (e.g. "Still Icon", "Window Light Pause") that maximize editorial quality and identity consistency.

    Prompt: "${prompt}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: promptText,
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
                                properties: {
                                    category: { type: Type.STRING },
                                    term: { type: Type.STRING },
                                    effect: { type: Type.STRING }
                                }
                            } 
                        },
                        options: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    prompt: { type: Type.STRING },
                                    reasoning: { type: Type.STRING }
                                }
                            } 
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("No analysis generated from model.");
        }
        
        const result = parseJSONSafe(text) as PromptAnalysisResult;
        if (!result) throw new Error("Parsed result is empty.");
        return result;

    } catch (e) {
        console.error("Analysis generation error:", e);
        // Fallback result to prevent UI crash
        return {
            critique: "Analysis service temporarily unavailable. Proceeding with standard generation protocols.",
            faceAnalysis: "Standard identity preservation protocols active.",
            keyTerms: [],
            options: []
        };
    }
};

export const generateUGCPrompts = async (image: File, theme: string, type: string, typeDesc: string, persona: string, gridMode: boolean, platform: string): Promise<UGCBrief> => {
    const ai = getAI();
    const parts = [await fileToPart(image), { text: `Generate a UGC production brief for this product.
    Platform: ${platform}
    Theme: ${theme}
    Shot Type: ${type} (${typeDesc})
    Persona: ${persona} (Ensure adherence to MIVA Woman archetype: sophisticated, refined, neutral)
    Grid Mode: ${gridMode}
    
    Provide structured output including shot description, image generation prompt, video generation prompt (for Veo), camera settings, lighting config, and a caption.` }];

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
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
    });
    
    const text = response.text;
    if (!text) throw new Error("No brief generated");
    return parseJSONSafe(text) as UGCBrief;
};

export const generateAvatarTwin = async (image: File | null, scenario: string, customPrompt: string): Promise<string> => {
    const ai = getAI();
    const basePrompt = image ? IDENTITY_BASE_PROMPT : MIVA_ANCHOR_PROMPT;
    const overlay = STYLE_OVERLAYS[scenario] || "";
    // Enforce MIVA standards in the custom prompt via instructions
    const fullPrompt = `MIVA VISUAL ENGINE: ${basePrompt} ${overlay} ${customPrompt}. Maintain consistent identity and old-money aesthetic restraint.`;
    
    const parts: any[] = [{ text: fullPrompt }];
    if (image) {
        parts.unshift(await fileToPart(image));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Avatar generation failed.");
};
