import { Image } from '../services/api';

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


export interface AnimationSegment {
    startFrame: number;  // Frame number where segment starts (at 24 FPS)
    images: Image[];
    durationInFrames: number;  // Duration in frames (at 24 FPS)
}

export interface OneShotAnimation {
    config: AnimationConfig;
    segments: AnimationSegment[];
}

// Import the type for the imageApi service
import { imageApi } from '../services/api';
// Define the type for the image service
type ImageApiService = {
  getRandomImages: (count?: number, duplicateNth?: number) => Promise<Image[]>;
};

// Constants
const FPS = 24;

/**
 * Converts beats to frames at 24 FPS
 */
function beatsToFrames(beats: number, bpm: number): number {
    const secondsPerBeat = 60 / bpm;
    return Math.round(secondsPerBeat * beats * FPS);
}

/**
 * Calculates the total number of beats in the animation based on BPM and duration
 */
export function calculateTotalBeats(config: AnimationConfig): number {
    const beatsPerSecond = config.bpm / 60;
    return Math.floor(beatsPerSecond * config.totalDurationSeconds);
}

/**
 * Generates beat markers at specified intervals and converts them to frame numbers
 */
export function generateFrameSequence(config: AnimationConfig, totalBeats: number): number[] {
    const frameMarkers: number[] = [];
    for (let beat = 0; beat < totalBeats; beat += config.beatInterval) {
        const frameNumber = beatsToFrames(beat, config.bpm);
        frameMarkers.push(frameNumber);
    }
    return frameMarkers;
}

/**
 * Creates a pool of unique images for the entire animation using the random images API
 */
export async function generateImagePool(
    imageService: ImageApiService,
    totalSegments: number,
    imagesPerSegment: number,
    duplicateNth?: number
): Promise<Image[]> {
    const totalImagesNeeded = totalSegments * imagesPerSegment;
    const images = await imageService.getRandomImages(totalImagesNeeded, duplicateNth);
    
    // Convert the Image objects to ImageMetadata format
    return images;
}

/**
 * Creates individual animation segments with assigned images, using frame numbers
 */
export function createAnimationSegments(
    frameMarkers: number[],
    imagePool: Image[],
    imagesPerSegment: number,
    bpm: number
): AnimationSegment[] {
    return frameMarkers.map((startFrame, index) => {
        const startIdx = index * imagesPerSegment;
        const segmentImages = imagePool.slice(startIdx, startIdx + imagesPerSegment);
        
        // Calculate duration in frames
        let durationInFrames = index < frameMarkers.length - 1 
            ? frameMarkers[index + 1] - startFrame 
            : beatsToFrames(4, bpm); // Default duration for last segment (4 beats)
        
        // add an extra beat for transitions
        durationInFrames += beatsToFrames(1, bpm);

        return {
            startFrame,
            images: segmentImages,
            durationInFrames
        };
    });
}

/**
 * Creates a complete one shot animation sequence
 */
export interface CreateOneShotAnimationParams {
  config: AnimationConfig;
  imageService: ImageApiService;
  imagesPerSegment?: 4 | 8;
}

export async function createOneShotAnimation(
  params: CreateOneShotAnimationParams
): Promise<OneShotAnimation> {
  const { config, imageService } = params;
  const totalBeats = calculateTotalBeats(config);
  const frameMarkers = generateFrameSequence(config, totalBeats);
  const imagePool = await generateImagePool(imageService, frameMarkers.length, config.beatInterval, 2);
  const segments = createAnimationSegments(frameMarkers, imagePool, config.beatInterval, config.bpm);

  return {
    config,
    segments
  };
}
