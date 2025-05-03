
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
import { getCurrentLocationInfo, LocationInfo } from '@/services/geolocation'; // Updated import
import { Issue, IssueType, IssuePriority } from '@/types/issue';
import { addIssueToDb, calculateDueDate } from '@/lib/mock-db';
import { Camera, MapPin, Upload, LoaderCircle, AlertCircle, Sparkles, ImageUp, ShieldAlert } from 'lucide-react';
import { analyzeIssueImage, AnalyzeIssueImageOutput } from '@/ai/flows/analyze-issue-image-flow';
import { useSearchParams, useRouter } from 'next/navigation';

const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];
const priorities: IssuePriority[] = ["Low", "Medium", "High"];
const AI_IMAGE_STORAGE_KEY = 'aiCapturedImage';

// Update form schema to include address string (optional)
const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be 500 characters or less'),
  type: z.enum(issueTypes, { required_error: "Please select an issue type." }),
  priority: z.enum(priorities, { required_error: "Please select a priority level." }),
  location: z.object({
    latitude: z.number().refine(val => val !== 0, "Location must be acquired."),
    longitude: z.number().refine(val => val !== 0, "Location must be acquired."),
    address: z.string().optional(), // Address is now part of the location object
  }),
  image: z.instanceof(File).optional(),
  imageDataUri: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ReportIssuePage() {
  const [location, setLocation] = useState<LocationInfo | null>(null); // State now holds LocationInfo
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
  const [currentPriority, setCurrentPriority] = useState<IssuePriority>('Medium');


  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const aiType = searchParams?.get('aiType') as IssueType | null;
  const aiTitle = searchParams?.get('aiTitle');
  const aiDescription = searchParams?.get('aiDescription');
  const aiPriority = searchParams?.get('aiPriority') as IssuePriority | null;


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: aiTitle || '',
      description: aiDescription || '',
      type: aiType || undefined,
      priority: aiPriority || 'Medium',
      location: { latitude: 0, longitude: 0, address: undefined }, // Initialize address as undefined
      imageDataUri: undefined,
    },
  });

 useEffect(() => {
   const subscription = form.watch((value, { name }) => {
     if (name === 'priority' && value.priority) {
       setCurrentPriority(value.priority);
     }
   });
   return () => subscription.unsubscribe();
 }, [form.watch]); // Use form.watch instead of form directly

 useEffect(() => {
    const initialPriority = form.getValues('priority');
    if (initialPriority) {
        setCurrentPriority(initialPriority);
    }
 }, [form.getValues('priority')]); // Use getValues with dependency


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
            } else {
                console.log("No image found in sessionStorage for key:", AI_IMAGE_STORAGE_KEY);
            }
        } catch (e) {
            console.error("Failed to retrieve or process image from sessionStorage:", e);
        }
    }
 }, [form]); // form is stable


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
    return () => {
        stopCamera();
    };
  }, []);


  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    form.clearErrors("location.latitude");
    form.clearErrors("location.longitude");
    try {
      const locationInfo = await getCurrentLocationInfo(); // Get coordinates and address
      setLocation(locationInfo);
      form.setValue('location.latitude', locationInfo.latitude, { shouldValidate: true });
      form.setValue('location.longitude', locationInfo.longitude, { shouldValidate: true });
      form.setValue('location.address', locationInfo.address || ''); // Set address in form
      toast({ title: 'Location Acquired', description: locationInfo.address || `Lat: ${locationInfo.latitude.toFixed(4)}, Lon: ${locationInfo.longitude.toFixed(4)}` });
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
    // Only attempt to get location if neither coordinate is set
    if (form.getValues('location.latitude') === 0 && form.getValues('location.longitude') === 0) {
        handleGetLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

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
          if (hasCameraPermission === null || hasCameraPermission === true) {
             try {
                 const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                 mediaStreamRef.current = stream;
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
                 setShowCamera(false);
             }
          } else {
             setCameraError('Camera access denied. Please enable permissions in browser settings.');
             setShowCamera(false);
          }
      } else {
          setCameraError('Camera not supported on this device or browser.');
          setShowCamera(false);
      }
  };


  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current && !isTakingPhoto) {
        setIsTakingPhoto(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setImagePreview(imageDataUrl);
            form.setValue('imageDataUri', imageDataUrl);

             fetch(imageDataUrl)
               .then(res => res.blob())
               .then(blob => {
                 const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                 form.setValue('image', file);
               });

            setAiAnalysisResult(null);
            setAnalysisError(null);
            handleAiAnalysis(imageDataUrl);
            stopCamera();
        } else {
            toast({ variant: 'destructive', title: 'Capture Failed', description: 'Could not process image from camera.' });
        }
         setTimeout(() => setIsTakingPhoto(false), 100);
    }
  };


  const handleAiAnalysis = async (imageDataUri: string) => {
    if (!imageDataUri) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysisResult(null);

    const currentDescription = form.getValues('description');

    try {
      const result = await analyzeIssueImage({ imageDataUri, description: currentDescription });

      if (!issueTypes.includes(result.detectedType)) {
        console.warn(`AI detected type "${result.detectedType}" which is not in the predefined list. Defaulting to "Other".`);
        result.detectedType = "Other";
      }
       if (!priorities.includes(result.suggestedPriority)) {
           console.warn(`AI suggested priority "${result.suggestedPriority}" is invalid. Defaulting to Medium.`);
           result.suggestedPriority = "Medium";
       }

      setAiAnalysisResult(result);

      // Only update fields if they are currently empty or were just filled by AI query params
      if (!form.getValues('type') || form.getValues('type') === aiType) form.setValue('type', result.detectedType);
      if (!form.getValues('title') || form.getValues('title') === aiTitle) form.setValue('title', result.suggestedTitle);
      if (!form.getValues('description') || form.getValues('description') === aiDescription) form.setValue('description', result.suggestedDescription);

      // Always update priority suggestion, but let user override
      form.setValue('priority', result.suggestedPriority);
      setCurrentPriority(result.suggestedPriority);

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

        const userId = 'citizen123';
        const issueId = `issue${Date.now()}${Math.random().toString(16).slice(2)}`;
        const reportedAt = Date.now();
        const dueDate = calculateDueDate(reportedAt, data.priority); // Calculate due date

        // Use location data directly from the form (which now includes address)
        const submissionLocation = data.location;

        if (submissionLocation.latitude === 0 && submissionLocation.longitude === 0) {
            toast({
                title: 'Submission Failed',
                description: 'Location could not be acquired. Please try getting location again.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
        }


        const newIssue: Issue = {
            id: issueId,
            title: data.title,
            description: data.description,
            type: data.type,
            priority: data.priority,
            location: submissionLocation, // Use the location object from the form
            status: 'Pending',
            reportedById: userId,
            reportedAt: reportedAt,
            dueDate: dueDate, // Add the calculated due date
            imageUrl: data.imageDataUri,
        };


        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            addIssueToDb(newIssue);

            form.reset({
                 title: '',
                 description: '',
                 type: undefined,
                 priority: 'Medium',
                 location: { latitude: 0, longitude: 0, address: undefined }, // Reset address too
                 imageDataUri: undefined,
                 image: undefined,
            });
            setImagePreview(null);
            setAiAnalysisResult(null);
            setLocation(null); // Reset location state
            setLocationError(null);
            setAnalysisError(null);
            setCurrentPriority('Medium');

             try {
                 sessionStorage.removeItem(AI_IMAGE_STORAGE_KEY);
                 console.log("Cleared image from sessionStorage after submission.");
             } catch (e) {
                console.error("Could not remove image from sessionStorage:", e);
             }

             let dueDateString = 'N/A';
             if (dueDate) {
                try {
                    // Format date to a readable string (e.g., "Jul 15, 2024")
                    dueDateString = new Date(dueDate).toLocaleDateString('en-US', {
                       year: 'numeric', month: 'short', day: 'numeric'
                    });
                } catch (e) {
                    console.error("Error formatting due date", e);
                }
             }


            toast({
                 title: 'Issue Reported Successfully!',
                 // Updated description to include the expected resolution date
                 description: `Your report "${newIssue.title}" has been submitted. Expected resolution by ${dueDateString}.`,
                 duration: 5000,
            });

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

     // Function to get descriptive text based on selected priority
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

             <FormField
                control={form.control}
                name="imageDataUri"
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
                                 unoptimized
                            />
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
                                        stopCamera();
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
                            {showCamera && hasCameraPermission && !isTakingPhoto && (
                                <>
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
                            {showCamera && (hasCameraPermission === false || cameraError) && (
                                 <Alert variant="destructive" className="mb-2 text-left">
                                     <AlertCircle className="h-4 w-4" />
                                     <AlertTitle>Camera Error</AlertTitle>
                                     <AlertDescription>{cameraError || "Camera permission is denied."}</AlertDescription>
                                     <Button type="button" variant="outline" size="sm" onClick={stopCamera} className="mt-2">Close Camera</Button>
                                 </Alert>
                             )}
                            {showCamera && isTakingPhoto && (
                                <div className="flex items-center justify-center w-full aspect-video rounded-md bg-muted mb-2">
                                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <span className="ml-2">Processing...</span>
                                </div>
                            )}

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


            {imagePreview && !aiAnalysisResult && !isAnalyzing && !analysisError && (
                <Button type="button" variant="outline" size="sm" onClick={() => form.getValues('imageDataUri') && handleAiAnalysis(form.getValues('imageDataUri')!)} className="flex items-center gap-1" disabled={!form.getValues('imageDataUri')}>
                     <Sparkles className="h-4 w-4 text-primary"/> Analyze with AI
                 </Button>
             )}
             {isAnalyzing && (
                 <div className="flex items-center text-muted-foreground text-sm p-2 bg-secondary rounded-md">
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
                  <Alert variant="default" className="text-sm bg-accent/10 border-accent/30">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <AlertTitle>AI Analysis Suggestions</AlertTitle>
                       <AlertDescription>
                           Type: {aiAnalysisResult.detectedType}, Priority: {aiAnalysisResult.suggestedPriority}, Title: "{aiAnalysisResult.suggestedTitle}". Fields updated. Feel free to edit.
                      </AlertDescription>
                  </Alert>
               )}

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
                   {/* Display description based on currently selected priority */}
                   <FormDescription>{getPriorityDescription(currentPriority)}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        onBlur={() => {
                            // Re-analyze if image exists and description is potentially changed
                            if (imagePreview && !isAnalyzing && form.getValues('imageDataUri') && form.getValues('description') !== aiDescription) {
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
                name="location.latitude" // Bind to latitude for validation trigger
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
                        {/* Display acquired location and address */}
                        {location && !isGettingLocation && (
                        <div className="flex items-start text-sm text-foreground bg-background/50 p-3 rounded-md border border-border">
                            <MapPin className="mr-2 h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">{location.address || 'Address not available'}</p>
                                <p className="text-xs text-muted-foreground">Lat: {location.latitude.toFixed(5)}, Lon: {location.longitude.toFixed(5)}</p>
                            </div>
                        </div>
                    )}
                        {/* Button to get/refresh location */}
                        <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isGettingLocation}>
                        {isGettingLocation ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {location ? 'Refresh Location' : 'Get Current Location'}
                        </Button>
                    </Card>
                     <FormDescription>
                         {location ? "Location acquired. You can refresh if needed." : "Click the button to automatically get your current location and address."}
                    </FormDescription>
                    {/* Display validation errors related to location */}
                    {(form.formState.errors.location?.latitude || form.formState.errors.location?.longitude) && (
                         <p className="text-sm font-medium text-destructive">{form.formState.errors.location?.latitude?.message || form.formState.errors.location?.longitude?.message || "Location is required."}</p>
                     )}
                 </FormItem>
                 )}
            />


            <Button type="submit" className="w-full text-base py-3" size="lg" disabled={isSubmitting || isGettingLocation || isAnalyzing || isTakingPhoto}>
              {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>

             <canvas ref={canvasRef} style={{ display: 'none' }} />
          </form>
        </Form>
      </CardContent>

    </Card>
  );
}

    