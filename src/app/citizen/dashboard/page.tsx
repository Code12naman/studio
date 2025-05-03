
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image'; // Import next/image
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input'; // Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Issue, IssueStatus, IssueType, IssuePriority } from '@/types/issue'; // Import IssuePriority
import { allIssuesData } from '@/lib/mock-db'; // Import from mock DB
import { format, formatDistanceToNowStrict } from 'date-fns';
import { MapPin, Tag, Calendar, Info, Filter, AlertCircle, LoaderCircle, CheckCircle, Image as ImageIcon, ShieldAlert, Clock, FilePenLine, Search, History, ListChecks, BarChart3 } from 'lucide-react'; // Added icons
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
import Link from 'next/link'; // Import Link for navigation
import SummaryCard from '@/components/shared/summary-card'; // Import the SummaryCard component

// Mock user data (replace with actual authentication)
const mockCitizenUser = {
  name: "Demo Citizen",
  id: 'citizen123',
};

// Available filter options
const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];
const priorities: IssuePriority[] = ["Low", "Medium", "High"];
const statuses: IssueStatus[] = ["Pending", "In Progress", "Resolved"];


// Mock data fetching function - Reads from mock-db
const mockFetchIssues = async (userId: string): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate shorter network delay
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
      return 'outline'; // Use accent color via outline
    default:
      return 'secondary';
  }
};

const getPriorityBadgeVariant = (priority: IssuePriority): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
        case 'High': return 'destructive';
        case 'Medium': return 'default'; // Consider 'warning' variant if available or custom
        case 'Low': return 'secondary';
        default: return 'outline';
    }
};

const getPriorityIcon = (priority: IssuePriority): React.ReactNode => {
    const className = "h-3 w-3"; // Consistent small size for badges
    switch (priority) {
        case 'High': return <ShieldAlert className={`${className} text-destructive-foreground`} />;
        case 'Medium': return <ShieldAlert className={`${className} text-primary-foreground`} />; // Adjust color based on 'default' variant
        case 'Low': return <ShieldAlert className={`${className} text-secondary-foreground`} />;
        default: return <ShieldAlert className={className} />;
    }
};

const getStatusIcon = (status: IssueStatus): React.ReactNode => {
    const iconClass = "h-4 w-4"; // Consistent size
    switch (status) {
        case 'Pending':
            return <Info className={`${iconClass} text-muted-foreground`} />;
        case 'In Progress':
            return <LoaderCircle className={`${iconClass} text-primary animate-spin`} />;
        case 'Resolved':
             return <CheckCircle className={`${iconClass} text-accent`} />;
        default:
            return <Info className={`${iconClass} text-muted-foreground`} />;
    }
}

export default function CitizenDashboardPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all'); // Added filter for type
  const [filterPriority, setFilterPriority] = useState<IssuePriority | 'all'>('all'); // Added filter for priority
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null); // For dialog

  const userId = mockCitizenUser.id;

  // Calculate summary counts
  const totalReported = issues.length;
  const issuesInProgress = issues.filter(issue => issue.status === 'In Progress').length;
  const issuesResolved = issues.filter(issue => issue.status === 'Resolved').length;

  // Initial data fetch
  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchIssues(userId);
        setIssues(fetchedIssues);
        // Filters will be applied by the other useEffect
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError("Could not load your reported issues. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, [userId]);

  // Poll for updates from the mock DB
  useEffect(() => {
      const interval = setInterval(() => {
          const currentRelevantIssues = [...allIssuesData.filter(issue => issue.reportedById === userId)]
                                        .sort((a, b) => b.reportedAt - a.reportedAt);

          // More robust check: compare stringified versions
          if (JSON.stringify(currentRelevantIssues) !== JSON.stringify(issues)) {
             setIssues(currentRelevantIssues);
             console.log("Detected changes in mock DB, updating citizen dashboard...");
          }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
  }, [userId, issues]); // Re-run if userId or the local issues array changes

   // Apply filters and search whenever dependencies change
   useEffect(() => {
     let tempIssues = [...issues];

     // Filter by status
     if (filterStatus !== 'all') {
       tempIssues = tempIssues.filter(issue => issue.status === filterStatus);
     }
      // Filter by type
      if (filterType !== 'all') {
        tempIssues = tempIssues.filter(issue => issue.type === filterType);
      }
      // Filter by priority
      if (filterPriority !== 'all') {
        tempIssues = tempIssues.filter(issue => issue.priority === filterPriority);
      }

     // Filter by search term
     if (searchTerm) {
       const lowerCaseSearchTerm = searchTerm.toLowerCase();
       tempIssues = tempIssues.filter(issue =>
         issue.title.toLowerCase().includes(lowerCaseSearchTerm) ||
         issue.description.toLowerCase().includes(lowerCaseSearchTerm) ||
         (issue.location.address && issue.location.address.toLowerCase().includes(lowerCaseSearchTerm)) ||
         issue.type.toLowerCase().includes(lowerCaseSearchTerm) ||
         issue.id.toLowerCase().includes(lowerCaseSearchTerm)
       );
     }

     setFilteredIssues(tempIssues);
   }, [filterStatus, filterType, filterPriority, searchTerm, issues]); // Added filterType and filterPriority


   const getImageHint = (type: IssueType): string => {
     switch (type) {
       case 'Road': return 'pothole road street damage crack';
       case 'Garbage': return 'trash bin waste overflow litter';
       case 'Streetlight': return 'street light lamp broken night dark';
       case 'Park': return 'park bench tree playground graffiti';
       case 'Other': return 'urban issue misc graffiti hazard';
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

   // Function to get due date text color class
   const getDueDateColorClass = (dueDate?: number, status?: IssueStatus): string => {
       if (!dueDate || status === 'Resolved') return 'text-muted-foreground';
       const now = Date.now();
       const daysRemaining = (dueDate - now) / (1000 * 60 * 60 * 24);

       if (daysRemaining < 0) return 'text-destructive font-medium'; // Overdue
       if (daysRemaining <= 2) return 'text-orange-500'; // Due soon (e.g., within 2 days)
       return 'text-muted-foreground'; // Default
   };


  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground p-8 rounded-lg shadow-md -mx-4 -mt-8 mb-8">
         <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome to FixIt, {mockCitizenUser.name}!</h1>
         <p className="text-lg opacity-90">Help improve your community by reporting local issues. Together, we can make our city better.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button size="lg" asChild className="shadow hover:shadow-md transition-shadow">
          <Link href="/citizen/dashboard/report">
            <FilePenLine className="mr-2 h-5 w-5" /> Report a New Issue
          </Link>
        </Button>
         {/* "View My Reports" could link to the same page or a specific section */}
         {/* <Button size="lg" variant="outline" asChild className="shadow hover:shadow-md transition-shadow">
           <Link href="#recent-issues">
             <History className="mr-2 h-5 w-5" /> View My Reports
           </Link>
         </Button> */}
      </div>

      {/* Your Impact Section */}
      <section className="space-y-4">
         <h2 className="text-2xl font-semibold text-foreground">Your Impact</h2>
         <div className="grid gap-4 md:grid-cols-3">
             <SummaryCard
                 title="Total Issues Reported"
                 value={totalReported}
                 description="Thank you for your contributions!"
                 imageUrl="https://picsum.photos/seed/impact1/100/100"
                 imageHint="city building contribution"
                 icon={<ListChecks className="h-5 w-5" />}
                 isLoading={loading}
             />
             <SummaryCard
                 title="Issues In Progress"
                 value={issuesInProgress}
                 description="Being addressed by city workers."
                 imageUrl="https://picsum.photos/seed/impact2/100/100"
                 imageHint="tools worker progress"
                 icon={<LoaderCircle className="h-5 w-5 animate-spin" />}
                 isLoading={loading}
             />
             <SummaryCard
                 title="Issues Resolved"
                 value={issuesResolved}
                 description="Successfully completed!"
                 imageUrl="https://picsum.photos/seed/impact3/100/100"
                 imageHint="checkmark success completed"
                 icon={<CheckCircle className="h-5 w-5 text-accent" />}
                 isLoading={loading}
             />
         </div>
      </section>


      {/* Recent Issues Section */}
       <section id="recent-issues" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
             <h2 className="text-2xl font-semibold text-foreground">My Recent Issues</h2>
              <Card className="shadow-sm flex-grow max-w-4xl">
                 <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                      {/* Search Input */}
                     <div className="relative flex-grow min-w-[250px]">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input
                             type="search"
                             placeholder="Search your issues..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="pl-10 w-full bg-background shadow-sm"
                         />
                     </div>
                     {/* Filter Row */}
                     <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2 min-w-[160px]">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                           <Select value={filterStatus} onValueChange={(value: IssueStatus | 'all') => setFilterStatus(value)}>
                             <SelectTrigger className="w-full bg-background shadow-sm">
                               <SelectValue placeholder="Filter by Status" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Statuses</SelectItem>
                               {statuses.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                             </SelectContent>
                           </Select>
                        </div>
                         {/* Type Filter */}
                         <div className="flex items-center gap-2 min-w-[160px]">
                           <Tag className="h-4 w-4 text-muted-foreground" />
                           <Select value={filterType} onValueChange={(value: IssueType | 'all') => setFilterType(value)}>
                             <SelectTrigger className="w-full bg-background shadow-sm">
                               <SelectValue placeholder="Filter by Type" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Types</SelectItem>
                               {issueTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                             </SelectContent>
                           </Select>
                         </div>
                         {/* Priority Filter */}
                         <div className="flex items-center gap-2 min-w-[160px]">
                           <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                           <Select value={filterPriority} onValueChange={(value: IssuePriority | 'all') => setFilterPriority(value)}>
                             <SelectTrigger className="w-full bg-background shadow-sm">
                               <SelectValue placeholder="Filter by Priority" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Priorities</SelectItem>
                               {priorities.map((priority) => (<SelectItem key={priority} value={priority}>{priority}</SelectItem>))}
                             </SelectContent>
                           </Select>
                         </div>
                     </div>
                 </CardContent>
              </Card>
           </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-1" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                       <Skeleton className="h-4 w-1/3" />
                       <Skeleton className="h-4 w-1/4 mt-1" />
                       <div className="flex gap-2 mt-3">
                           <Skeleton className="h-5 w-20" /> {/* Priority skeleton */}
                           <Skeleton className="h-5 w-24" /> {/* Due date skeleton */}
                       </div>
                    </CardContent>
                     <CardFooter className="flex justify-between items-center border-t pt-4">
                        <Skeleton className="h-6 w-24" /> {/* Status skeleton */}
                     </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="max-w-lg mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Issues</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

           {!loading && !error && filteredIssues.length === 0 && (
             <Card className="text-center py-12 shadow border-dashed bg-card">
               <CardContent>
                   <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                   <p className="text-lg text-muted-foreground">
                     {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterPriority !== 'all' ? `No issues found matching your criteria.` : `You haven't reported any issues yet.`}
                   </p>
                   {(searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterPriority !== 'all') ? (
                     <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterType('all'); setFilterPriority('all'); }} className="mt-4">
                         Clear Filters/Search
                     </Button>
                   ) : (
                      <Button asChild className="mt-6">
                          <Link href="/citizen/dashboard/report">
                              <FilePenLine className="mr-2 h-4 w-4" /> Report Your First Issue
                          </Link>
                       </Button>
                   )}

               </CardContent>
             </Card>
           )}

           {!loading && !error && filteredIssues.length > 0 && (
              <Dialog onOpenChange={(open) => !open && setSelectedIssue(null)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredIssues.map((issue) => (
                      <DialogTrigger key={issue.id} asChild>
                          <Card
                              className="flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group bg-card hover:border-primary/50 border"
                              onClick={() => setSelectedIssue(issue)}
                              role="button"
                              aria-label={`View details for issue: ${issue.title}`}
                              tabIndex={0} // Make it focusable
                              onKeyDown={(e) => e.key === 'Enter' && setSelectedIssue(issue)}
                          >
                              <CardHeader className="p-0">
                                  <div className="relative w-full aspect-video overflow-hidden">
                                      {issue.imageUrl ? (
                                          <Image
                                              src={issue.imageUrl}
                                              alt={`Image for ${issue.title}`}
                                              layout="fill"
                                              objectFit="cover"
                                              className="transition-transform duration-300 group-hover:scale-105"
                                              data-ai-hint={getImageHint(issue.type)}
                                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Optimize image loading
                                          />
                                      ) : (
                                           <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                              <ImageIcon className="h-16 w-16 opacity-50"/>
                                          </div>
                                      )}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-12">
                                          <Badge variant="outline" className="flex items-center gap-1 w-fit bg-background/80 backdrop-blur-sm text-foreground mb-1">
                                              <Tag className="h-3 w-3"/> {issue.type}
                                          </Badge>
                                          <CardTitle className="text-lg text-primary-foreground line-clamp-2">{issue.title}</CardTitle>
                                      </div>
                                  </div>
                              </CardHeader>
                              <CardContent className="flex-grow p-4 space-y-3">
                                  <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
                                  <div className="text-xs space-y-1.5 pt-2 border-t border-dashed">
                                      <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3 w-3"/> {issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}</p>
                                      <p className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3"/> Reported: {format(new Date(issue.reportedAt), 'MMM d, yyyy')}</p>
                                      {issue.resolvedAt && (
                                          <p className="flex items-center gap-1.5 text-accent"><CheckCircle className="h-3 w-3"/> Resolved: {format(new Date(issue.resolvedAt), 'MMM d, yyyy')}</p>
                                      )}
                                      <div className="flex flex-wrap gap-2 pt-1">
                                           <TooltipProvider delayDuration={100}>
                                               <Tooltip>
                                                   <TooltipTrigger>
                                                       <Badge variant={getPriorityBadgeVariant(issue.priority)} className="flex items-center gap-1 cursor-default">
                                                           {getPriorityIcon(issue.priority)} {issue.priority}
                                                       </Badge>
                                                   </TooltipTrigger>
                                                   <TooltipContent>
                                                       <p>Priority: {issue.priority}</p>
                                                   </TooltipContent>
                                               </Tooltip>
                                           </TooltipProvider>
                                           {issue.dueDate && issue.status !== 'Resolved' && (
                                              <TooltipProvider delayDuration={100}>
                                                  <Tooltip>
                                                      <TooltipTrigger>
                                                           <Badge variant="outline" className={`flex items-center gap-1 cursor-default ${getDueDateColorClass(issue.dueDate, issue.status)} border-current`}>
                                                               <Clock className="h-3 w-3"/> {formatDueDate(issue.dueDate, issue.status)}
                                                           </Badge>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                           <p>Expected Resolution: {format(new Date(issue.dueDate), 'MMM d, yyyy')}</p>
                                                      </TooltipContent>
                                                  </Tooltip>
                                              </TooltipProvider>
                                           )}
                                      </div>
                                  </div>
                              </CardContent>
                              <CardFooter className="flex justify-between items-center border-t p-4 bg-muted/50">
                                  <Badge variant={getStatusBadgeVariant(issue.status)} className="flex items-center gap-1.5 text-sm py-1 px-2.5">
                                      {getStatusIcon(issue.status)}
                                      {issue.status}
                                  </Badge>
                                  <span className="text-xs text-primary hover:underline">View Details &rarr;</span>
                              </CardFooter>
                          </Card>
                      </DialogTrigger>
                  ))}
                  </div>

                   {/* Dialog Content for displaying issue details */}
                   <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                      {selectedIssue && (
                          <>
                              <DialogHeader className="pr-10"> {/* Add padding to avoid overlap with close button */}
                                  <DialogTitle className="text-2xl">{selectedIssue.title}</DialogTitle>
                                   {/* Use div instead of p for DialogDescription to allow block elements inside */}
                                   <DialogDescription asChild>
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm pt-2">
                                            <Badge variant="outline" className="flex items-center gap-1.5"><Tag className="h-4 w-4" /> {selectedIssue.type}</Badge>
                                            <Badge variant={getPriorityBadgeVariant(selectedIssue.priority)} className="flex items-center gap-1">
                                                {getPriorityIcon(selectedIssue.priority)} {selectedIssue.priority} Priority
                                            </Badge>
                                        </div>
                                   </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-5 py-4">
                                  <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-inner bg-muted">
                                      {selectedIssue.imageUrl ? (
                                          <Image
                                              src={selectedIssue.imageUrl}
                                              alt={`Image for ${selectedIssue.title}`}
                                              layout="fill"
                                              objectFit="cover"
                                              data-ai-hint={getImageHint(selectedIssue.type)}
                                              className="transition-transform duration-300 hover:scale-105"
                                          />
                                      ): (
                                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                              <ImageIcon className="h-20 w-20 opacity-50 mb-2"/>
                                              <span className="text-sm">No Image Provided</span>
                                          </div>
                                      )}
                                  </div>

                                  <p className="text-base text-foreground bg-secondary/50 p-4 rounded-md">{selectedIssue.description}</p>

                                  <div className="text-sm space-y-2 border-t pt-4">
                                      <h3 className="font-semibold text-foreground mb-2">Details:</h3>
                                      <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0"/> <span><strong>Location:</strong> {selectedIssue.location.address || `${selectedIssue.location.latitude.toFixed(5)}, ${selectedIssue.location.longitude.toFixed(5)}`}</span></p>
                                      <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 text-primary"/> <strong>Reported:</strong> {format(new Date(selectedIssue.reportedAt), 'MMM d, yyyy HH:mm')}</p>
                                      {selectedIssue.dueDate && (
                                           <p className={`flex items-center gap-2 ${getDueDateColorClass(selectedIssue.dueDate, selectedIssue.status)}`}>
                                               <Clock className="h-4 w-4"/> <strong>Expected By:</strong> {format(new Date(selectedIssue.dueDate), 'MMM d, yyyy')} {selectedIssue.status !== 'Resolved' ? `(${formatDueDate(selectedIssue.dueDate, selectedIssue.status)})` : ''}
                                           </p>
                                       )}
                                      {selectedIssue.resolvedAt && (
                                          <p className="flex items-center gap-2 text-accent"><CheckCircle className="h-4 w-4"/> <strong>Resolved:</strong> {format(new Date(selectedIssue.resolvedAt), 'MMM d, yyyy HH:mm')}</p>
                                      )}
                                       <div className="flex items-center gap-2 pt-2">
                                          <span className="w-4 h-4">{getStatusIcon(selectedIssue.status)}</span>
                                          <strong>Status:</strong> <Badge variant={getStatusBadgeVariant(selectedIssue.status)} className="text-sm">{selectedIssue.status}</Badge>
                                       </div>
                                       {selectedIssue.adminNotes && (
                                           <Alert className="mt-4">
                                              <AlertTitle className="flex items-center gap-2"><Info className="h-4 w-4"/>Admin Notes</AlertTitle>
                                              <AlertDescription>{selectedIssue.adminNotes}</AlertDescription>
                                           </Alert>
                                       )}
                                  </div>
                              </div>
                              <DialogFooter className="mt-4">
                                  <DialogClose asChild>
                                      <Button type="button" variant="outline">Close</Button>
                                  </DialogClose>
                              </DialogFooter>
                          </>
                      )}
                       {!selectedIssue && (
                           <div className="text-center py-10 text-muted-foreground">
                              <LoaderCircle className="h-8 w-8 mx-auto animate-spin mb-4" />
                              Loading issue details...
                          </div>
                       )}
                  </DialogContent>
              </Dialog>
            )}
       </section>
    </div>
  );
}

    