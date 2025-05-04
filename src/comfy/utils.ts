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
    audio: File,
    onProgress?: (max: number, value: number) => void
) {
    logger.log(`Running animation workflow`);

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

    // Upload audio file to ComfyUI
    const audioFormData = new FormData();
    audioFormData.append('image', audio, audio.name);
    const audioUploadResponse = await comfyClient.fetchApi('/api/upload/image', {
        method: 'POST',
        body: audioFormData,
    });
    if (!audioUploadResponse.ok) {
        throw new Error(`Failed to upload audio: ${audioUploadResponse.statusText}`);
    }
    const audioUploadResult = await audioUploadResponse.json();
    const uploadedAudioName = audioUploadResult.name;
    logger.log(`Audio uploaded successfully to ComfyUI: ${uploadedAudioName}`);
    // Set the audio file in the workflow (node 294)
    if (workflow["294"] && workflow["294"].inputs) {
        workflow["294"].inputs.audio = uploadedAudioName;
    }

    workflow["516"].inputs.Number = startFrame.toString();
    workflow["518"].inputs.Number = durationInFrames.toString();
    workflow["410"].inputs.filename_prefix = `animator/draft/${startFrame}-${durationInFrames}`;
    workflow["412"].inputs.filename_prefix = `animator/final/${startFrame}-${durationInFrames}`;
    workflow["483"].inputs.min_peaks_distance = 16;
    
    let response: any
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

    const prompt_id = response.prompt_id;
    await new Promise<void>(resolve => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });


    if (response.images.length === 0 && prompt_id) {
        const unsub = comfyClient.on('progress',  ({ max, value}) => {
            if (onProgress) {
                onProgress(max, value);
            }
        });
        await comfyClient.waitForPrompt(prompt_id);
        response = await comfyClient.getPromptOutputs(prompt_id);

        unsub();
    }

    if (!response) {
        return;
    }

    console.log('done',startFrame, images, durationInFrames, response);

    const subfolder =response["410"].gifs[0].subfolder;
    const filename = response["410"].gifs[0].filename;
    const workflowImage = response["410"].gifs[0].workflow;

    async function getComfyFileAsBlob(filename: string, subfolder: string) {
        const videoResponse = await comfyClient.fetchApi(`/api/view?filename=${filename}&subfolder=${subfolder}`);
        const blob = await videoResponse.blob();
        return URL.createObjectURL(blob);
    }

    const videoUrl = await getComfyFileAsBlob(filename, subfolder);
    const workflowUrl = await getComfyFileAsBlob(workflowImage, subfolder);

    logger.log(`Running animation workflow completed`);
    return {
        videoUrl,
        workflowUrl,
        promptId: prompt_id,
    };
}
