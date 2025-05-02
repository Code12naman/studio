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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Import Dialog components

// Mock data fetching function - Reads from mock-db
const mockFetchIssues = async (userId: string): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay shorter
  // Return a copy filtered by userId, sorted by date descending
  return [...allIssuesData.filter(issue => issue.reportedById === userId)].sort((a, b) => b.reportedAt - a.reportedAt);
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
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null); // For dialog

  // Mock user ID - replace with actual user ID from auth context/session
  const userId = 'citizen123';

  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchIssues(userId);
        setIssues(fetchedIssues); // Already sorted by mockFetchIssues
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
          // Simple comparison based on length and content (shallow compare for demo)
          if (currentRelevantIssues.length !== issues.length ||
              !currentRelevantIssues.every((issue, index) => issues[index] && issue.id === issues[index].id && issue.status === issues[index].status)) {
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

    // Sorting is already handled by mockFetchIssues and the polling effect update
    // tempIssues.sort((a, b) => b.reportedAt - a.reportedAt);

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
        <Dialog onOpenChange={(open) => !open && setSelectedIssue(null)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIssues.map((issue) => (
                <DialogTrigger key={issue.id} asChild>
                    <Card
                        className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                        onClick={() => setSelectedIssue(issue)}
                        role="button"
                        aria-label={`View details for issue: ${issue.title}`}
                    >
                        <CardHeader className="p-0"> {/* Remove padding to make image flush */}
                            {issue.imageUrl && (
                                <div className="relative w-full aspect-video rounded-t-lg overflow-hidden">
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
                                <div className="w-full aspect-video rounded-t-lg bg-muted flex items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-12 w-12"/>
                                </div>
                            )}
                            <div className="p-4"> {/* Add padding back for title/desc */}
                                <CardTitle className="text-lg">{issue.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                                <Tag className="h-3 w-3" /> {issue.type}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow px-4 pb-4"> {/* Adjust padding */}
                            <p className="text-sm text-foreground mb-3 line-clamp-2">{issue.description}</p> {/* Truncate description */}
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}</p>
                                <p className="flex items-center gap-1"><Calendar className="h-3 w-3"/> Reported: {format(new Date(issue.reportedAt), 'MMM d, yyyy')}</p>
                                {issue.resolvedAt && (
                                    <p className="flex items-center gap-1 text-accent"><Calendar className="h-3 w-3"/> Resolved: {format(new Date(issue.resolvedAt), 'MMM d, yyyy')}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-4 px-4 pb-4"> {/* Adjust padding */}
                            <Badge variant={getStatusBadgeVariant(issue.status)} className="flex items-center gap-1.5">
                                {getStatusIcon(issue.status)}
                                {issue.status}
                            </Badge>
                        </CardFooter>
                    </Card>
                </DialogTrigger>
            ))}
            </div>

             {/* Dialog Content for displaying issue details */}
             <DialogContent className="sm:max-w-[500px]">
                {selectedIssue && (
                    <>
                        <DialogHeader>
                        <DialogTitle>{selectedIssue.title}</DialogTitle>
                         <DialogDescription className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                             <Tag className="h-3 w-3" /> {selectedIssue.type}
                         </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {selectedIssue.imageUrl && (
                                <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                    <Image
                                        src={selectedIssue.imageUrl}
                                        alt={`Image for ${selectedIssue.title}`}
                                        layout="fill"
                                        objectFit="cover"
                                        data-ai-hint={getImageHint(selectedIssue.type)}
                                    />
                                </div>
                            )}
                             {!selectedIssue.imageUrl && (
                                <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-16 w-16"/>
                                </div>
                             )}
                            <p className="text-sm text-foreground">{selectedIssue.description}</p>
                            <div className="text-sm text-muted-foreground space-y-1 border-t pt-4 mt-2">
                                <p className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {selectedIssue.location.address || `${selectedIssue.location.latitude.toFixed(4)}, ${selectedIssue.location.longitude.toFixed(4)}`}</p>
                                <p className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Reported: {format(new Date(selectedIssue.reportedAt), 'MMM d, yyyy HH:mm')}</p>
                                {selectedIssue.resolvedAt && (
                                    <p className="flex items-center gap-2 text-accent"><CheckCircle className="h-4 w-4"/> Resolved: {format(new Date(selectedIssue.resolvedAt), 'MMM d, yyyy HH:mm')}</p>
                                )}
                                 <div className="flex items-center gap-2">
                                    <span className="w-4 h-4">{getStatusIcon(selectedIssue.status)}</span>
                                    Status: <Badge variant={getStatusBadgeVariant(selectedIssue.status)}>{selectedIssue.status}</Badge>
                                 </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```