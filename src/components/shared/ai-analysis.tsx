
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image'; // Use next/image
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { analyzeIssueImage, AnalyzeIssueImageOutput } from '@/ai/flows/analyze-issue-image-flow'; // Ensure correct import
import { useToast } from "@/hooks/use-toast";
import { Camera, LoaderCircle, AlertCircle, X, Send, ImageUp, RotateCcw } from 'lucide-react';
import { IssueType } from '@/types/issue'; // Import IssueType
import { useRouter } from 'next/navigation'; // Import useRouter
import { cn } from '@/lib/utils'; // Import cn utility

interface AiAnalysisComponentProps {
  onClose: () => void; // Callback to close the dialog
}

const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];

const AI_IMAGE_STORAGE_KEY = 'aiCapturedImage'; // Key for sessionStorage

const AiAnalysisComponent: React.FC<AiAnalysisComponentProps> = ({ onClose }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeIssueImageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Separate state for analysis loading
  const [isCapturing, setIsCapturing] = useState(false); // Separate state for image capture/processing
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null); // Ref to store the stream
  const router = useRouter();
  const { toast } = useToast();

  // Function to stop the camera stream
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null; // Clear the ref
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Ensure video element source is cleared
      }
      console.log("Camera stopped.");
    }
     // Optionally hide camera view or update state if needed
  };

  // Get camera permission
  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); // Prefer rear camera
          mediaStreamRef.current = stream; // Store the stream
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setHasCameraPermission(false);
          // Don't set a blocking error, allow upload
          // setError('Camera access denied. Please enable permissions in your browser settings.');
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Camera permission denied. You can still upload an image.',
          });
        }
      } else {
        setHasCameraPermission(false);
        setError('Camera not supported on this device or browser.');
      }
    };

    getCameraPermission();

    // Cleanup function to stop the video stream when component unmounts
    return () => {
      stopCamera();
    };
  }, [toast]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && !isCapturing) {
        setIsCapturing(true); // Indicate capture/processing started
        setError(null); // Clear previous errors
        setAnalysisResult(null); // Reset previous analysis

        const video = videoRef.current;
        const canvas = canvasRef.current;
        // Set canvas size to match video feed for better quality
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
             // Use JPEG with quality setting for potentially smaller size
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); // Quality 0.9

            // Check image size - optional, but good for debugging
            const imageSizeInBytes = Math.round((imageDataUrl.length * (3/4)) - (imageDataUrl.endsWith('==') ? 2 : (imageDataUrl.endsWith('=') ? 1 : 0)));
            console.log(`Captured image size: ${Math.round(imageSizeInBytes / 1024)} KB`);

            setCapturedImage(imageDataUrl);
            stopCamera(); // Stop camera after capture
            handleAnalysis(imageDataUrl); // Trigger analysis immediately
        } else {
             setError("Could not get canvas context to capture image.");
        }
        setIsCapturing(false); // Indicate capture/processing finished
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !isCapturing) {
      setIsCapturing(true); // Use capturing state for file reading as well
      setError(null);
      setAnalysisResult(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;

        // Check image size
         const imageSizeInBytes = Math.round((base64String.length * (3/4)) - (base64String.endsWith('==') ? 2 : (base64String.endsWith('=') ? 1 : 0)));
         console.log(`Uploaded image size: ${Math.round(imageSizeInBytes / 1024)} KB`);


        setCapturedImage(base64String);
        handleAnalysis(base64String); // Trigger analysis immediately
        setIsCapturing(false);
      };
      reader.onerror = () => {
        setError('Failed to read the uploaded file.');
        toast({
          variant: 'destructive',
          title: 'File Read Error',
          description: 'Could not read the selected file.',
        });
        setIsCapturing(false);
      };
      reader.readAsDataURL(file);
    }
     // Reset file input to allow selecting the same file again
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAnalysis = async (imageDataUri: string) => {
    if (!imageDataUri) {
      setError('No image available for analysis.');
      return;
    }
    setIsLoading(true); // Start analysis loading
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeIssueImage({ imageDataUri });
      if (!issueTypes.includes(result.detectedType)) {
           console.warn(`AI detected type "${result.detectedType}" which is not in the predefined list. Defaulting to "Other".`);
           result.detectedType = "Other";
      }
      setAnalysisResult(result);
      toast({
        title: 'Analysis Complete',
        description: `Detected issue type: ${result.detectedType}`,
      });
    } catch (err) {
      console.error('AI analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(`Analysis failed: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false); // Stop analysis loading
    }
  };

   const handleUseDetails = () => {
        if (!analysisResult || !capturedImage) return;

        try {
             // Store the large image Data URI in sessionStorage
             sessionStorage.setItem(AI_IMAGE_STORAGE_KEY, capturedImage);
             console.log("Image stored in sessionStorage");
        } catch (e) {
            console.error("Failed to store image in sessionStorage:", e);
            setError("Could not prepare image for the report form. Session storage might be full or disabled.");
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not save image data for the next step.',
            });
            return; // Stop navigation if storage fails
        }

        // Construct the query parameters *without* the large image data
        const query = new URLSearchParams({
            aiType: analysisResult.detectedType,
            aiTitle: analysisResult.suggestedTitle,
            aiDescription: analysisResult.suggestedDescription,
            // DO NOT include aiImage: capturedImage,
        });

        // Navigate to the report page with the query parameters
        const reportUrl = `/citizen/dashboard/report?${query.toString()}`;
        console.log("Navigating to:", reportUrl);
        router.push(reportUrl);
        onClose(); // Close the dialog after navigation
    };

  const resetState = async () => {
      setCapturedImage(null);
      setAnalysisResult(null);
      setError(null);
      setIsLoading(false);
      setIsCapturing(false);

      // Clear stored image from session storage if it exists
       try {
           sessionStorage.removeItem(AI_IMAGE_STORAGE_KEY);
           console.log("Cleared image from sessionStorage");
       } catch (e) {
           console.error("Could not remove image from sessionStorage:", e);
       }


      // Restart camera if permission was granted and it's not already running
      if (hasCameraPermission && !mediaStreamRef.current) {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
             try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                 mediaStreamRef.current = stream;
                 if (videoRef.current) {
                     videoRef.current.srcObject = stream;
                 }
             } catch (err) {
                 console.error("Error restarting camera:", err);
                 setError('Could not restart camera.');
                 setHasCameraPermission(false); // Assume permission issue if restart fails
             }
          }
      }
      // Reset file input value as well
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} style={{ display: 'none' }} /> {/* Hidden canvas */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!capturedImage ? (
        // Camera View or Upload Prompt
        <Card>
          <CardContent className="p-4 space-y-4">
            {hasCameraPermission === null && <Skeleton className="w-full aspect-video rounded-md" />}

            {/* Always render video element but hide if no permission or stream inactive */}
             <video
               ref={videoRef}
               className={cn(
                    "w-full aspect-video rounded-md bg-black",
                    (!hasCameraPermission || !mediaStreamRef.current || hasCameraPermission === false) && "hidden" // Hide if no permission or no active stream
               )}
               autoPlay
               muted
               playsInline // Important for mobile
             />

             {/* Show placeholder if camera permission denied or not yet determined */}
              {hasCameraPermission === false && (
                   <div className="w-full aspect-video rounded-md bg-muted flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                       <Camera className="h-12 w-12 opacity-50 mb-2" />
                       <p className="text-sm">Camera access denied or unavailable.</p>
                       <p className="text-xs">You can upload an image instead.</p>
                   </div>
              )}


            <div className="flex justify-center gap-4">
              <Button onClick={captureImage} disabled={!hasCameraPermission || !mediaStreamRef.current || isLoading || isCapturing}>
                 {isCapturing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                 {isCapturing ? 'Processing...' : 'Capture'}
              </Button>
              <Button variant="outline" onClick={triggerFileUpload} disabled={isLoading || isCapturing}>
                 <ImageUp className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Analysis View
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative w-full max-h-[40vh] rounded-md overflow-hidden flex justify-center items-center bg-muted">
                 <Image
                   src={capturedImage}
                   alt="Captured issue"
                   width={400} // Provide width/height or use layout="fill" with sized parent
                   height={300}
                   className="object-contain" // Ensure image fits within bounds
                   unoptimized // Use this if the src is a data URI to avoid Next.js optimization attempts
                 />
            </div>


            {isLoading && (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground pt-4">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>Analyzing image...</span>
              </div>
            )}

            {analysisResult && !isLoading && (
              <div className="space-y-3 text-sm border-t pt-4 mt-4">
                 <h3 className="font-semibold text-base text-foreground">AI Analysis Results:</h3>
                 <p><strong>Detected Type:</strong> {analysisResult.detectedType}</p>
                 <p><strong>Suggested Title:</strong> {analysisResult.suggestedTitle}</p>
                 <p><strong>Suggested Description:</strong> {analysisResult.suggestedDescription}</p>
                  <Button onClick={handleUseDetails} className="w-full mt-2">
                     <Send className="mr-2 h-4 w-4" /> Use Details & Report Issue
                  </Button>
              </div>
            )}

             {/* Show error specific to analysis failure */}
            {!isLoading && error && capturedImage && (
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Analysis Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}


            <div className="flex justify-center gap-4 pt-4 border-t mt-4">
              <Button variant="outline" onClick={resetState} disabled={isLoading || isCapturing}>
                 <RotateCcw className="mr-2 h-4 w-4" /> Start Over
              </Button>
               {/* Re-analyze button (useful if analysis failed) */}
               {!isLoading && capturedImage && (error || !analysisResult) && (
                 <Button onClick={() => handleAnalysis(capturedImage)} disabled={isLoading || isCapturing}>
                     {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                     {isLoading ? 'Analyzing...' : 'Re-Analyze'}
                 </Button>
               )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end mt-4">
        <Button variant="ghost" onClick={() => { stopCamera(); onClose(); }}>
          <X className="mr-2 h-4 w-4" /> Close
        </Button>
      </div>
    </div>
  );
};

export default AiAnalysisComponent;
