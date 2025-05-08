import { Image, videoApi } from '../services/api';
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
    onProgress?: (max: number, value: number) => void,
    draftVideoId?: string,
    flowVideoId?: string,
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
        

        findNodeByClassTypeAndTitle(workflow, "LoadImage", `Image${i+1}`).inputs.image = uploadedImageName;
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

    findNodeByClassTypeAndTitle(workflow, "VHS_LoadAudioUpload", "Load Audio (Upload)").inputs.audio = uploadedAudioName;

    // if a flow video is provided, update the workflow
    if (flowVideoId) {
        const flowVideoUrl = await videoApi.getVideoUrl(flowVideoId);
        const flowVideoBlob = await fetch(flowVideoUrl).then(r => r.blob());
        const flowVideoFormData = new FormData();
        flowVideoFormData.append('image', new File([flowVideoBlob], 'flow.mp4', { type: 'video/mp4' }), "flow.mp4");
     
        const videoUploadResponse = await comfyClient.fetchApi('/api/upload/image', {
          method: 'POST',
          body: flowVideoFormData,
        });
        if (!videoUploadResponse.ok) {
            throw new Error(`Failed to upload flow video: ${videoUploadResponse.statusText}`);
        }
        const videoUploadResult = await videoUploadResponse.json();
        const uploadedVideoName = videoUploadResult.name;
        logger.log(`Flow video uploaded successfully to ComfyUI: ${uploadedVideoName}`);

        const node = findNodeByClassTypeAndTitle(workflow, "VHS_LoadVideo", "ControlNet Video");
        node.inputs.video = uploadedVideoName;
    }


     // if a draft video is provided, we need to upscale
    if (draftVideoId) {
        removeNodeByClassTypeAndTitle(workflow, "VHS_VideoCombine", "First Pass | Low Res");

        const loadVideoKey = findNodeKeyByClassTypeAndTitle(workflow, "VHS_LoadVideo", "Draft Video");
        findNodeByClassTypeAndTitle(workflow, "ImageScaleBy", "Upscale Image By").inputs.image = [loadVideoKey, 0];
        findNodeByClassTypeAndTitle(workflow, "VHS_VideoCombine", "Upscale | High High Res").inputs.filename_prefix =
        `animator/final/${startFrame}-${durationInFrames}`;

        const node = findNodeByClassTypeAndTitle(workflow, "VHS_LoadVideo", "Draft Video");
        
        // upload draft video
        const videoFormData = new FormData();
        const videoUrl = await videoApi.getVideoUrl(draftVideoId);
        const videoBlob = await fetch(videoUrl).then(r => r.blob());
        videoFormData.append('image', new File([videoBlob], 'draft.mp4', { type: 'video/mp4' }), "draft.mp4");
        const videoUploadResponse = await comfyClient.fetchApi('/api/upload/image', {
            method: 'POST',
            body: videoFormData,
        });
        if (!videoUploadResponse.ok) {
            throw new Error(`Failed to upload draft video: ${videoUploadResponse.statusText}`);
        }
        const videoUploadResult = await videoUploadResponse.json();
        const uploadedVideoName = videoUploadResult.name;
        logger.log(`Draft video uploaded successfully to ComfyUI: ${uploadedVideoName}`);

        node.inputs.video = uploadedVideoName;
    }
    else {
        removeNodeByClassTypeAndTitle(workflow, "VHS_VideoCombine", "Upscale | High High Res");
        removeNodeByClassTypeAndTitle(workflow, "VHS_LoadVideo", "Draft Video");
        findNodeByClassTypeAndTitle(workflow, "VHS_VideoCombine", "First Pass | Low Res").inputs.filename_prefix =
        `animator/draft/${startFrame}-${durationInFrames}`;
    }

    findNodeByClassTypeAndTitle(workflow, "Int", "Start Time").inputs.Number = startFrame.toString();
    findNodeByClassTypeAndTitle(workflow, "Int", "Batch Size").inputs.Number = durationInFrames.toString();
    findNodeByClassTypeAndTitle(workflow, "Audio Peaks Detection", "Audio Peaks Detection").inputs.min_peaks_distance = 16;

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

    let vhsCombine;

    if (draftVideoId) {
        vhsCombine = response[412];
    }
    else {
        vhsCombine = response[410];
    }

    const subfolder =vhsCombine.gifs[0].subfolder;;
    const filename = vhsCombine.gifs[0].filename;;
    const workflowImage = vhsCombine.gifs[0].workflow;;

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

/**
 * Search for a node in a ComfyUI JSON graph by class_type and _meta.title.
 * @param json The parsed JSON object.
 * @param classType The class_type to match.
 * @param title The _meta.title to match.
 * @returns The node object if found, otherwise null.
 */
export function findNodeByClassTypeAndTitle(json: any, classType: string, title: string): any | null {
  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      const node = json[key];
      if (
        node.class_type === classType &&
        node._meta && node._meta.title === title
      ) {
        return node;
      }
    }
  }
  return null;
}

/**
 * Removes a node from a ComfyUI JSON graph by class_type and _meta.title.
 * @param json The parsed JSON object (workflow).
 * @param classType The class_type to match.
 * @param title The _meta.title to match.
 * @returns True if a node was removed, false otherwise.
 */
export function removeNodeByClassTypeAndTitle(json: any, classType: string, title: string): boolean {
  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      const node = json[key];
      if (
        node.class_type === classType &&
        node._meta && node._meta.title === title
      ) {
        delete json[key];
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns the key of a node in a ComfyUI JSON graph by class_type and _meta.title.
 * @param json The parsed JSON object.
 * @param classType The class_type to match.
 * @param title The _meta.title to match.
 * @returns The key as a string if found, otherwise null.
 */
export function findNodeKeyByClassTypeAndTitle(json: any, classType: string, title: string): string | null {
  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      const node = json[key];
      if (
        node.class_type === classType &&
        node._meta && node._meta.title === title
      ) {
        return key;
      }
    }
  }
  return null;
}
