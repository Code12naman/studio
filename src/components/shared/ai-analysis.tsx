
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image'; // Use next/image
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { analyzeIssueImage, AnalyzeIssueImageOutput } from '@/ai/flows/analyze-issue-image-flow'; // Ensure correct import
import { useToast } from "@/hooks/use-toast";
import { Camera, LoaderCircle, AlertCircle, X, Send, ImageUp, RotateCcw, Sparkles } from 'lucide-react'; // Added Sparkles
import { IssueType, IssuePriority } from '@/types/issue'; // Import IssueType and Priority
import { useRouter } from 'next/navigation'; // Import useRouter
import { cn } from '@/lib/utils'; // Import cn utility
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Label } from '@/components/ui/label'; // Import Label

interface AiAnalysisComponentProps {
  onClose: () => void; // Callback to close the dialog
}

const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];
const issuePriorities: IssuePriority[] = ["Low", "Medium", "High"]; // For validation

const AI_IMAGE_STORAGE_KEY = 'aiCapturedImage'; // Key for sessionStorage

const AiAnalysisComponent: React.FC<AiAnalysisComponentProps> = ({ onClose }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeIssueImageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Separate state for analysis loading
  const [isCapturing, setIsCapturing] = useState(false); // Separate state for image capture/processing
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(''); // State for optional description
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

  // Get camera permission on mount
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
  }, [toast]); // Add toast as dependency

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
             toast({ variant: 'destructive', title: 'Capture Failed', description: 'Could not process image.' });
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

  // Handle AI Analysis
  const handleAnalysis = async (imageDataUri: string) => {
    if (!imageDataUri) {
      setError('No image available for analysis.');
      return;
    }
    setIsLoading(true); // Start analysis loading
    setError(null);
    setAnalysisResult(null);

    try {
      // Pass both image data URI and the current description state
      const result = await analyzeIssueImage({ imageDataUri, description });

      // Validate received data
      if (!issueTypes.includes(result.detectedType)) {
           console.warn(`AI detected type "${result.detectedType}" is invalid. Defaulting to "Other".`);
           result.detectedType = "Other";
      }
       if (!issuePriorities.includes(result.suggestedPriority)) {
           console.warn(`AI suggested priority "${result.suggestedPriority}" is invalid. Defaulting to Medium.`);
           result.suggestedPriority = "Medium";
       }

      setAnalysisResult(result); // Store the full result including priority
      toast({
        title: 'Analysis Complete',
        description: `Detected: ${result.detectedType}, Priority: ${result.suggestedPriority}`,
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

   // Navigate to report page with AI results
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

        // Construct the query parameters including the suggested priority
        const query = new URLSearchParams({
            aiType: analysisResult.detectedType,
            aiTitle: analysisResult.suggestedTitle,
            aiDescription: analysisResult.suggestedDescription,
            aiPriority: analysisResult.suggestedPriority, // Add priority to query params
            // DO NOT include aiImage: capturedImage (it's in sessionStorage)
        });

        // Navigate to the report page with the query parameters
        const reportUrl = `/citizen/dashboard/report?${query.toString()}`;
        console.log("Navigating to:", reportUrl);
        router.push(reportUrl);
        onClose(); // Close the dialog after navigation
    };

  // Reset state to start over
  const resetState = async () => {
      setCapturedImage(null);
      setAnalysisResult(null);
      setError(null);
      setIsLoading(false);
      setIsCapturing(false);
      setDescription(''); // Reset description as well

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

      {error && !isLoading && !isCapturing && ( // Show error only when not loading/capturing
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
            {/* Image Preview */}
            <div className="relative w-full max-h-[40vh] rounded-md overflow-hidden flex justify-center items-center bg-muted border">
                 <Image
                   src={capturedImage}
                   alt="Captured issue"
                   width={400} // Provide width/height or use layout="fill" with sized parent
                   height={300}
                   className="object-contain" // Ensure image fits within bounds
                   unoptimized // Use this if the src is a data URI to avoid Next.js optimization attempts
                 />
            </div>

             {/* Optional Description Input */}
            <div className="space-y-2">
                <Label htmlFor="ai-description">Add Description (Optional, helps AI assess priority)</Label>
                <Textarea
                    id="ai-description"
                    placeholder="e.g., Pothole is deep and cars are swerving."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    disabled={isLoading} // Disable while analyzing
                />
                {/* Button to re-trigger analysis with updated description */}
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAnalysis(capturedImage)}
                    disabled={isLoading || !capturedImage}
                    className="flex items-center gap-1"
                >
                     <Sparkles className="h-4 w-4 text-primary"/> Re-Analyze with Description
                 </Button>
            </div>


            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground pt-4">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>Analyzing image...</span>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResult && !isLoading && (
              <div className="space-y-3 text-sm border-t pt-4 mt-4">
                 <h3 className="font-semibold text-base text-foreground">AI Analysis Results:</h3>
                 <p><strong>Detected Type:</strong> {analysisResult.detectedType}</p>
                 <p><strong>Suggested Priority:</strong> {analysisResult.suggestedPriority}</p>
                 <p><strong>Suggested Title:</strong> {analysisResult.suggestedTitle}</p>
                 <p><strong>Suggested Description:</strong> {analysisResult.suggestedDescription}</p>
                  {/* Button to Proceed */}
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


            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4 border-t mt-4">
              {/* Start Over Button */}
              <Button variant="outline" onClick={resetState} disabled={isLoading || isCapturing}>
                 <RotateCcw className="mr-2 h-4 w-4" /> Start Over
              </Button>
               {/* Re-analyze button (only shown if analysis failed or no result yet) */}
               {/* {!isLoading && capturedImage && (error || !analysisResult) && (
                 <Button onClick={() => handleAnalysis(capturedImage)} disabled={isLoading || isCapturing}>
                     {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                     {isLoading ? 'Analyzing...' : 'Re-Analyze'}
                 </Button>
               )} */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Close Button */}
      <div className="flex justify-end mt-4">
        <Button variant="ghost" onClick={() => { stopCamera(); onClose(); }}>
          <X className="mr-2 h-4 w-4" /> Close
        </Button>
      </div>
    </div>
  );
};

export default AiAnalysisComponent;

