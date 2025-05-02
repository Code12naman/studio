
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image'; // Import next/image
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getCurrentLocation, Coordinate } from '@/services/geolocation';
import { Issue, IssueType } from '@/types/issue';
import { addIssueToDb } from '@/lib/mock-db';
import { Camera, MapPin, Upload, LoaderCircle, AlertCircle, Sparkles } from 'lucide-react';
import { analyzeIssueImage, AnalyzeIssueImageOutput } from '@/ai/flows/analyze-issue-image-flow'; // Import the AI flow
import { useSearchParams, useRouter } from 'next/navigation'; // Import useSearchParams and useRouter


const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be 500 characters or less'),
  type: z.enum(issueTypes, { required_error: "Please select an issue type." }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  image: z.instanceof(File).optional(), // Allow file upload
  imageDataUri: z.string().optional(), // Store base64 image data
});

type FormData = z.infer<typeof formSchema>;

export default function ReportIssuePage() {
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalyzeIssueImageOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false); // State to handle photo taking transition
  const fileInputRef = useRef<HTMLInputElement>(null);


  const searchParams = useSearchParams();
  const router = useRouter(); // Add useRouter
  const { toast } = useToast();

  // Read query parameters for AI pre-fill
  const aiType = searchParams?.get('aiType') as IssueType | null;
  const aiTitle = searchParams?.get('aiTitle');
  const aiDescription = searchParams?.get('aiDescription');
  const aiImage = searchParams?.get('aiImage'); // Image Data URI


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: aiTitle || '',
      description: aiDescription || '',
      type: aiType || undefined,
      location: { latitude: 0, longitude: 0 }, // Default, will be updated
      imageDataUri: aiImage || undefined, // Pre-fill image data URI
    },
  });

  // Pre-fill image preview if aiImage exists
   useEffect(() => {
     if (aiImage) {
       setImagePreview(aiImage);
     }
   }, [aiImage]);


    // Ref to store the stream to stop it later
    const mediaStreamRef = useRef<MediaStream | null>(null);

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
        setShowCamera(false); // Hide camera view
        setHasCameraPermission(null); // Reset permission status
    };

  // Effect to handle stopping the camera when the component unmounts or showCamera becomes false
  useEffect(() => {
    // Cleanup function: Stop camera when component unmounts or showCamera changes
    return () => {
        stopCamera();
    };
  }, []); // Empty dependency array means this runs only on mount and unmount


  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      form.setValue('location.latitude', coords.latitude);
      form.setValue('location.longitude', coords.longitude);
      toast({ title: 'Location Acquired', description: `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}` });
    } catch (error: any) {
      setLocationError(error.message || 'Could not get location.');
      toast({ title: 'Location Error', description: error.message || 'Failed to get location.', variant: 'destructive' });
    } finally {
      setIsGettingLocation(false);
    }
  };


  // Request location on initial load
  useEffect(() => {
    handleGetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        form.setValue('imageDataUri', base64String); // Set image data for submission and analysis
        setAiAnalysisResult(null); // Reset previous AI analysis
        setAnalysisError(null); // Clear previous analysis errors
        handleAiAnalysis(base64String); // Trigger AI analysis on new image
      };
       reader.onerror = () => {
         toast({
           variant: 'destructive',
           title: 'File Read Error',
           description: 'Could not read the selected file.',
         });
       };
      reader.readAsDataURL(file);
    }
     // Reset file input to allow selecting the same file again if needed
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
     }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleShowCamera = async () => {
      if (showCamera) {
           stopCamera(); // Stop camera if already showing
           return;
      }
      setCameraError(null);
      setHasCameraPermission(null); // Reset permission status
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          setShowCamera(true); // Show camera UI elements (including video tag)
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
              setCameraError('Camera access denied or camera not found. Please enable permissions.');
              toast({
                  variant: 'destructive',
                  title: 'Camera Error',
                  description: 'Could not access camera. Check permissions or try uploading.',
              });
              setShowCamera(false); // Hide camera view again if permission fails
          }
      } else {
          setCameraError('Camera not supported on this device or browser.');
          setShowCamera(false);
      }
  };


  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        setIsTakingPhoto(true); // Indicate photo is being processed
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageDataUrl = canvas.toDataURL('image/jpeg'); // Use JPEG
            setImagePreview(imageDataUrl);
            form.setValue('imageDataUri', imageDataUrl); // Set image data for submission
             // Convert Data URL to File object (optional, if backend needs File)
             fetch(imageDataUrl)
               .then(res => res.blob())
               .then(blob => {
                 const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                 form.setValue('image', file);
               });
            setAiAnalysisResult(null); // Reset previous AI analysis
            setAnalysisError(null);
             handleAiAnalysis(imageDataUrl); // Trigger AI analysis
             stopCamera(); // Stop the camera stream after taking photo
        }
         // Short delay to allow UI update before setting isTakingPhoto back to false
         setTimeout(() => setIsTakingPhoto(false), 100);
    }
  };


  const handleAiAnalysis = async (imageDataUri: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysisResult(null);

    try {
      const result = await analyzeIssueImage({ imageDataUri });
      // Validate detectedType against the allowed enum values
      if (!issueTypes.includes(result.detectedType)) {
        console.warn(`AI detected type "${result.detectedType}" which is not in the predefined list. Defaulting to "Other".`);
        result.detectedType = "Other";
      }
      setAiAnalysisResult(result);
      // Optionally pre-fill form fields if not already filled or if user confirms
      if (!form.getValues('type')) form.setValue('type', result.detectedType);
      if (!form.getValues('title')) form.setValue('title', result.suggestedTitle);
      if (!form.getValues('description')) form.setValue('description', result.suggestedDescription);
      toast({ title: 'AI Analysis Complete', description: `Suggested Type: ${result.detectedType}` });
    } catch (err) {
      console.error('AI analysis failed:', err);
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setAnalysisError(`Analysis failed: ${errorMessage}`);
      toast({ variant: 'destructive', title: 'AI Analysis Failed', description: errorMessage });
    } finally {
      setIsAnalyzing(false);
    }
  };


    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        if (!location) {
        toast({ title: 'Location Missing', description: 'Please ensure location is acquired before submitting.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
        }

        // Mock user ID - replace with actual user ID from auth context/session
        const userId = 'citizen123';
        const issueId = `issue${Date.now()}${Math.random().toString(16).slice(2)}`; // Simple unique ID generation

        // Ensure location from state is used if form value wasn't updated (shouldn't happen with useEffect, but safety check)
        const submissionLocation = {
             latitude: data.location.latitude || location.latitude,
             longitude: data.location.longitude || location.longitude,
             address: data.location.address, // Address might be added later via geocoding
        };

        const newIssue: Issue = {
        id: issueId,
        title: data.title,
        description: data.description,
        type: data.type,
        location: submissionLocation,
        status: 'Pending',
        reportedById: userId,
        reportedAt: Date.now(),
        // Store image data URI directly if no file handling backend exists, otherwise store URL after upload
        imageUrl: data.imageDataUri, // Using imageDataUri directly for mock scenario
        };


        try {
            // Simulate saving to DB
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
            addIssueToDb(newIssue);

             // Reset form, image preview, AI analysis, location state
            form.reset({
                 title: '',
                 description: '',
                 type: undefined, // Reset select
                 location: { latitude: 0, longitude: 0 },
                 imageDataUri: undefined,
            });
            setImagePreview(null);
            setAiAnalysisResult(null);
            setLocation(null); // Reset location state
            setLocationError(null);
            setAnalysisError(null);

            toast({
                 title: 'Issue Reported Successfully!',
                 description: `Your report "${newIssue.title}" has been submitted.`,
            });

            // Attempt to get location again for the next report
            handleGetLocation();

             // Optionally, redirect to the dashboard after successful submission
             router.push('/citizen/dashboard');


        } catch (error) {
             console.error("Failed to submit issue:", error);
             toast({
                 title: 'Submission Failed',
                 description: 'Could not submit your report. Please try again.',
                 variant: 'destructive',
             });
        } finally {
            setIsSubmitting(false);
        }
    };


  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Report a New Issue</CardTitle>
        <CardDescription>Fill in the details below to report an issue in your community.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

             {/* Image Upload/Camera Section */}
             <FormItem>
               <FormLabel>Issue Image (Optional)</FormLabel>
               <FormControl>
                 <Card className="border-dashed border-2 hover:border-primary transition-colors">
                   <CardContent className="p-4 text-center">
                     {imagePreview ? (
                       <div className="relative group">
                         <Image src={imagePreview} alt="Issue preview" width={400} height={300} className="rounded-md mx-auto mb-2 object-contain max-h-[300px]" />
                          {/* Overlay Buttons on hover */}
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                              <Button type="button" variant="secondary" size="sm" onClick={triggerFileUpload}>
                                 <Upload className="h-4 w-4 mr-1" /> Change
                              </Button>
                               <Button type="button" variant="secondary" size="sm" onClick={handleShowCamera}>
                                  <Camera className="h-4 w-4 mr-1" /> Retake
                               </Button>
                               <Button
                                   type="button"
                                   variant="destructive"
                                   size="sm"
                                   onClick={() => {
                                       setImagePreview(null);
                                       form.setValue('image', undefined);
                                       form.setValue('imageDataUri', undefined);
                                       setAiAnalysisResult(null);
                                        stopCamera(); // Ensure camera stops if it was open
                                   }}
                                >
                                   Remove
                                </Button>
                           </div>
                       </div>
                     ) : (
                         <>
                           {showCamera && hasCameraPermission && !isTakingPhoto && (
                               <>
                                   <video ref={videoRef} className="w-full aspect-video rounded-md bg-black mb-2" autoPlay muted playsInline />
                                   <Button type="button" onClick={handleTakePhoto} className="mb-2">
                                       <Camera className="mr-2 h-4 w-4" /> Take Photo
                                   </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={stopCamera}>Cancel Camera</Button>
                               </>
                           )}
                           {showCamera && isTakingPhoto && (
                                <div className="flex items-center justify-center w-full aspect-video rounded-md bg-muted mb-2">
                                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <span className="ml-2">Processing...</span>
                                </div>
                            )}
                            {cameraError && (
                               <Alert variant="destructive" className="mb-2 text-left">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Camera Error</AlertTitle>
                                    <AlertDescription>{cameraError}</AlertDescription>
                                </Alert>
                             )}
                            {!showCamera && (
                                <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                                     <ImageUp className="h-10 w-10" />
                                    <p>Drag & drop an image, or click to upload</p>
                                    <div className="flex gap-2">
                                         <Button type="button" size="sm" variant="outline" onClick={triggerFileUpload}>
                                            <Upload className="mr-2 h-4 w-4" /> Upload File
                                         </Button>
                                         <Button type="button" size="sm" variant="outline" onClick={handleShowCamera}>
                                             <Camera className="mr-2 h-4 w-4" /> Use Camera
                                         </Button>
                                     </div>
                                     <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                      />
                                </div>
                            )}
                       </>
                     )}
                   </CardContent>
                 </Card>
               </FormControl>
               <FormDescription>Upload or take a photo of the issue.</FormDescription>
               <FormMessage />
             </FormItem>


            {/* AI Analysis Trigger/Display */}
            {imagePreview && !aiAnalysisResult && !isAnalyzing && !analysisError && (
                <Button type="button" variant="outline" size="sm" onClick={() => handleAiAnalysis(form.getValues('imageDataUri')!)} className="flex items-center gap-1">
                     <Sparkles className="h-4 w-4"/> Analyze with AI
                 </Button>
             )}
             {isAnalyzing && (
                 <div className="flex items-center text-muted-foreground text-sm">
                     <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Analyzing image...
                 </div>
              )}
              {analysisError && (
                  <Alert variant="destructive" className="text-sm">
                       <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Analysis Failed</AlertTitle>
                      <AlertDescription>{analysisError}</AlertDescription>
                  </Alert>
              )}
              {aiAnalysisResult && (
                  <Alert variant="default" className="text-sm bg-secondary">
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>AI Analysis Suggestion</AlertTitle>
                       <AlertDescription>
                           Type: {aiAnalysisResult.detectedType}, Title: "{aiAnalysisResult.suggestedTitle}". Fields have been pre-filled.
                      </AlertDescription>
                  </Alert>
               )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the type of issue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {issueTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Large pothole on Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide details about the issue..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             {/* Location Section */}
            <FormItem>
                <FormLabel>Location</FormLabel>
                <Card className="p-4 space-y-2 bg-secondary">
                   {isGettingLocation && (
                      <div className="flex items-center text-muted-foreground">
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Fetching location...
                      </div>
                   )}
                   {locationError && !isGettingLocation && (
                      <Alert variant="destructive" className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2"/>
                           <div>
                               <AlertTitle>Location Error</AlertTitle>
                               <AlertDescription>{locationError}</AlertDescription>
                           </div>
                       </Alert>
                   )}
                    {location && !isGettingLocation && (
                      <div className="flex items-center text-sm text-foreground">
                         <MapPin className="mr-2 h-4 w-4 text-primary" />
                         <span>Lat: {location.latitude.toFixed(5)}, Lon: {location.longitude.toFixed(5)}</span>
                      </div>
                   )}
                    <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isGettingLocation}>
                       {isGettingLocation ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                       {location ? 'Refresh Location' : 'Get Current Location'}
                     </Button>
                    {/* Hidden inputs for form state - already handled by form.setValue */}
                    {/* <Input type="hidden" {...form.register('location.latitude')} />
                    <Input type="hidden" {...form.register('location.longitude')} /> */}
                 </Card>
                 <FormDescription>
                     {location ? "Location acquired. You can refresh if needed." : "Click the button to get your current location."}
                </FormDescription>
                <FormMessage>{form.formState.errors.location?.latitude?.message || form.formState.errors.location?.longitude?.message}</FormMessage>
             </FormItem>


            <Button type="submit" className="w-full" disabled={isSubmitting || isGettingLocation || !location}>
              {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Report
            </Button>

              {/* Hidden canvas for taking photo */}
             <canvas ref={canvasRef} style={{ display: 'none' }} />
          </form>
        </Form>
      </CardContent>
       {/* Add a way to close the camera if open */}
        {showCamera && (
           <div className="p-4 border-t">
               <Button type="button" variant="outline" size="sm" onClick={stopCamera}>Close Camera</Button>
           </div>
        )}
    </Card>
  );
}
