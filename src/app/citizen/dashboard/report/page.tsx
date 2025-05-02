 "use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image'; // Import next/image
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Issue, IssueType } from '@/types/issue';
import { addIssueToDb } from '@/lib/mock-db'; // Import add function from mock DB
import { getCurrentLocation, Coordinate } from '@/services/geolocation';
import { MapPin, Loader2, Send, Upload, X, Image as ImageIcon, Camera, ScanSearch } from 'lucide-react'; // Added Camera, ScanSearch
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"; // Import Dialog
import { analyzeIssueImage, AnalyzeIssueImageOutput } from '@/ai/flows/analyze-issue-image-flow'; // Import AI flow

// Mock function to simulate saving the issue to Firebase (now uses mock DB)
const mockSaveIssue = async (issueData: Omit<Issue, 'id' | 'reportedAt' | 'status' | 'reportedById'> & { userId: string }): Promise<Issue> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
  const newIssue: Issue = {
    ...issueData,
    id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
    reportedAt: Date.now(),
    status: 'Pending',
    reportedById: issueData.userId,
    // imageUrl is already included in issueData if provided
  };
  addIssueToDb(newIssue); // Add to the central mock database
  console.log("Saving issue:", newIssue);
  // Simulate potential error
  // if (Math.random() > 0.8) {
  //   throw new Error("Failed to save issue to the database.");
  // }
  return newIssue;
};

// Mock function to simulate image upload and return a URL
// Modified to accept File or data URI string
const mockUploadImage = async (fileOrDataUri: File | string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay

    let fileName = "uploaded_image";
    if (fileOrDataUri instanceof File) {
        fileName = fileOrDataUri.name;
    }
    console.log(`Simulating upload for: ${fileName}`);

    // In a real app, upload File to Storage or handle data URI upload.
    // For mock, generate a consistent-ish URL based on input type or content hash if possible.
    // Using picsum with seed for simplicity.
    const seed = Date.now() + Math.random();
    // If it's a data URI, we could potentially use it directly if storage allowed,
    // but for mock, we just generate a picsum URL.
    return `https://picsum.photos/seed/${seed}/600/400`;
};

const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];


export default function ReportIssuePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType | ''>('');
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null); // Store the selected image file
  const [imagePreview, setImagePreview] = useState<string | null>(null); // For showing image preview (can be file blob or data URI)
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false); // General form submission loading
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalyzeIssueImageOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock user ID
  const userId = 'citizen123';

  const fetchLocation = useCallback(async () => {
    setLocationStatus('fetching');
    setLocationError(null);
    setLocation(null); // Clear previous location on retry
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      setLocationStatus('success');
       toast({
         title: "Location Fetched",
         description: `Coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
       });
    } catch (error: any) {
      console.error("Error fetching location:", error);
      setLocationStatus('error');
      const errorMessage = error?.message || "Could not get your location. Please ensure location services are enabled and permissions are granted.";
      setLocationError(errorMessage);
       toast({
         title: "Location Error",
         description: errorMessage,
         variant: "destructive",
       });
    }
  }, [toast]); // Add toast as dependency

   useEffect(() => {
     fetchLocation(); // Fetch location on component mount
   }, [fetchLocation]); // Add fetchLocation to dependency array

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          setAiAnalysisResult(null); // Reset AI analysis if image changes
      }
  };

  const removeImage = () => {
      setImageFile(null);
      setImagePreview(null);
      setAiAnalysisResult(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input
      }
       // If the removed image was from the camera, stop the stream
       if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
  };

   // Request camera permission when dialog opens
  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (!isCameraDialogOpen) {
         if (videoRef.current && videoRef.current.srcObject) {
           (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
           videoRef.current.srcObject = null;
         }
        setHasCameraPermission(null); // Reset permission status on close
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); // Prefer rear camera
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
          description: 'Please enable camera permissions in your browser settings to use the camera feature.',
        });
      }
    };

    getCameraPermission();

    // Cleanup function to stop video stream when component unmounts or dialog closes
     return () => {
       if (stream) {
         stream.getTracks().forEach(track => track.stop());
       }
       if (videoRef.current) {
         videoRef.current.srcObject = null;
       }
     };
  }, [isCameraDialogOpen, toast]); // Rerun when dialog state changes

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && hasCameraPermission) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video feed
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get the image as a data URI (e.g., 'data:image/png;base64,...')
        const imageDataUri = canvas.toDataURL('image/png');
        setImagePreview(imageDataUri);
        setImageFile(null); // Clear file input if camera image is used
        setAiAnalysisResult(null); // Reset previous analysis

        // Close the camera dialog
        setIsCameraDialogOpen(false);

        // Stop the video stream
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
    } else {
         toast({
            title: "Capture Failed",
            description: "Could not capture image. Ensure camera permission is granted.",
            variant: "destructive",
         });
    }
  };

   const handleAnalyzeImage = async () => {
        if (!imagePreview) {
          toast({ title: "No Image", description: "Please select or capture an image first.", variant: "destructive" });
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
          // Auto-fill form fields
          if (result.detectedType) setType(result.detectedType);
          if (result.suggestedTitle) setTitle(result.suggestedTitle);
          if (result.suggestedDescription) setDescription(result.suggestedDescription);
          toast({ title: "Analysis Complete", description: `Suggested type: ${result.detectedType}` });
        } catch (error: any) {
          console.error("AI Analysis failed:", error);
          toast({ title: "Analysis Failed", description: error.message || "Could not analyze the image.", variant: "destructive" });
        } finally {
          setIsAnalyzing(false);
        }
   };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !type || !location) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in title, description, type, and ensure location is fetched.",
        variant: "destructive",
      });
      return;
    }
     if (locationStatus !== 'success') {
        toast({
          title: "Location Required",
          description: "Please ensure your location has been successfully fetched or try fetching it again.",
          variant: "destructive",
        });
        return;
      }


    setLoading(true);
    let imageUrl: string | undefined = undefined;
    let imageDataSource: File | string | null = imageFile || imagePreview; // Use file if available, else use data URI preview

    // 1. Upload image if selected
    if (imageDataSource) {
        setIsUploading(true);
        try {
            imageUrl = await mockUploadImage(imageDataSource);
            toast({ title: "Image Uploaded", description: "Image successfully uploaded." });
        } catch (uploadError: any) {
            console.error("Image upload failed:", uploadError);
            toast({
                title: "Image Upload Failed",
                description: uploadError.message || "Could not upload the image. Please try again.",
                variant: "destructive",
            });
            setIsUploading(false);
            setLoading(false);
            return; // Stop submission if image upload fails
        } finally {
             setIsUploading(false);
        }
    }

    // 2. Save issue data (including the imageUrl if upload was successful)
    try {
      await mockSaveIssue({
        title,
        description,
        type,
        location,
        imageUrl, // Add the uploaded image URL
        userId,
      });
      toast({
        title: "Issue Reported Successfully",
        description: "Thank you for helping improve our community!",
        variant: "default",
      });
      router.push('/citizen/dashboard');
    } catch (err: any) {
      console.error("Failed to report issue:", err);
      toast({
        title: "Failed to Report Issue",
        description: err.message || "Could not submit your report. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Report a New Issue</CardTitle>
        <CardDescription>Fill in the details below. Use the camera or upload a photo, and optionally analyze it with AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
           {/* Image Upload/Camera Section */}
           <div className="space-y-2">
             <Label htmlFor="image">Issue Photo</Label>
             <div className="flex flex-wrap items-center gap-4">
                 {/* File Upload */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || !!imagePreview} // Disable if loading or image already selected
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? 'Change File' : 'Upload File'}
                </Button>
                 <Input
                     id="image"
                     type="file"
                     ref={fileInputRef}
                     accept="image/*" // Accept only image files
                     onChange={handleImageChange}
                     className="hidden" // Hide the default input
                     disabled={loading}
                 />

                 {/* Camera Button */}
                <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" disabled={loading || !!imagePreview}>
                            <Camera className="mr-2 h-4 w-4" />
                            {imagePreview ? 'Change Photo' : 'Use Camera'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                        <DialogTitle>Capture Issue Photo</DialogTitle>
                        </DialogHeader>
                        <div className="my-4 relative">
                             {/* Video feed: Always render video tag */}
                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                            {/* Canvas for capturing (hidden) */}
                            <canvas ref={canvasRef} className="hidden"></canvas>

                            {/* Permission Denied Alert */}
                            {hasCameraPermission === false && (
                                <Alert variant="destructive" className="absolute bottom-2 left-2 right-2">
                                <AlertTitle>Camera Access Denied</AlertTitle>
                                <AlertDescription>
                                    Please enable camera permissions to use this feature.
                                </AlertDescription>
                                </Alert>
                            )}
                            {/* Loading/Initializing State */}
                             {hasCameraPermission === null && (
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                     <Loader2 className="h-8 w-8 text-white animate-spin" />
                                 </div>
                             )}
                        </div>
                        <DialogFooter>
                        <Button type="button" onClick={captureImage} disabled={!hasCameraPermission}>
                            Capture
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsCameraDialogOpen(false)}>
                            Cancel
                        </Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>

                 {/* Image Preview */}
                 {imagePreview && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                        <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 h-6 w-6 rounded-full z-10"
                            onClick={removeImage}
                            disabled={loading}
                            aria-label="Remove image"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                 )}
                  {!imagePreview && (
                      <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                      </div>
                  )}

                  {/* Analyze Image Button */}
                {imagePreview && imagePreview.startsWith('data:image') && ( // Only show if preview is a data URI
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAnalyzeImage}
                        disabled={loading || isAnalyzing}
                        className="ml-auto"
                    >
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
                        Analyze with AI
                    </Button>
                )}

             </div>
             {isUploading && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading image...
                  </div>
             )}
             {/* Display AI Analysis Result */}
            {aiAnalysisResult && (
                <Alert variant="default" className="mt-2">
                    <ScanSearch className="h-4 w-4" />
                    <AlertTitle>AI Analysis Suggestion</AlertTitle>
                    <AlertDescription>
                        Type: {aiAnalysisResult.detectedType}, Title: {aiAnalysisResult.suggestedTitle}
                    </AlertDescription>
                </Alert>
            )}
           </div>

          {/* Title, Description, Type inputs */}
           <div className="space-y-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              placeholder="e.g., Pothole on Elm Street"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Issue Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about the issue..."
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Issue Type</Label>
            <Select
              required
              value={type}
              onValueChange={(value: IssueType) => setType(value)}
              disabled={loading}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                 {issueTypes.map((issueType) => (
                   <SelectItem key={issueType} value={issueType}>{issueType}</SelectItem>
                 ))}
              </SelectContent>
            </Select>
          </div>


          {/* Location Section */}
          <div className="space-y-2">
            <Label>Location</Label>
             <div className="flex items-center gap-4 p-3 border rounded-md bg-secondary/50">
                <MapPin className={`h-6 w-6 shrink-0 ${locationStatus === 'success' ? 'text-green-600' : locationStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} />
                <div className="flex-1 text-sm min-w-0"> {/* Added min-w-0 for flex shrink */}
                 {locationStatus === 'idle' && <span className="text-muted-foreground">Initializing location services...</span>}
                 {locationStatus === 'fetching' && (
                    <span className="text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Getting current location...
                    </span>
                 )}
                 {locationStatus === 'success' && location && (
                    <span className="text-foreground font-medium truncate">
                        Acquired: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </span>
                 )}
                 {locationStatus === 'error' && (
                    <span className="text-destructive font-medium truncate">
                       {locationError || 'Failed to get location.'}
                    </span>
                 )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchLocation}
                    disabled={locationStatus === 'fetching' || loading}
                    aria-label="Refetch location"
                    className="shrink-0" // Prevent button from shrinking too much
                >
                     {locationStatus === 'fetching' ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                     ) : (
                         'Retry'
                     )}
                </Button>
             </div>
              {locationStatus === 'error' && (
                 <Alert variant="destructive" className="mt-2">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Location Error</AlertTitle>
                   <AlertDescription>{locationError}</AlertDescription>
                 </Alert>
               )}
          </div>

          <Button
             type="submit"
             className="w-full"
             disabled={loading || locationStatus !== 'success' || isUploading || isAnalyzing} // Disable during submission, if location failed, uploading or analyzing
           >
            {(loading || isUploading || isAnalyzing) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isAnalyzing ? 'Analyzing...' : isUploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
