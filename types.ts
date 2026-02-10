
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface BatchItem {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'success' | 'error';
    resultUrl?: string;
    error?: string;
}

export interface Asset {
    id: string;
    file: File;
    url: string;
    type: 'image' | 'video';
    name: string;
    timestamp: number;
    module: string; // e.g., 'Text to Image', 'Avatar Twin'
    prompt: string;
    identityId?: string; // name or ID of identity used
    styleId?: string; // name of style used
    aspectRatio?: string;
    metadata: {
        engine: string;
        refinementApplied: boolean;
        width?: number;
        height?: number;
    };
}

export interface Collection {
    id: string;
    name: string;
    description?: string;
    assetIds: string[];
    createdAt: number;
}

export interface SavedPrompt {
    id: string;
    name: string;
    content: string;
    category: string;
    createdAt: number;
    settings?: {
        resolution?: '1K' | '2K' | '4K';
        aspectRatio?: string;
    };
}
