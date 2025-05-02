"use client";

import { useState, useEffect, useRef } from 'react';
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
import { MapPin, Loader2, Send, Upload, X, Image as ImageIcon } from 'lucide-react'; // Added Upload, X, ImageIcon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert

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
const mockUploadImage = async (file: File): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload delay
    console.log(`Simulating upload for: ${file.name}`);
    // In a real app, this would upload to Cloud Storage and return the URL.
    // For mock, use picsum with a seed based on timestamp/randomness for variety.
    const seed = Date.now() + Math.random();
    return `https://picsum.photos/seed/${seed}/600/400`;
};

export default function ReportIssuePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType | ''>('');
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null); // Store the selected image file
  const [imagePreview, setImagePreview] = useState<string | null>(null); // For showing image preview
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false); // General form submission loading
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock user ID
  const userId = 'citizen123';

  const fetchLocation = async () => {
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
  };

   useEffect(() => {
     fetchLocation(); // Fetch location on component mount
   }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const removeImage = () => {
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input
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

    // 1. Upload image if selected
    if (imageFile) {
        setIsUploading(true);
        try {
            imageUrl = await mockUploadImage(imageFile);
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

   const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Report a New Issue</CardTitle>
        <CardDescription>Fill in the details below and optionally add a photo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title, Description, Type inputs remain the same */}
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


           {/* Image Upload Section */}
           <div className="space-y-2">
             <Label htmlFor="image">Upload Photo (Optional)</Label>
             <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || !!imagePreview} // Disable if loading or image already selected
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? 'Change Photo' : 'Select Photo'}
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
                 {imagePreview && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                        <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 h-6 w-6 rounded-full"
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
             </div>
             {isUploading && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading image...
                  </div>
                )}
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
             disabled={loading || locationStatus !== 'success' || isUploading} // Disable during submission, if location failed, or while uploading
           >
            {(loading || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isUploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
