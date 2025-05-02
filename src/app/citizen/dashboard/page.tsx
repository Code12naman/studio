
 "use client";

import { useState, useEffect } from 'react';
import Image from 'next/image'; // Import next/image
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Issue, IssueStatus, IssueType, IssuePriority } from '@/types/issue'; // Import IssuePriority
import { allIssuesData } from '@/lib/mock-db'; // Import from mock DB
import { format, formatDistanceToNowStrict } from 'date-fns';
import { MapPin, Tag, Calendar, Info, Filter, AlertCircle, LoaderCircle, CheckCircle, Image as ImageIcon, ShieldAlert, Clock } from 'lucide-react'; // Added ShieldAlert, Clock
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components


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

const getPriorityBadgeVariant = (priority: IssuePriority): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
        case 'High': return 'destructive';
        case 'Medium': return 'default';
        case 'Low': return 'secondary';
        default: return 'outline';
    }
};

const getPriorityIcon = (priority: IssuePriority): React.ReactNode => {
    const className = "h-3 w-3";
    switch (priority) {
        case 'High': return <ShieldAlert className={`${className} text-destructive-foreground`} />; // Use destructive color
        case 'Medium': return <ShieldAlert className={`${className} text-primary-foreground`} />; // Use primary color
        case 'Low': return <ShieldAlert className={`${className} text-secondary-foreground`} />; // Use secondary color
        default: return <ShieldAlert className={className} />;
    }
};

const getStatusIcon = (status: IssueStatus): React.ReactNode => {
    switch (status) {
        case 'Pending':
            return <Info className="h-4 w-4 text-muted-foreground" />;
        case 'In Progress':
            return <LoaderCircle className="h-4 w-4 text-primary animate-spin" />;
        case 'Resolved':
             return <CheckCircle className="h-4 w-4 text-accent" />;
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

  const userId = 'citizen123';

  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchIssues(userId);
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


  useEffect(() => {
      const interval = setInterval(() => {
          const currentRelevantIssues = allIssuesData.filter(issue => issue.reportedById === userId);
          if (currentRelevantIssues.length !== issues.length ||
              !currentRelevantIssues.every((issue, index) => issues[index] && issue.id === issues[index].id && issue.status === issues[index].status && issue.priority === issues[index].priority)) { // Check priority too
             currentRelevantIssues.sort((a, b) => b.reportedAt - a.reportedAt);
             setIssues(currentRelevantIssues);
             console.log("Detected changes in mock DB, updating citizen dashboard...");
          }
      }, 2000);

      return () => clearInterval(interval);
  }, [userId, issues]);


  useEffect(() => {
    let tempIssues = [...issues];

    if (filterStatus !== 'all') {
      tempIssues = tempIssues.filter(issue => issue.status === filterStatus);
    }
    // Add sorting by priority maybe? For now, stick to date.
    setFilteredIssues(tempIssues);
  }, [filterStatus, issues]);

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

   // Function to format due date or time remaining
   const formatDueDate = (dueDate?: number, status?: IssueStatus): string => {
     if (!dueDate || status === 'Resolved') return '';
     const now = Date.now();
     if (now > dueDate) {
       return `Overdue by ${formatDistanceToNowStrict(dueDate, { addSuffix: false })}`;
     }
     return `Due in ${formatDistanceToNowStrict(dueDate, { addSuffix: false })}`;
   };

   // Function to get due date badge color
   const getDueDateColor = (dueDate?: number, status?: IssueStatus): string => {
       if (!dueDate || status === 'Resolved') return 'text-muted-foreground';
       const now = Date.now();
       const daysRemaining = (dueDate - now) / (1000 * 60 * 60 * 24);

       if (daysRemaining < 0) return 'text-destructive'; // Overdue
       if (daysRemaining <= 2) return 'text-orange-500'; // Due soon (e.g., within 2 days)
       return 'text-muted-foreground'; // Default
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
                 <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                 <Skeleton className="h-4 w-1/3" />
                 <Skeleton className="h-4 w-1/4 mt-1" />
                 <Skeleton className="h-4 w-1/3 mt-2" /> {/* Skeleton for priority */}
                 <Skeleton className="h-4 w-1/2 mt-1" /> {/* Skeleton for due date */}
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
                        <CardHeader className="p-0">
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
                            <div className="p-4">
                                <CardTitle className="text-lg">{issue.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                                <Tag className="h-3 w-3" /> {issue.type}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow px-4 pb-4">
                            <p className="text-sm text-foreground mb-3 line-clamp-2">{issue.description}</p>
                            <div className="text-xs space-y-1.5"> {/* Added more space */}
                                <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3"/> {issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}</p>
                                <p className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3"/> Reported: {format(new Date(issue.reportedAt), 'MMM d, yyyy')}</p>
                                {issue.resolvedAt && (
                                    <p className="flex items-center gap-1 text-accent"><Calendar className="h-3 w-3"/> Resolved: {format(new Date(issue.resolvedAt), 'MMM d, yyyy')}</p>
                                )}
                                 <TooltipProvider>
                                     <Tooltip>
                                         <TooltipTrigger asChild>
                                             <Badge variant={getPriorityBadgeVariant(issue.priority)} className="flex items-center gap-1 cursor-default">
                                                 {getPriorityIcon(issue.priority)} Priority: {issue.priority}
                                             </Badge>
                                         </TooltipTrigger>
                                         <TooltipContent>
                                             <p>Issue Priority: {issue.priority}</p>
                                         </TooltipContent>
                                     </Tooltip>
                                 </TooltipProvider>
                                 {issue.dueDate && issue.status !== 'Resolved' && (
                                     <p className={`flex items-center gap-1 ${getDueDateColor(issue.dueDate, issue.status)}`}>
                                         <Clock className="h-3 w-3"/> {formatDueDate(issue.dueDate, issue.status)}
                                     </p>
                                 )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-4 px-4 pb-4">
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
                         <DialogDescription className="flex items-center justify-between gap-1 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {selectedIssue.type}</span>
                             <Badge variant={getPriorityBadgeVariant(selectedIssue.priority)} className="flex items-center gap-1">
                                {getPriorityIcon(selectedIssue.priority)} {selectedIssue.priority}
                             </Badge>
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
                            <div className="text-sm text-muted-foreground space-y-1.5 border-t pt-4 mt-2">
                                <p className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {selectedIssue.location.address || `${selectedIssue.location.latitude.toFixed(4)}, ${selectedIssue.location.longitude.toFixed(4)}`}</p>
                                <p className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Reported: {format(new Date(selectedIssue.reportedAt), 'MMM d, yyyy HH:mm')}</p>
                                {selectedIssue.dueDate && selectedIssue.status !== 'Resolved' && (
                                     <p className={`flex items-center gap-2 ${getDueDateColor(selectedIssue.dueDate, selectedIssue.status)}`}>
                                         <Clock className="h-4 w-4"/> {formatDueDate(selectedIssue.dueDate, selectedIssue.status)}
                                     </p>
                                 )}
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
