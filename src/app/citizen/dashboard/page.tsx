"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image'; // Import next/image
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Issue, IssueStatus, IssueType } from '@/types/issue';
import { allIssuesData } from '@/lib/mock-db'; // Import from mock DB
import { format } from 'date-fns';
import { MapPin, Tag, Calendar, Info, Filter, AlertCircle, LoaderCircle, CheckCircle, Image as ImageIcon } from 'lucide-react'; // Import more icons
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


// Mock data fetching function - Reads from mock-db
const mockFetchIssues = async (userId: string): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay shorter
  // Return a copy filtered by userId
  return [...allIssuesData.filter(issue => issue.reportedById === userId)];
};


const getStatusBadgeVariant = (status: IssueStatus): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
  switch (status) {
    case 'Pending':
      return 'secondary';
    case 'In Progress':
      return 'default';
    case 'Resolved':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: IssueStatus): React.ReactNode => {
    switch (status) {
        case 'Pending':
            return <Info className="h-4 w-4 text-muted-foreground" />;
        case 'In Progress':
            return <LoaderCircle className="h-4 w-4 text-primary animate-spin" />; // Use LoaderCircle
        case 'Resolved':
             return <CheckCircle className="h-4 w-4 text-accent" />; // Use CheckCircle
        default:
            return <Info className="h-4 w-4 text-muted-foreground" />;
    }
}

export default function CitizenDashboardPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - replace with actual user ID from auth context/session
  const userId = 'citizen123';

  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchIssues(userId);
        // No need to sort here if mock-db is already sorted or sorting happens in filtering
        setIssues(fetchedIssues);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError("Could not load your reported issues. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, [userId]);

  // This effect now listens to changes in the global `allIssuesData`
  // and updates the local `issues` state if relevant changes occur.
  // NOTE: This is a simplified polling mechanism for demonstration.
  // In a real app with Firebase, you'd use Firestore's real-time listeners.
  useEffect(() => {
      const interval = setInterval(() => {
          const currentRelevantIssues = allIssuesData.filter(issue => issue.reportedById === userId);
          // Simple comparison based on length and IDs for demo purposes
          if (currentRelevantIssues.length !== issues.length ||
              !currentRelevantIssues.every(issue => issues.find(i => i.id === issue.id))) {
             // Sort before setting state to ensure consistent order
             currentRelevantIssues.sort((a, b) => b.reportedAt - a.reportedAt);
             setIssues(currentRelevantIssues);
          }
      }, 2000); // Check for changes every 2 seconds

      return () => clearInterval(interval); // Cleanup interval on unmount
  }, [userId, issues]); // Re-run if userId or the local issues array changes


  useEffect(() => {
    // Apply filter when filterStatus or the main issues list change
    let tempIssues = [...issues]; // Work with a copy

    if (filterStatus !== 'all') {
      tempIssues = tempIssues.filter(issue => issue.status === filterStatus);
    }

    // Sort by reported date descending AFTER filtering
    tempIssues.sort((a, b) => b.reportedAt - a.reportedAt);

    setFilteredIssues(tempIssues);
  }, [filterStatus, issues]); // Depend on issues list

   // Function to get placeholder keywords based on issue type
   const getImageHint = (type: IssueType): string => {
     switch (type) {
       case 'Road': return 'pothole road';
       case 'Garbage': return 'trash bin';
       case 'Streetlight': return 'street light';
       case 'Park': return 'park bench';
       case 'Other': return 'urban issue';
       default: return 'issue';
     }
   };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Reported Issues</h1>
        <div className="flex items-center gap-2">
           <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={(value: IssueStatus | 'all') => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent>
                 <Skeleton className="h-32 w-full mb-4" /> {/* Skeleton for image */}
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                 <Skeleton className="h-4 w-1/3" />
                 <Skeleton className="h-4 w-1/4 mt-1" />
              </CardContent>
               <CardFooter className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
               </CardFooter>
            </Card>
          ))}
        </div>
      )}

       {error && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

      {!loading && !error && filteredIssues.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            {filterStatus === 'all' ? "You haven't reported any issues yet." : `No issues found with status "${filterStatus}".`}
          </p>
           <Button asChild className="mt-4">
             <a href="/citizen/dashboard/report">Report New Issue</a>
           </Button>
        </div>
      )}

      {!loading && !error && filteredIssues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                 {issue.imageUrl && (
                    <div className="relative w-full aspect-video mb-4 rounded-t-lg overflow-hidden">
                        <Image
                            src={issue.imageUrl}
                            alt={`Image for ${issue.title}`}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint={getImageHint(issue.type)}
                        />
                    </div>
                 )}
                 {!issue.imageUrl && (
                    <div className="w-full aspect-video mb-4 rounded-t-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12"/>
                    </div>
                 )}
                <CardTitle className="text-lg">{issue.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                   <Tag className="h-3 w-3" /> {issue.type}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-foreground mb-3">{issue.description}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}</p>
                    <p className="flex items-center gap-1"><Calendar className="h-3 w-3"/> Reported: {format(new Date(issue.reportedAt), 'MMM d, yyyy')}</p>
                     {issue.resolvedAt && (
                         <p className="flex items-center gap-1 text-accent"><Calendar className="h-3 w-3"/> Resolved: {format(new Date(issue.resolvedAt), 'MMM d, yyyy')}</p>
                     )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t pt-4">
                 <Badge variant={getStatusBadgeVariant(issue.status)} className="flex items-center gap-1.5">
                      {getStatusIcon(issue.status)}
                      {issue.status}
                 </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
