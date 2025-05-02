
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
import { Issue, IssueType, IssuePriority } from '@/types/issue'; // Import IssuePriority
import { addIssueToDb, calculateDueDate } from '@/lib/mock-db'; // Import calculateDueDate
import { Camera, MapPin, Upload, LoaderCircle, AlertCircle, Sparkles, ImageUp, ShieldAlert } from 'lucide-react'; // Added ShieldAlert for priority
import { analyzeIssueImage, AnalyzeIssueImageOutput } from '@/ai/flows/analyze-issue-image-flow'; // Import the AI flow
import { useSearchParams, useRouter } from 'next/navigation';

const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];
const priorities: IssuePriority[] = ["Low", "Medium", "High"]; // Define priorities
const AI_IMAGE_STORAGE_KEY = 'aiCapturedImage'; // Key for sessionStorage

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be 500 characters or less'),
  type: z.enum(issueTypes, { required_error: "Please select an issue type." }),
  priority: z.enum(priorities, { required_error: "Please select a priority level." }), // Add priority field
  location: z.object({
    latitude: z.number().refine(val => val !== 0, "Location must be acquired."), // Ensure location is set
    longitude: z.number().refine(val => val !== 0, "Location must be acquired."),
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
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPriority, setCurrentPriority] = useState<IssuePriority>('Medium'); // State to track priority for description


  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const aiType = searchParams?.get('aiType') as IssueType | null;
  const aiTitle = searchParams?.get('aiTitle');
  const aiDescription = searchParams?.get('aiDescription');
  const aiPriority = searchParams?.get('aiPriority') as IssuePriority | null; // Retrieve priority
  // aiImage is retrieved from sessionStorage


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: aiTitle || '',
      description: aiDescription || '',
      type: aiType || undefined,
      priority: aiPriority || 'Medium', // Use AI suggested priority or default
      location: { latitude: 0, longitude: 0 },
      imageDataUri: undefined,
    },
  });

 // Watch priority field changes to update the description text
 useEffect(() => {
   const subscription = form.watch((value, { name }) => {
     if (name === 'priority' && value.priority) {
       setCurrentPriority(value.priority);
     }
   });
   return () => subscription.unsubscribe();
 }, [form.watch, form]); // Removed 'form' from dependencies as form.watch is stable

 // Update currentPriority state when form default value changes (e.g., from AI suggestion)
 useEffect(() => {
    const initialPriority = form.getValues('priority');
    if (initialPriority) {
        setCurrentPriority(initialPriority);
    }
 }, [form.getValues('priority')]); // Rerun when default priority changes


 useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            const storedImage = sessionStorage.getItem(AI_IMAGE_STORAGE_KEY);
            if (storedImage) {
                console.log("Retrieved image from sessionStorage");
                setImagePreview(storedImage);
                form.setValue('imageDataUri', storedImage);
                fetch(storedImage)
                  .then(res => res.blob())
                  .then(blob => {
                     const file = new File([blob], `ai-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                     form.setValue('image', file);
                   });
                // Do not remove here, remove after successful submission or if user cancels
                 // console.log("Cleared image from sessionStorage");
            } else {
                console.log("No image found in sessionStorage for key:", AI_IMAGE_STORAGE_KEY);
            }
        } catch (e) {
            console.error("Failed to retrieve or process image from sessionStorage:", e);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [form.setValue]); // form.setValue is stable


    const mediaStreamRef = useRef<MediaStream | null>(null);

   const stopCamera = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
            if (videoRef.current) {
               videoRef.current.srcObject = null;
            }
            console.log("Camera stopped.");
        }
        setShowCamera(false);
    };

  useEffect(() => {
    // Cleanup function to stop the camera stream when the component unmounts
    return () => {
        stopCamera();
    };
  }, []); // Empty dependency array ensures this runs only on unmount


  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    form.clearErrors("location.latitude");
    form.clearErrors("location.longitude");
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      form.setValue('location.latitude', coords.latitude, { shouldValidate: true });
      form.setValue('location.longitude', coords.longitude, { shouldValidate: true });
      toast({ title: 'Location Acquired', description: `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}` });
    } catch (error: any) {
      setLocationError(error.message || 'Could not get location.');
      toast({ title: 'Location Error', description: error.message || 'Failed to get location.', variant: 'destructive' });
       form.setError('location.latitude', { type: 'manual', message: 'Failed to get location.' });
       form.setError('location.longitude', { type: 'manual', message: 'Failed to get location.' });
    } finally {
      setIsGettingLocation(false);
    }
  };


  useEffect(() => {
    // Only get location if it's not already set (latitude is 0 is the default)
    if (form.getValues('location.latitude') === 0) {
        handleGetLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // form.getValues is stable, handleGetLocation causes infinite loop if included

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        form.setValue('imageDataUri', base64String);
        setAiAnalysisResult(null);
        setAnalysisError(null);
        // Trigger AI analysis after setting image
        handleAiAnalysis(base64String);
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
           stopCamera();
           return;
      }
      setCameraError(null);
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          setShowCamera(true);
          // Check permission state or try to get stream directly
          if (hasCameraPermission === null || hasCameraPermission === true) {
             try {
                 // Request camera with environment facing mode preference
                 const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                 mediaStreamRef.current = stream; // Store the active stream
                 setHasCameraPermission(true);
                 if (videoRef.current) {
                     // Ensure the video element is playing the stream
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
                 setShowCamera(false); // Hide camera view on error
             }
          } else {
             // Permission was explicitly denied before
             setCameraError('Camera access denied. Please enable permissions in browser settings.');
             setShowCamera(false);
          }
      } else {
          // Browser doesn't support mediaDevices
          setCameraError('Camera not supported on this device or browser.');
          setShowCamera(false);
      }
  };


  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current && !isTakingPhoto) {
        setIsTakingPhoto(true); // Indicate photo capture process started
        const video = videoRef.current;
        const canvas = canvasRef.current;
        // Set canvas dimensions to video's intrinsic dimensions for best quality
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            // Draw the current video frame onto the canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Get the image data as a JPEG data URL with quality 0.9 (adjust as needed)
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setImagePreview(imageDataUrl); // Show preview
            form.setValue('imageDataUri', imageDataUrl); // Store data URI in form

            // Convert data URL to Blob and then to File for form submission if needed
             fetch(imageDataUrl)
               .then(res => res.blob())
               .then(blob => {
                 const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                 form.setValue('image', file); // Store file object if backend expects it
               });

            setAiAnalysisResult(null); // Reset previous AI analysis
            setAnalysisError(null);
            handleAiAnalysis(imageDataUrl); // Trigger AI analysis with the new image
            stopCamera(); // Stop the camera stream after taking the photo
        } else {
            toast({ variant: 'destructive', title: 'Capture Failed', description: 'Could not process image from camera.' });
        }
         // Briefly delay setting isTakingPhoto back to false to allow UI updates
         setTimeout(() => setIsTakingPhoto(false), 100);
    }
  };


  // Function to trigger AI analysis
  const handleAiAnalysis = async (imageDataUri: string) => {
    if (!imageDataUri) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysisResult(null); // Reset previous results

    // Get current description from the form to provide context
    const currentDescription = form.getValues('description');

    try {
      // Call the AI flow with image data and optional description
      const result = await analyzeIssueImage({ imageDataUri, description: currentDescription });

      // Validate and potentially correct the detected type
      if (!issueTypes.includes(result.detectedType)) {
        console.warn(`AI detected type "${result.detectedType}" which is not in the predefined list. Defaulting to "Other".`);
        result.detectedType = "Other";
      }
      // Validate suggested priority
       if (!priorities.includes(result.suggestedPriority)) {
           console.warn(`AI suggested priority "${result.suggestedPriority}" is invalid. Defaulting to Medium.`);
           result.suggestedPriority = "Medium";
       }

      setAiAnalysisResult(result);

      // Update form fields only if they are currently empty or using defaults
      if (!form.getValues('type')) form.setValue('type', result.detectedType);
      if (!form.getValues('title')) form.setValue('title', result.suggestedTitle);
      if (!form.getValues('description')) form.setValue('description', result.suggestedDescription);
      // Always update priority based on AI suggestion, allowing user override later
      form.setValue('priority', result.suggestedPriority);
      setCurrentPriority(result.suggestedPriority); // Update the local state for description display

      toast({ title: 'AI Analysis Complete', description: `Suggested Type: ${result.detectedType}, Priority: ${result.suggestedPriority}` });
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

        // Use a mock user ID for now
        const userId = 'citizen123';
        // Generate a unique issue ID
        const issueId = `issue${Date.now()}${Math.random().toString(16).slice(2)}`;
        const reportedAt = Date.now(); // Get current timestamp
        const dueDate = calculateDueDate(reportedAt, data.priority); // Calculate due date using priority

        // Ensure location data is valid before creating the issue object
        const submissionLocation = {
             latitude: data.location.latitude,
             longitude: data.location.longitude,
             address: data.location.address, // Address might be undefined, that's okay
        };
         // Basic check to ensure location was acquired
        if (submissionLocation.latitude === 0 && submissionLocation.longitude === 0) {
            toast({
                title: 'Submission Failed',
                description: 'Location could not be acquired. Please try getting location again.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
            return; // Prevent submission without location
        }


        const newIssue: Issue = {
            id: issueId,
            title: data.title,
            description: data.description,
            type: data.type,
            priority: data.priority, // Include priority from form
            location: submissionLocation,
            status: 'Pending',
            reportedById: userId,
            reportedAt: reportedAt,
            dueDate: dueDate, // Include calculated due date
            // Use the imageDataUri stored in the form state. Ensure it's cleared if image is removed.
            imageUrl: data.imageDataUri,
        };


        try {
            // Simulate network delay for submission
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Add the new issue to the mock database
            addIssueToDb(newIssue);

            // Reset form fields to their default values after successful submission
            form.reset({
                 title: '',
                 description: '',
                 type: undefined,
                 priority: 'Medium', // Reset priority to default
                 location: { latitude: 0, longitude: 0, address: undefined },
                 imageDataUri: undefined,
                 image: undefined,
            });
            // Clear UI state
            setImagePreview(null);
            setAiAnalysisResult(null);
            setLocation(null);
            setLocationError(null);
            setAnalysisError(null);
            setCurrentPriority('Medium'); // Reset priority display state

             // Attempt to clear the image from sessionStorage
             try {
                 sessionStorage.removeItem(AI_IMAGE_STORAGE_KEY);
                 console.log("Cleared image from sessionStorage after submission.");
             } catch (e) {
                console.error("Could not remove image from sessionStorage:", e);
             }

             // Format the due date for the success toast
             let dueDateString = 'N/A';
             if (dueDate) {
                try {
                    dueDateString = new Date(dueDate).toLocaleDateString();
                } catch (e) {
                    console.error("Error formatting due date", e);
                    // Keep dueDateString as 'N/A' if formatting fails
                }
             }


            toast({
                 title: 'Issue Reported Successfully!',
                 description: `Your report "${newIssue.title}" has been submitted. Expected resolution by ${dueDateString}.`,
                 duration: 5000, // Show for 5 seconds
            });

             // Redirect to the citizen dashboard after successful submission
             router.push('/citizen/dashboard');


        } catch (error) {
             console.error("Failed to submit issue:", error);
             toast({
                 title: 'Submission Failed',
                 description: 'Could not submit your report. Please try again.',
                 variant: 'destructive',
             });
        } finally {
            setIsSubmitting(false); // Reset submitting state
        }
    };

    // Helper to get priority description based on the current selection
     const getPriorityDescription = (priority: IssuePriority): string => {
       switch (priority) {
         case 'High': return 'High: Critical issue affecting safety or essential services. Expected resolution within 3 days.';
         case 'Medium': return 'Medium: Standard issue causing inconvenience. Expected resolution within 5 days.';
         case 'Low': return 'Low: Minor issue or cosmetic problem. Expected resolution within 7 days.';
         default: return 'Select the urgency of this issue.';
       }
     };


  return (
    <Card className="max-w-2xl mx-auto shadow-lg border border-border rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/50 border-b border-border p-4">
        <CardTitle className="text-xl">Report a New Issue</CardTitle>
        <CardDescription>Fill in the details below to report an issue in your community.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

             {/* Image Upload/Camera Section */}
             <FormField
                control={form.control}
                name="imageDataUri" // Bind to imageDataUri to manage the preview/source
                render={({ fieldState }) => (
                <FormItem>
                <FormLabel>Issue Image (Optional, Recommended for AI)</FormLabel>
                <FormControl>
                    <Card className="border-dashed border-2 hover:border-primary transition-colors bg-secondary/30">
                    <CardContent className="p-4 text-center">
                        {imagePreview ? (
                        <div className="relative group mb-2">
                             <Image
                                 src={imagePreview}
                                 alt="Issue preview"
                                 width={400}
                                 height={300}
                                 className="rounded-md mx-auto object-contain max-h-[300px] border shadow-sm"
                                 unoptimized // Important for data URIs
                            />
                             {/* Overlay buttons for changing/removing image */}
                             <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <Button type="button" variant="secondary" size="sm" onClick={triggerFileUpload} title="Upload a different image" disabled={isAnalyzing || isTakingPhoto}>
                                    <Upload className="h-4 w-4 mr-1" /> Change
                                </Button>
                                <Button type="button" variant="secondary" size="sm" onClick={handleShowCamera} title="Take a new photo" disabled={isAnalyzing || isTakingPhoto}>
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
                                        stopCamera(); // Ensure camera is stopped if it was open
                                    }}
                                    title="Remove image"
                                    disabled={isAnalyzing || isTakingPhoto}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                        ) : (
                        <>
                            {/* Camera View */}
                            {showCamera && hasCameraPermission && !isTakingPhoto && (
                                <>
                                    {/* Always render video tag but conditionally display */}
                                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-black mb-2 shadow-inner" autoPlay muted playsInline />
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Button type="button" onClick={handleTakePhoto} className="mb-2" disabled={isTakingPhoto || isAnalyzing}>
                                             {isTakingPhoto ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <Camera className="mr-2 h-4 w-4" />}
                                             {isTakingPhoto ? 'Capturing...' : 'Take Photo'}
                                         </Button>
                                         <Button type="button" variant="outline" size="sm" onClick={stopCamera} disabled={isTakingPhoto || isAnalyzing}>Cancel Camera</Button>
                                     </div>
                                </>
                            )}
                            {/* Camera Permission Denied or Error State */}
                            {showCamera && (hasCameraPermission === false || cameraError) && (
                                 <Alert variant="destructive" className="mb-2 text-left">
                                     <AlertCircle className="h-4 w-4" />
                                     <AlertTitle>Camera Error</AlertTitle>
                                     <AlertDescription>{cameraError || "Camera permission is denied."}</AlertDescription>
                                     <Button type="button" variant="outline" size="sm" onClick={stopCamera} className="mt-2">Close Camera</Button>
                                 </Alert>
                             )}
                            {/* Taking Photo Loader */}
                            {showCamera && isTakingPhoto && (
                                <div className="flex items-center justify-center w-full aspect-video rounded-md bg-muted mb-2">
                                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <span className="ml-2">Processing...</span>
                                </div>
                            )}

                            {/* Initial Prompt: Upload or Use Camera */}
                            {!showCamera && !imagePreview && (
                                <div className="flex flex-col items-center space-y-3 text-muted-foreground py-6">
                                    <ImageUp className="h-10 w-10" />
                                    <p className="text-sm">Add an image for AI analysis (optional)</p>
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={triggerFileUpload} disabled={isAnalyzing}>
                                            <Upload className="mr-2 h-4 w-4" /> Upload File
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={handleShowCamera} disabled={isAnalyzing}>
                                            <Camera className="mr-2 h-4 w-4" /> Use Camera
                                        </Button>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        aria-label="Upload issue image"
                                    />
                                </div>
                            )}
                        </>
                        )}
                    </CardContent>
                    </Card>
                </FormControl>
                <FormDescription>Provide a clear image of the issue for better analysis and priority suggestion.</FormDescription>
                <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
                )}
            />


            {/* AI Analysis Trigger/Display */}
            {/* Show Analyze button only if image exists and no analysis is running/failed */}
            {imagePreview && !aiAnalysisResult && !isAnalyzing && !analysisError && (
                <Button type="button" variant="outline" size="sm" onClick={() => form.getValues('imageDataUri') && handleAiAnalysis(form.getValues('imageDataUri')!)} className="flex items-center gap-1" disabled={!form.getValues('imageDataUri')}>
                     <Sparkles className="h-4 w-4 text-primary"/> Analyze with AI
                 </Button>
             )}
             {/* Show Analyzing indicator */}
             {isAnalyzing && (
                 <div className="flex items-center text-muted-foreground text-sm p-2 bg-secondary rounded-md">
                     <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Analyzing image...
                 </div>
              )}
              {/* Show Analysis Error */}
              {analysisError && (
                  <Alert variant="destructive" className="text-sm">
                       <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Analysis Failed</AlertTitle>
                      <AlertDescription>{analysisError}</AlertDescription>
                  </Alert>
              )}
              {/* Show AI Analysis Result */}
              {aiAnalysisResult && (
                  <Alert variant="default" className="text-sm bg-accent/10 border-accent/30">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <AlertTitle>AI Analysis Suggestions</AlertTitle>
                       <AlertDescription>
                           Type: {aiAnalysisResult.detectedType}, Priority: {aiAnalysisResult.suggestedPriority}, Title: "{aiAnalysisResult.suggestedTitle}". Fields updated. Feel free to edit.
                      </AlertDescription>
                  </Alert>
               )}

            {/* Issue Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
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

            {/* Priority Selection */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority} value={priority}>
                            <span className="flex items-center gap-2">
                                <ShieldAlert className={`h-4 w-4 ${priority === 'High' ? 'text-destructive' : priority === 'Medium' ? 'text-orange-500' : 'text-muted-foreground'}`}/>
                                {priority}
                            </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   {/* Show dynamic description based on selected priority */}
                   <FormDescription>{getPriorityDescription(currentPriority)}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title Input */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Large pothole on Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Input */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                        placeholder="Provide details about the issue. This helps AI suggest priority."
                        {...field}
                        rows={4}
                        // Trigger re-analysis if description changes significantly after image analysis
                        onBlur={() => {
                            if (imagePreview && !isAnalyzing) {
                                // Consider adding a length check or debounce if needed
                                handleAiAnalysis(form.getValues('imageDataUri')!);
                            }
                        }}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             {/* Location Section */}
             <FormField
                control={form.control}
                // Use a field from the location object to trigger validation correctly
                name="location.latitude"
                render={() => (
                 <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <Card className="p-4 space-y-3 bg-secondary/30 border border-border">
                    {isGettingLocation && (
                        <div className="flex items-center text-muted-foreground text-sm">
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Fetching location...
                        </div>
                    )}
                    {locationError && !isGettingLocation && (
                        <Alert variant="destructive" className="flex items-center text-sm">
                            <AlertCircle className="h-4 w-4 mr-2"/>
                            <div>
                                <AlertTitle className="text-sm">Location Error</AlertTitle>
                                <AlertDescription className="text-xs">{locationError}</AlertDescription>
                            </div>
                        </Alert>
                    )}
                        {/* Display acquired location */}
                        {location && !isGettingLocation && (
                        <div className="flex items-center text-sm text-foreground bg-background/50 p-2 rounded-md border border-border">
                            <MapPin className="mr-2 h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">Lat: {location.latitude.toFixed(5)}, Lon: {location.longitude.toFixed(5)}</span>
                        </div>
                    )}
                        {/* Button to get/refresh location */}
                        <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isGettingLocation}>
                        {isGettingLocation ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {location ? 'Refresh Location' : 'Get Current Location'}
                        </Button>
                    </Card>
                     <FormDescription>
                         {location ? "Location acquired. You can refresh if needed." : "Click the button to automatically get your current location."}
                    </FormDescription>
                    {/* Display validation errors related to location */}
                    {(form.formState.errors.location?.latitude || form.formState.errors.location?.longitude) && (
                         <p className="text-sm font-medium text-destructive">{form.formState.errors.location?.latitude?.message || form.formState.errors.location?.longitude?.message || "Location is required."}</p>
                     )}
                 </FormItem>
                 )}
            />


            {/* Submit Button */}
            <Button type="submit" className="w-full text-base py-3" size="lg" disabled={isSubmitting || isGettingLocation || isAnalyzing || isTakingPhoto}>
              {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>

              {/* Hidden canvas for taking photo */}
             <canvas ref={canvasRef} style={{ display: 'none' }} />
          </form>
        </Form>
      </CardContent>

    </Card>
  );
}

