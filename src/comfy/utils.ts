import { Image } from '../services/api';
import vid2vid from './audio-reactive-vid2vid.json';
import { Client } from '@stable-canvas/comfyui-client';
import { imageApi } from '../services/api';
import { createLogger } from '../utils/logger';

// Create a logger instance for this component
const logger = createLogger('comfy/utils.ts');

/**
 * Converts an Image object into FormData for uploading to ComfyUI
 */
export async function imageToFormData(image: Image): Promise<FormData> {
    // Fetch the image file from the server
    const url = imageApi.getImageUrl(image.identifier);
    const response = await fetch(url);
    const blob = await response.blob();

    // Create FormData and append the image
    const formData = new FormData();
    formData.append('image', blob, image.filename);
    
    return formData;
}

export async function runAnimationWorkflow(
    startFrame: number,
    images: Image[],
    durationInFrames: number,
    onProgress?: (max: number, value: number) => void
) {
    // Create and initialize ComfyUI client
    const comfyClient = new Client({
        api_host: 'localhost:8188'
    });
 
    comfyClient.connect({
        websocket: {
            enabled: true
        }
    });

    const workflow = JSON.parse(JSON.stringify(vid2vid));

    // upload images to ComfyUI
    for (let i=0 ; i<4;i++) {
        const formData = await imageToFormData(images[i]);
        
        // Make a direct POST request to the ComfyUI upload endpoint
        const uploadResponse = await comfyClient.fetchApi('/api/upload/image', {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
        }

        const uploadResult = await uploadResponse.json();

        // Cache the uploaded image name for future iterations
        const uploadedImageName = uploadResult.name;
                
        logger.log(`Image uploaded successfully to ComfyUI: ${uploadedImageName}`);
        

        if (i == 0) {
            workflow["56"].inputs.image = uploadedImageName;
        }
        else if (i == 1) {
            workflow["58"].inputs.image = uploadedImageName;
        }
        else if (i == 2) {
            workflow["267"].inputs.image = uploadedImageName;
        }
        else if (i == 3) {
            workflow["372"].inputs.image = uploadedImageName;
        }
    }

    workflow["516"].inputs.Number = startFrame.toString();
    workflow["518"].inputs.Number = durationInFrames.toString();


    let response;
    // Enqueue the workflow
    response = await comfyClient.enqueue(
        workflow,
        {
            workflow: {},
            progress: ({ max, value}) => {
                if (onProgress) {
                    onProgress(max, value);
                }
            },
        }
    );
}
