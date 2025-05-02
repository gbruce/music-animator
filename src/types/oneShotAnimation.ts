/**
 * A one shot animation is an ordered sequence of animation segments.
 * A one shot animation is 60 seconds long.
 * A one shot animation is either lanscape or portrait mode.
 * A one shot animation is assigned a beats per minute property.
 * An animation segment represents a fixed number of beats.
 * An animation segment begins at beats intervals of 4 or 8, for example 0, 4, 8, 12, ... or 0, 8, 16, 24, ...
 * Each animation segment is assigned a 4 random images that dont repeat across the entire one shot animation.
 * Each animation segment is created using an external call to comfyui api.
 */

export type Orientation = 'landscape' | 'portrait';

export interface AnimationConfig {
    bpm: number;
    orientation: Orientation;
    totalDurationSeconds: number;
    beatInterval: 4 | 8;
}

export interface ImageMetadata {
    id: string;
    url: string;
}

export interface AnimationSegment {
    startBeat: number;
    images: ImageMetadata[];
    durationInBeats: number;
}

export interface OneShotAnimation {
    config: AnimationConfig;
    segments: AnimationSegment[];
}

export interface ComfyUIClient {
    generateImages(prompt: string, count: number): Promise<ImageMetadata[]>;
}

/**
 * Calculates the total number of beats in the animation based on BPM and duration
 */
export function calculateTotalBeats(config: AnimationConfig): number {
    const beatsPerSecond = config.bpm / 60;
    return Math.floor(beatsPerSecond * config.totalDurationSeconds);
}

/**
 * Generates beat markers at specified intervals
 */
export function generateBeatSequence(config: AnimationConfig, totalBeats: number): number[] {
    const beatMarkers: number[] = [];
    for (let beat = 0; beat < totalBeats; beat += config.beatInterval) {
        beatMarkers.push(beat);
    }
    return beatMarkers;
}

/**
 * Creates a pool of unique images for the entire animation
 */
export async function generateImagePool(
    client: ComfyUIClient,
    prompt: string,
    totalSegments: number,
    imagesPerSegment: number
): Promise<ImageMetadata[]> {
    const totalImagesNeeded = totalSegments * imagesPerSegment;
    return client.generateImages(prompt, totalImagesNeeded);
}

/**
 * Creates individual animation segments with assigned images
 */
export function createAnimationSegments(
    beatMarkers: number[],
    imagePool: ImageMetadata[],
    imagesPerSegment: number
): AnimationSegment[] {
    return beatMarkers.map((startBeat, index) => {
        const startIdx = index * imagesPerSegment;
        const segmentImages = imagePool.slice(startIdx, startIdx + imagesPerSegment);
        
        return {
            startBeat,
            images: segmentImages,
            durationInBeats: index < beatMarkers.length - 1 
                ? beatMarkers[index + 1] - startBeat 
                : 4 // Default duration for last segment
        };
    });
}

/**
 * Creates a complete one shot animation sequence
 */
export async function createOneShotAnimation(
    config: AnimationConfig,
    client: ComfyUIClient,
    prompt: string
): Promise<OneShotAnimation> {
    const totalBeats = calculateTotalBeats(config);
    const beatMarkers = generateBeatSequence(config, totalBeats);
    const imagePool = await generateImagePool(client, prompt, beatMarkers.length, 4);
    const segments = createAnimationSegments(beatMarkers, imagePool, 4);

    return {
        config,
        segments
    };
}
