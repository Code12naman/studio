"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Issue, IssueType } from '@/types/issue';
import { getCurrentLocation, Coordinate } from '@/services/geolocation'; // Import geolocation service
import { MapPin, Loader2, Send } from 'lucide-react'; // Import icons

// Mock function to simulate saving the issue to Firebase
const mockSaveIssue = async (issueData: Omit<Issue, 'id' | 'reportedAt' | 'status' | 'reportedById'> & { userId: string }): Promise<Issue> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
  const newIssue: Issue = {
    ...issueData,
    id: `issue-${Date.now()}`, // Generate a simple unique ID
    reportedAt: Date.now(),
    status: 'Pending',
    reportedById: issueData.userId,
  };
  console.log("Saving issue:", newIssue);
  // Simulate potential error
  // if (Math.random() > 0.8) {
  //   throw new Error("Failed to save issue to the database.");
  // }
  return newIssue;
};

export default function ReportIssuePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType | ''>('');
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Mock user ID - replace with actual user ID from auth context/session
  const userId = 'citizen123';

  const fetchLocation = async () => {
    setLocationStatus('fetching');
    setLocationError(null);
    try {
      const coords = await getCurrentLocation(); // Use the service
      setLocation(coords);
      setLocationStatus('success');
       toast({
         title: "Location Fetched",
         description: `Coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
       });
    } catch (error) {
      console.error("Error fetching location:", error);
      setLocationStatus('error');
      setLocationError("Could not get your location. Please ensure location services are enabled.");
       toast({
         title: "Location Error",
         description: "Could not get your location. Please try again or enter manually if possible.",
         variant: "destructive",
       });
    }
  };

   // Fetch location automatically on component mount
   useEffect(() => {
     fetchLocation();
   }, []); // Empty dependency array ensures this runs only once on mount


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !type || !location) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all fields and ensure location is fetched.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await mockSaveIssue({
        title,
        description,
        type,
        location,
        userId,
      });
      toast({
        title: "Issue Reported Successfully",
        description: "Thank you for helping improve our community!",
        variant: "default", // Use default variant for success (often green via accent)
      });
      router.push('/citizen/dashboard'); // Redirect back to the dashboard
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
        <CardDescription>Fill in the details below to report an issue in your area.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-2">
            <Label>Location</Label>
             <div className="flex items-center gap-4 p-3 border rounded-md bg-secondary/50">
                <MapPin className={`h-6 w-6 ${locationStatus === 'success' ? 'text-accent' : 'text-muted-foreground'}`} />
                <div className="flex-1 text-sm">
                 {locationStatus === 'idle' && <span className="text-muted-foreground">Fetching location...</span>}
                 {locationStatus === 'fetching' && <span className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Getting current location...</span>}
                 {locationStatus === 'success' && location && <span className="text-foreground font-medium">Location acquired: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>}
                 {locationStatus === 'error' && <span className="text-destructive">{locationError || 'Failed to get location.'}</span>}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchLocation}
                    disabled={locationStatus === 'fetching' || loading}
                    aria-label="Refetch location"
                >
                    <Loader2 className={`h-4 w-4 ${locationStatus === 'fetching' ? 'animate-spin' : 'hidden'}`} />
                    {locationStatus !== 'fetching' && 'Retry'}
                </Button>
             </div>
               {locationStatus === 'error' && <p className="text-xs text-destructive mt-1">{locationError}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading || locationStatus !== 'success'}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
