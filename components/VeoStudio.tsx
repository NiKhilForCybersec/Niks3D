import React, { useState, useEffect, useCallback } from 'react';
import { VeoGenerationConfig } from '../types';
import { generateVeoVideo } from '../services/genai';
import { Loader2, Upload, Video, AlertCircle, Play } from 'lucide-react';

export const VeoStudio: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [loadingKey, setLoadingKey] = useState<boolean>(true);
  
  const [prompt, setPrompt] = useState<string>('A cinematic shot of this scene, 4k, highly detailed');
  const [image, setImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const checkKey = useCallback(async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        // Fallback for dev environments without the special window object
        // setHasKey(true); // Uncomment for local dev without studio wrapper
        setHasKey(false);
      }
    } catch (e) {
      console.error(e);
      setHasKey(false);
    } finally {
      setLoadingKey(false);
    }
  }, []);

  useEffect(() => {
    checkKey();
  }, [checkKey]);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions, but recheck to be safe/reactive
      checkKey(); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data URL prefix for API
        const base64 = reader.result as string;
        // Keep the full string for display, we'll strip header in service if needed or here
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRawBase64 = (dataUrl: string) => {
    return dataUrl.split(',')[1];
  };

  const handleGenerate = async () => {
    if (!image) {
      setError("Please upload an image first.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setResultVideoUrl(null);
    setStatusMessage("Initializing Veo generation...");

    try {
      const config: VeoGenerationConfig = {
        prompt,
        imageBase64: getRawBase64(image),
        aspectRatio,
        resolution: '720p'
      };

      setStatusMessage("Sending request to Veo 3.1...");
      const videoUrl = await generateVeoVideo(config);
      
      setResultVideoUrl(videoUrl);
      setStatusMessage("Generation complete!");
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
         setError("API Key issue detected. Please re-select your paid API key.");
         setHasKey(false); // Force re-selection UI
      } else {
         setError(err.message || "An unexpected error occurred during video generation.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (loadingKey) {
    return <div className="flex justify-center items-center h-full text-slate-400">Loading...</div>;
  }

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 p-8 text-center max-w-2xl mx-auto">
        <div className="p-4 bg-slate-800 rounded-full">
          <Video className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Enable Veo Video Generation</h2>
        <p className="text-slate-400 text-lg">
          To generate high-quality videos with Veo, you need to connect a paid Google Cloud Project API key. 
          Please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">billing documentation</a> for details.
        </p>
        <button
          onClick={handleSelectKey}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2"
        >
          Select Paid API Key
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-y-auto p-2">
      {/* Controls Section */}
      <div className="space-y-6">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            Input Configuration
          </h3>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Reference Image</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  image 
                    ? 'border-indigo-500 bg-slate-800' 
                    : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-500'
                }`}
              >
                {image ? (
                  <img src={image} alt="Preview" className="h-full object-contain rounded-lg" />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Click to upload source image</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Animation Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
              rows={3}
              placeholder="Describe how the image should move..."
            />
          </div>

          {/* Settings */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
            <div className="flex gap-4">
              {(['16:9', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                    aspectRatio === ratio
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !image}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl ${
              isGenerating || !image
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 transform hover:scale-[1.02]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Generate Video
              </>
            )}
          </button>
          
          {isGenerating && (
            <div className="mt-4 text-center text-sm text-indigo-300 animate-pulse">
              {statusMessage}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 flex flex-col h-full min-h-[500px]">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Play className="w-5 h-5 text-purple-400" />
          Output Preview
        </h3>
        
        <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden relative">
          {resultVideoUrl ? (
            <video 
              src={resultVideoUrl} 
              controls 
              autoPlay 
              loop 
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          ) : (
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <Video className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 text-lg font-medium">No video generated yet</p>
              <p className="text-slate-500 text-sm mt-2">Upload an image and click Generate to see the magic happen with Veo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};