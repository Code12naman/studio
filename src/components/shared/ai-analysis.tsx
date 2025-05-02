
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { analyzeIssueImage, AnalyzeIssueImageOutput } from '@/ai/flows/analyze-issue-image-flow';
import { Loader2, Camera, ScanSearch, AlertCircle, Image as ImageIcon, RefreshCcw } from 'lucide-react';

interface AiAnalysisComponentProps {
  onClose: () => void; // Function to close the dialog
}

export default function AiAnalysisComponent({ onClose }: AiAnalysisComponentProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalyzeIssueImageOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true); // Track initial camera setup

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Request camera permission and start stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      setIsCameraInitializing(true); // Start initializing
      setHasCameraPermission(null); // Reset permission status
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      } finally {
         setIsCameraInitializing(false); // Done initializing (success or fail)
      }
    };

    getCameraPermission();

    // Cleanup function to stop video stream
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [toast]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && hasCameraPermission) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUri = canvas.toDataURL('image/png');
        setImagePreview(imageDataUri);
        setAiAnalysisResult(null); // Reset previous analysis if capturing new image
      }
    } else {
      toast({
        title: 'Capture Failed',
        description: 'Could not capture image. Ensure camera permission is granted.',
        variant: 'destructive',
      });
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imagePreview) {
      toast({ title: 'No Image', description: 'Please capture an image first.', variant: 'destructive' });
      return;
    }
     if (!imagePreview.startsWith('data:image')) {
          toast({ title: "Invalid Image Data", description: "Cannot analyze this image format.", variant: "destructive" });
          return;
     }

    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const result = await analyzeIssueImage({ imageDataUri: imagePreview });
      setAiAnalysisResult(result);
      toast({ title: 'Analysis Complete', description: `Suggested type: ${result.detectedType}` });
    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      toast({ title: 'Analysis Failed', description: error.message || 'Could not analyze the image.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
      setImagePreview(null);
      setAiAnalysisResult(null);
      // Restart camera stream if permission was granted
       if (hasCameraPermission && videoRef.current && !videoRef.current.srcObject) {
         navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
           .then(stream => {
             if (videoRef.current) {
               videoRef.current.srcObject = stream;
             }
           })
           .catch(err => console.error("Failed to restart camera:", err));
       }
  };

  return (
    <div className="space-y-4">
       <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
         {/* Show video feed if no image preview */}
         {!imagePreview && (
           <>
            {/* Always render video tag */}
             <video ref={videoRef} className={`w-full h-full object-cover ${isCameraInitializing || hasCameraPermission === false ? 'opacity-50' : ''}`} autoPlay muted playsInline />
             {/* Canvas for capturing (hidden) */}
             <canvas ref={canvasRef} className="hidden"></canvas>

             {/* Initializing indicator */}
             {isCameraInitializing && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                 <Loader2 className="h-8 w-8 text-white animate-spin" />
               </div>
             )}

             {/* Permission Denied Alert */}
             {hasCameraPermission === false && !isCameraInitializing && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4">
                 <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                 <p className="text-center text-sm text-destructive-foreground">
                   Camera access denied. Please enable permissions in your browser settings.
                 </p>
               </div>
             )}
           </>
         )}

          {/* Show image preview if captured */}
          {imagePreview && (
             <Image src={imagePreview} alt="Captured issue preview" layout="fill" objectFit="contain" />
          )}
       </div>


      {/* Action Buttons */}
      <div className="flex justify-between items-center gap-2">
        {!imagePreview ? (
          <Button onClick={captureImage} disabled={!hasCameraPermission || isCameraInitializing}>
            <Camera className="mr-2 h-4 w-4" />
            Capture
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={resetAnalysis} disabled={isAnalyzing}>
                <RefreshCcw className="mr-2 h-4 w-4"/> Retake
            </Button>
            <Button onClick={handleAnalyzeImage} disabled={isAnalyzing || !!aiAnalysisResult}>
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
              {aiAnalysisResult ? 'Analyzed' : 'Analyze'}
            </Button>
          </>
        )}
      </div>

       {/* AI Analysis Result */}
        {aiAnalysisResult && (
            <Alert variant="default">
                <ScanSearch className="h-4 w-4" />
                <AlertTitle>AI Analysis Result</AlertTitle>
                <AlertDescription>
                    <p><strong>Detected Type:</strong> {aiAnalysisResult.detectedType}</p>
                    <p><strong>Suggested Title:</strong> {aiAnalysisResult.suggestedTitle}</p>
                    <p><strong>Suggested Description:</strong> {aiAnalysisResult.suggestedDescription}</p>
                </AlertDescription>
            </Alert>
        )}
    </div>
  );
}
