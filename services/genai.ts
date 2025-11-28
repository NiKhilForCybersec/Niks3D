import { GoogleGenAI } from "@google/genai";
import { VeoGenerationConfig } from "../types";

// Helper to validate and get client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVeoVideo = async (config: VeoGenerationConfig): Promise<string> => {
  const ai = getClient();
  
  // Prepare contents
  const model = 'veo-3.1-fast-generate-preview';
  
  // Construct parameters
  const videoConfig: any = {
    numberOfVideos: 1,
    resolution: '720p', // Only 720p is consistently supported for fast preview with images in some contexts, but sticking to prompt reqs
    aspectRatio: config.aspectRatio,
  };

  if (config.resolution) {
    videoConfig.resolution = config.resolution;
  }

  try {
    let operation;
    
    console.log("Starting Veo generation...", config);

    if (config.imageBase64) {
        // Image-to-Video
        operation = await ai.models.generateVideos({
            model: model,
            prompt: config.prompt, // Prompt is optional but recommended
            image: {
                imageBytes: config.imageBase64,
                mimeType: 'image/png', // Assuming PNG or converted to PNG before calling
            },
            config: videoConfig
        });
    } else {
        // Text-to-Video (Fallback if no image, though UI enforces image for this specific feature)
        operation = await ai.models.generateVideos({
            model: model,
            prompt: config.prompt,
            config: videoConfig
        });
    }

    console.log("Operation started:", operation);

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
      console.log("Polling operation status...", operation);
    }

    if (operation.error) {
        throw new Error(operation.error.message || "Video generation failed.");
    }

    const generatedVideo = operation.response?.generatedVideos?.[0];
    if (!generatedVideo?.video?.uri) {
      throw new Error("No video URI returned from the API.");
    }

    const downloadLink = generatedVideo.video.uri;
    const apiKey = process.env.API_KEY;
    
    // Fetch the actual video blob using the key
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error: any) {
    console.error("Veo Generation Error:", error);
    // Handle "Requested entity was not found" specifically if needed by UI
    throw error;
  }
};