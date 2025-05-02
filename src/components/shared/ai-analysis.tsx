
"use client";

import React, { useState, useRef, useEffect } from 'react';
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

const AiAnalysisComponent: React.FC<AiAnalysisComponentProps> = ({ onClose }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeIssueImageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          mediaStreamRef.current = stream; // Store the stream
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setHasCameraPermission(false);
          setError('Camera access denied. Please enable permissions in your browser settings.');
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
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
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg'); // Use JPEG for smaller size
        setCapturedImage(imageDataUrl);
        setAnalysisResult(null); // Reset previous analysis
        setError(null); // Clear previous errors
        stopCamera(); // Stop camera after capture
        handleAnalysis(imageDataUrl); // Trigger analysis immediately
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCapturedImage(base64String);
        setAnalysisResult(null); // Reset previous analysis
        setError(null); // Clear previous errors
        handleAnalysis(base64String); // Trigger analysis immediately
      };
      reader.onerror = () => {
        setError('Failed to read the uploaded file.');
        toast({
          variant: 'destructive',
          title: 'File Read Error',
          description: 'Could not read the selected file.',
        });
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
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

   const handleUseDetails = () => {
        if (!analysisResult || !capturedImage) return;

        // Construct the query parameters
        const query = new URLSearchParams({
            aiType: analysisResult.detectedType,
            aiTitle: analysisResult.suggestedTitle,
            aiDescription: analysisResult.suggestedDescription,
            aiImage: capturedImage, // Pass the captured image data URI
        });

        // Navigate to the report page with the query parameters
        router.push(`/citizen/dashboard/report?${query.toString()}`);
        onClose(); // Close the dialog after navigation
    };

  const resetState = async () => {
      setCapturedImage(null);
      setAnalysisResult(null);
      setError(null);
      setIsLoading(false);
      // Restart camera if permission was granted and it's not already running
      if (hasCameraPermission && !mediaStreamRef.current) {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
             try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                 mediaStreamRef.current = stream;
                 if (videoRef.current) {
                     videoRef.current.srcObject = stream;
                 }
             } catch (err) {
                 console.error("Error restarting camera:", err);
                 setError('Could not restart camera.');
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
            {hasCameraPermission === false && !error && (
                <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Camera access is needed or you can upload an image. Check browser settings if you intended to use the camera.
                    </AlertDescription>
                </Alert>
            )}

             {/* Always render video element but hide if no permission or stream active */}
             <video
               ref={videoRef}
               className={cn("w-full aspect-video rounded-md bg-black", (!hasCameraPermission || !mediaStreamRef.current) && "hidden")}
               autoPlay
               muted
               playsInline // Important for mobile
             />

             {/* Show placeholder if camera permission denied and no error message shown yet */}
              {hasCameraPermission === false && !error && (
                   <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                       <Camera className="h-16 w-16 opacity-50" />
                   </div>
              )}


            <div className="flex justify-center gap-4">
              <Button onClick={captureImage} disabled={!hasCameraPermission || !mediaStreamRef.current || isLoading}>
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
              <Button variant="outline" onClick={triggerFileUpload} disabled={isLoading}>
                <ImageUp className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Analysis View
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="Captured issue" className="w-full max-h-[40vh] rounded-md object-contain" />

            {isLoading && (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>Analyzing image...</span>
              </div>
            )}

            {analysisResult && !isLoading && (
              <div className="space-y-3 text-sm border-t pt-4">
                 <p><strong>Detected Type:</strong> {analysisResult.detectedType}</p>
                 <p><strong>Suggested Title:</strong> {analysisResult.suggestedTitle}</p>
                 <p><strong>Suggested Description:</strong> {analysisResult.suggestedDescription}</p>
                  <Button onClick={handleUseDetails} className="w-full mt-2">
                     <Send className="mr-2 h-4 w-4" /> Use Details & Report Issue
                  </Button>
              </div>
            )}

            <div className="flex justify-center gap-4 pt-4 border-t">
              <Button variant="outline" onClick={resetState} disabled={isLoading}>
                 <RotateCcw className="mr-2 h-4 w-4" /> Start Over ({hasCameraPermission ? 'Retake' : 'Upload'})
              </Button>
               {/* Re-analyze button (if needed, though analysis is triggered automatically) */}
               {!analysisResult && !isLoading && capturedImage && (
                 <Button onClick={() => handleAnalysis(capturedImage)} disabled={isLoading}>
                     <LoaderCircle className="mr-2 h-4 w-4" /> Re-Analyze
                 </Button>
               )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => { stopCamera(); onClose(); }}>
          <X className="mr-2 h-4 w-4" /> Close
        </Button>
      </div>
    </div>
  );
};

export default AiAnalysisComponent;
