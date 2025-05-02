
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Issue, IssueStatus, IssueType, IssuePriority } from '@/types/issue'; // Import IssuePriority
import { allIssuesData, addIssueToDb, updateIssueStatusInDb, deleteIssueFromDb, updateIssuePriorityInDb } from '@/lib/mock-db'; // Import updateIssuePriorityInDb
import { format, formatDistanceToNowStrict } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Tag, Calendar, Info, Trash2, Edit, Search, Filter, CheckCircle, LoaderCircle, AlertCircle, Image as ImageIcon, User, ShieldAlert, Clock, Eye, ListChecks, BarChart3 } from 'lucide-react'; // Added icons
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Keep Card imports
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import SummaryCard from '@/components/shared/summary-card'; // Import the SummaryCard component

// Mock admin user (replace with actual auth context)
const mockAdminUser = {
    name: "Admin User"
};

// Mock data fetching function - Reads from mock-db
const mockFetchAllIssues = async (): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Slightly shorter delay
  // Sort by due date (earliest first), then by priority (High first), then reported date (newest first) for pending/in progress
  return [...allIssuesData].sort((a, b) => {
      // Keep Resolved issues at the bottom
      if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
      if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;

      // Sort by Priority (High > Medium > Low) - Primary sort for non-resolved
      const priorityOrder: Record<IssuePriority, number> = { High: 1, Medium: 2, Low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Then Sort by Due Date (earlier first) for same priority
      const dueDateA = a.dueDate || Infinity;
      const dueDateB = b.dueDate || Infinity;
      if (dueDateA !== dueDateB) return dueDateA - dueDateB;

      // Fallback to Reported Date (newest first) for same priority and due date (or no due date)
      return b.reportedAt - a.reportedAt;
  });
};


// Mock function to update issue status - Uses mock-db
const mockUpdateIssueStatus = async (issueId: string, newStatus: IssueStatus): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Faster update simulation
  const success = updateIssueStatusInDb(issueId, newStatus);
  if (!success) {
      throw new Error("Issue not found.");
  }
  console.log(`Updated issue ${issueId} status to ${newStatus}`);
};

// Mock function to update issue priority - Uses mock-db
const mockUpdateIssuePriority = async (issueId: string, newPriority: IssuePriority): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const success = updateIssuePriorityInDb(issueId, newPriority);
    if (!success) {
        throw new Error("Issue not found.");
    }
    console.log(`Updated issue ${issueId} priority to ${newPriority}`);
};


// Mock function to delete an issue - Uses mock-db
const mockDeleteIssue = async (issueId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const success = deleteIssueFromDb(issueId);
    if (!success) {
        throw new Error("Issue not found.");
    }
    console.log(`Deleted issue ${issueId}`);
};


const getStatusBadgeVariant = (status: IssueStatus): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'In Progress': return 'default'; // Use primary color for 'In Progress'
    case 'Resolved': return 'outline'; // Use accent color (green) for 'Resolved' via outline style
    default: return 'secondary';
  }
};

const getPriorityBadgeVariant = (priority: IssuePriority): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
        case 'High': return 'destructive';
        case 'Medium': return 'default'; // Consider using 'outline' or a specific color for medium if 'default' is primary blue
        case 'Low': return 'secondary';
        default: return 'outline';
    }
};

const getPriorityIcon = (priority: IssuePriority): React.ReactNode => {
    const className = "h-3 w-3";
    switch (priority) {
        case 'High': return <ShieldAlert className={`${className} text-destructive-foreground`} />;
        case 'Medium': return <ShieldAlert className={`${className} text-primary-foreground`} />; // Ensure primary-foreground contrasts with 'default' badge bg
        case 'Low': return <ShieldAlert className={`${className} text-secondary-foreground`} />;
        default: return <ShieldAlert className={className} />;
    }
};

const getStatusIcon = (status: IssueStatus): React.ReactNode => {
    const iconClass = "h-4 w-4";
    switch (status) {
        case 'Pending': return <Info className={`${iconClass} text-muted-foreground`} />;
        case 'In Progress': return <LoaderCircle className={`${iconClass} text-primary animate-spin`} />;
        case 'Resolved': return <CheckCircle className={`${iconClass} text-accent`} />;
        default: return <Info className={`${iconClass} text-muted-foreground`} />;
    }
};

// Function to format due date or time remaining
const formatDueDate = (dueDate?: number, status?: IssueStatus): string => {
    if (!dueDate || status === 'Resolved') return 'N/A';
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

    if (daysRemaining < 0) return 'text-destructive font-semibold'; // Overdue
    if (daysRemaining <= 2) return 'text-orange-500 font-medium'; // Due soon
    return 'text-muted-foreground'; // Default
};


const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];
const priorities: IssuePriority[] = ["Low", "Medium", "High"];


export default function AdminDashboardPage() {
  const [issuesList, setIssuesList] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<IssuePriority | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null); // For status/priority updates
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null); // For detail dialog
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false); // Control dialog visibility
  const { toast } = useToast();

  // Calculate summary counts
   const totalPending = issuesList.filter(issue => issue.status === 'Pending').length;
   const totalInProgress = issuesList.filter(issue => issue.status === 'In Progress').length;
   const totalResolved = issuesList.filter(issue => issue.status === 'Resolved').length;
   const highPriorityPending = issuesList.filter(issue => issue.status === 'Pending' && issue.priority === 'High').length;


  // Initial fetch
  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchAllIssues();
        setIssuesList(fetchedIssues);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError("Could not load issues. Please try again later.");
        toast({ title: "Error", description: "Failed to load issues.", variant: "destructive"});
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, [toast]); // Only run once on mount

  // Apply filters whenever dependencies change
  useEffect(() => {
    let tempIssues = [...issuesList];

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
    // Filter by search term (debounced effect is implicitly handled by state updates)
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        tempIssues = tempIssues.filter(issue =>
            issue.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            issue.description.toLowerCase().includes(lowerCaseSearchTerm) ||
            issue.id.toLowerCase().includes(lowerCaseSearchTerm) ||
            (issue.location.address && issue.location.address.toLowerCase().includes(lowerCaseSearchTerm)) ||
            issue.reportedById.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }
    // Apply sorting logic here if needed, or rely on initial fetch sort
    setFilteredIssues(tempIssues);
  }, [searchTerm, filterStatus, filterType, filterPriority, issuesList]);


    // Poll for updates from mock DB
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const currentIssuesFromDb = await mockFetchAllIssues(); // Re-fetch with sorting logic
                if (JSON.stringify(currentIssuesFromDb) !== JSON.stringify(issuesList)) {
                    console.log("Detected changes in mock DB, updating admin dashboard...");
                    setIssuesList(currentIssuesFromDb); // Update the base list, filters will re-apply
                }
            } catch (err) {
                console.error("Error polling for issue updates:", err);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [issuesList]); // Depend on local list for comparison


  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    setUpdatingIssueId(issueId);
    try {
      await mockUpdateIssueStatus(issueId, newStatus);
       const updatedList = await mockFetchAllIssues(); // Fetch updated & sorted list
       setIssuesList(updatedList); // Update base list
       // Optimistically update the selected issue in the dialog if open
       if (selectedIssue && selectedIssue.id === issueId) {
         setSelectedIssue(prev => prev ? {...prev, status: newStatus, resolvedAt: newStatus === 'Resolved' ? Date.now() : prev.resolvedAt} : null);
       }
       toast({ title: "Status Updated", description: `Issue marked as ${newStatus}.` });
    } catch (err: any) {
      console.error(`Failed to update status for issue ${issueId}:`, err);
      toast({ title: "Update Failed", description: err.message || `Could not update status.`, variant: "destructive" });
    } finally {
       setUpdatingIssueId(null);
    }
  };

  const handlePriorityChange = async (issueId: string, newPriority: IssuePriority) => {
    setUpdatingIssueId(issueId); // Use same loading state
    try {
      await mockUpdateIssuePriority(issueId, newPriority);
      const updatedList = await mockFetchAllIssues(); // Fetch updated & sorted list
      setIssuesList(updatedList); // Update base list
       // Optimistically update the selected issue in the dialog if open
       if (selectedIssue && selectedIssue.id === issueId) {
         setSelectedIssue(prev => prev ? {...prev, priority: newPriority} : null);
       }
       toast({ title: "Priority Updated", description: `Issue priority set to ${newPriority}.` });
    } catch (err: any) {
      console.error(`Failed to update priority for issue ${issueId}:`, err);
      toast({ title: "Update Failed", description: err.message || `Could not update priority.`, variant: "destructive" });
    } finally {
       setUpdatingIssueId(null);
    }
  };


   const handleDeleteIssue = async (issueId: string) => {
       setDeletingIssueId(issueId);
       try {
           await mockDeleteIssue(issueId);
           const updatedList = await mockFetchAllIssues(); // Fetch updated list
           setIssuesList(updatedList); // Update base list
           toast({ title: "Issue Deleted", description: `Issue has been removed.` });
           setIsDetailDialogOpen(false); // Close detail dialog if the deleted issue was open
           setSelectedIssue(null); // Clear selected issue
       } catch (err: any) {
           console.error(`Failed to delete issue ${issueId}:`, err);
           toast({ title: "Deletion Failed", description: err.message || `Could not delete issue.`, variant: "destructive" });
       } finally {
            setDeletingIssueId(null);
       }
   };

   const getImageHint = (type: IssueType): string => {
     switch (type) {
       case 'Road': return 'pothole road street damage';
       case 'Garbage': return 'trash bin waste overflow';
       case 'Streetlight': return 'street light lamp broken night';
       case 'Park': return 'park bench playground broken';
       case 'Other': return 'urban issue hazard graffiti';
       default: return 'issue';
     }
   };

   // Function to handle opening the detail dialog
   const handleViewDetails = (issue: Issue) => {
       setSelectedIssue(issue);
       setIsDetailDialogOpen(true);
   };

   const stopPropagation = (e: React.MouseEvent | React.FocusEvent | React.KeyboardEvent) => {
       e.stopPropagation();
   };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground p-8 rounded-lg shadow-md -mx-4 -mt-8 mb-8">
         <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
         <p className="text-lg opacity-90">Welcome, {mockAdminUser.name}! Manage and resolve community-reported issues efficiently.</p>
      </div>

      {/* Summary Cards Section */}
      <section className="space-y-4">
         <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
                 title="Pending Issues"
                 value={totalPending}
                 description={`${highPriorityPending} high priority`}
                 icon={<Info className="h-6 w-6" />}
                 imageUrl="https://picsum.photos/seed/admin1/100/100" // Placeholder
                 imageHint="pending alert todo" // Hint for placeholder
                 isLoading={loading}
             />
             <SummaryCard
                 title="Issues In Progress"
                 value={totalInProgress}
                 description="Currently being addressed"
                 icon={<LoaderCircle className="h-6 w-6 animate-spin" />}
                 imageUrl="https://picsum.photos/seed/admin2/100/100" // Placeholder
                 imageHint="progress working gear" // Hint
                 isLoading={loading}
             />
              <SummaryCard
                 title="Issues Resolved"
                 value={totalResolved}
                 description="Completed tasks"
                 icon={<CheckCircle className="h-6 w-6 text-accent" />}
                 imageUrl="https://picsum.photos/seed/admin3/100/100" // Placeholder
                 imageHint="resolved checkmark complete" // Hint
                 isLoading={loading}
             />
              <SummaryCard
                 title="Total Issues"
                 value={issuesList.length}
                 description="All reported issues"
                 icon={<BarChart3 className="h-6 w-6" />}
                 imageUrl="https://picsum.photos/seed/admin4/100/100" // Placeholder
                 imageHint="total chart graph" // Hint
                 isLoading={loading}
             />
         </div>
      </section>


      {/* Issue Management Section */}
       <section className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
             <h2 className="text-2xl font-semibold text-foreground">Manage Reported Issues</h2>
             {/* Filter and Search Controls in a Card */}
             <Card className="shadow-sm flex-grow">
                 <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                      <div className="relative flex-grow min-w-[250px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                              type="search"
                              placeholder="Search ID, title, description, reporter..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 w-full bg-background" // Use background for input inside card
                          />
                      </div>
                      {/* Status Filter */}
                      <div className="flex items-center gap-2 min-w-[160px]">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <Select value={filterStatus} onValueChange={(value: IssueStatus | 'all') => setFilterStatus(value)}>
                              <SelectTrigger className="w-full bg-background">
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
                       {/* Type Filter */}
                       <div className="flex items-center gap-2 min-w-[160px]">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <Select value={filterType} onValueChange={(value: IssueType | 'all') => setFilterType(value)}>
                              <SelectTrigger className="w-full bg-background">
                                  <SelectValue placeholder="Filter by Type" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">All Types</SelectItem>
                                   {issueTypes.map((type) => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                   ))}
                              </SelectContent>
                          </Select>
                      </div>
                      {/* Priority Filter */}
                      <div className="flex items-center gap-2 min-w-[160px]">
                          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                          <Select value={filterPriority} onValueChange={(value: IssuePriority | 'all') => setFilterPriority(value)}>
                              <SelectTrigger className="w-full bg-background">
                                  <SelectValue placeholder="Filter by Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">All Priorities</SelectItem>
                                   {priorities.map((priority) => (
                                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                                   ))}
                              </SelectContent>
                          </Select>
                      </div>
                 </CardContent>
             </Card>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                     <Skeleton key={i} className="h-[95px] w-full rounded-lg" /> // Adjusted height
                ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
              <Alert variant="destructive" className="max-w-xl mx-auto">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Error Loading Issues</AlertTitle>
                 <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* Issues Table */}
          {!loading && !error && (
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <Card className="shadow-md overflow-hidden bg-card"> {/* Use bg-card for table container */}
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[60px] pl-4">Image</TableHead>
                                    <TableHead className="min-w-[200px]">Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Due / Overdue</TableHead>
                                    <TableHead className="min-w-[150px]">Location</TableHead>
                                    <TableHead className="min-w-[150px]">Reported</TableHead>
                                    <TableHead className="min-w-[130px]">Status</TableHead>
                                    <TableHead className="text-right pr-4">Actions</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {filteredIssues.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground"> {/* Increased colSpan */}
                                            No issues found matching your criteria. Refine your search or filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredIssues.map((issue) => (
                                        <TableRow
                                            key={issue.id}
                                            className={`hover:bg-muted/50 transition-colors ${updatingIssueId === issue.id || deletingIssueId === issue.id ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                                            onClick={() => handleViewDetails(issue)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleViewDetails(issue)}
                                            tabIndex={0} // Make row focusable
                                            aria-label={`View details for issue: ${issue.title}`}
                                        >
                                            {/* Image */}
                                            <TableCell className="pl-4 py-2" onClick={stopPropagation}>
                                                {issue.imageUrl ? (
                                                    <Image
                                                        src={issue.imageUrl}
                                                        alt={`Image for ${issue.title}`}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-md object-cover aspect-square"
                                                        data-ai-hint={getImageHint(issue.type)}
                                                    />
                                                ) : (
                                                    <div className="w-[40px] h-[40px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                                        <ImageIcon className="h-5 w-5"/>
                                                    </div>
                                                )}
                                            </TableCell>
                                            {/* Title */}
                                            <TableCell className="font-medium max-w-[200px] truncate py-2" title={issue.title}>{issue.title}</TableCell>
                                            {/* Type */}
                                            <TableCell className="py-2">
                                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                    <Tag className="h-3 w-3"/> {issue.type}
                                                </Badge>
                                            </TableCell>
                                            {/* Priority */}
                                            <TableCell onClick={stopPropagation} className="py-2">
                                                 <Select
                                                     value={issue.priority}
                                                     onValueChange={(newPriority: IssuePriority) => handlePriorityChange(issue.id, newPriority)}
                                                     disabled={updatingIssueId === issue.id || deletingIssueId === issue.id}
                                                 >
                                                     <SelectTrigger
                                                         className={`w-[110px] h-8 text-xs border-0 focus:ring-0 focus:ring-offset-0 shadow-none px-2 ${getPriorityBadgeVariant(issue.priority)}`}
                                                         onFocus={stopPropagation}
                                                         aria-label={`Change priority for ${issue.title}`}
                                                      >
                                                        <span className="flex items-center gap-1">
                                                            {getPriorityIcon(issue.priority)}
                                                            <SelectValue />
                                                        </span>
                                                     </SelectTrigger>
                                                     <SelectContent onClick={stopPropagation}>
                                                         {priorities.map(p => (
                                                             <SelectItem key={p} value={p} className="text-xs">
                                                                  <span className="flex items-center gap-1">
                                                                       {getPriorityIcon(p)} {p}
                                                                  </span>
                                                             </SelectItem>
                                                         ))}
                                                     </SelectContent>
                                                 </Select>
                                            </TableCell>
                                             {/* Due Date */}
                                             <TableCell className={`text-xs max-w-[120px] truncate py-2 ${getDueDateColorClass(issue.dueDate, issue.status)}`} title={issue.dueDate ? format(new Date(issue.dueDate), 'MMM d, yyyy') : 'N/A'}>
                                                <Clock className="h-3 w-3 inline mr-1 align-[-0.1em]"/>
                                                {formatDueDate(issue.dueDate, issue.status)}
                                             </TableCell>
                                            {/* Location */}
                                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate py-2" title={issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}>
                                                <MapPin className="h-3 w-3 inline mr-1 align-[-0.1em]"/>
                                                {issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}
                                            </TableCell>
                                            {/* Reported */}
                                            <TableCell className="text-xs text-muted-foreground py-2">
                                                <div className="flex items-center gap-1" title={`Reported on ${format(new Date(issue.reportedAt), 'MMM d, yyyy HH:mm')}`}>
                                                    <Calendar className="h-3 w-3"/>
                                                    {format(new Date(issue.reportedAt), 'MMM d, yy')}
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5" title={`Reported by ${issue.reportedById}`}>
                                                    <User className="h-3 w-3"/>
                                                    <span className="truncate max-w-[100px]">{issue.reportedById}</span>
                                                </div>
                                            </TableCell>
                                            {/* Status */}
                                            <TableCell onClick={stopPropagation} className="py-2">
                                                <Select
                                                    value={issue.status}
                                                    onValueChange={(newStatus: IssueStatus) => handleStatusChange(issue.id, newStatus)}
                                                    disabled={updatingIssueId === issue.id || deletingIssueId === issue.id}
                                                >
                                                    <SelectTrigger
                                                         className={`w-[120px] h-8 text-xs border-0 focus:ring-0 focus:ring-offset-0 shadow-none px-2 ${getStatusBadgeVariant(issue.status)}`}
                                                         onClick={stopPropagation}
                                                         onFocus={stopPropagation}
                                                         aria-label={`Change status for ${issue.title}`}
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            {getStatusIcon(issue.status)}
                                                            <SelectValue />
                                                        </span>
                                                    </SelectTrigger>
                                                     <SelectContent onClick={stopPropagation}>
                                                        <SelectItem value="Pending" className="text-xs">
                                                            <span className="flex items-center gap-1.5">{getStatusIcon('Pending')} Pending</span>
                                                        </SelectItem>
                                                        <SelectItem value="In Progress" className="text-xs">
                                                            <span className="flex items-center gap-1.5">{getStatusIcon('In Progress')} In Progress</span>
                                                        </SelectItem>
                                                        <SelectItem value="Resolved" className="text-xs">
                                                            <span className="flex items-center gap-1.5">{getStatusIcon('Resolved')} Resolved</span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            {/* Actions */}
                                            <TableCell className="text-right space-x-1 pr-4 py-2" onClick={stopPropagation}>
                                              <TooltipProvider delayDuration={100}>
                                                  {/* View Details Button */}
                                                  <Tooltip>
                                                      <TooltipTrigger asChild>
                                                          {/* Use DialogTrigger directly if needed, but clicking row works */}
                                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleViewDetails(issue);}}>
                                                              <Eye className="h-4 w-4" />
                                                          </Button>
                                                      </TooltipTrigger>
                                                      <TooltipContent>View Details</TooltipContent>
                                                  </Tooltip>
                                                  {/* Delete Button needs its own AlertDialog context */}
                                                  <AlertDialog>
                                                      <Tooltip>
                                                          <TooltipTrigger asChild>
                                                              <AlertDialogTrigger asChild onClick={stopPropagation}>
                                                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={updatingIssueId === issue.id || deletingIssueId === issue.id}>
                                                                      {deletingIssueId === issue.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                  </Button>
                                                              </AlertDialogTrigger>
                                                          </TooltipTrigger>
                                                          <TooltipContent>Delete Issue</TooltipContent>
                                                      </Tooltip>
                                                      {/* Delete Confirmation Dialog */}
                                                      <AlertDialogContent onClick={stopPropagation}>
                                                          <AlertDialogHeader>
                                                              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                                              <AlertDialogDescription>
                                                              Are you sure you want to permanently delete the issue: "{issue.title}"? This action cannot be undone.
                                                              </AlertDialogDescription>
                                                          </AlertDialogHeader>
                                                          <AlertDialogFooter>
                                                              <AlertDialogCancel disabled={deletingIssueId === issue.id}>Cancel</AlertDialogCancel>
                                                              <AlertDialogAction
                                                                  onClick={() => handleDeleteIssue(issue.id)}
                                                                  disabled={deletingIssueId === issue.id}
                                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                              >
                                                                  {deletingIssueId === issue.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                                  Confirm Delete
                                                              </AlertDialogAction>
                                                          </AlertDialogFooter>
                                                      </AlertDialogContent>
                                                  </AlertDialog>
                                              </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                 {/* Issue Detail Dialog Content */}
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onOpenAutoFocus={stopPropagation}>
                    {selectedIssue ? (
                        <>
                            <DialogHeader className="pr-10"> {/* Space for close button */}
                                <DialogTitle className="text-2xl font-semibold">{selectedIssue.title}</DialogTitle>
                                 <DialogDescription className="flex flex-wrap items-center justify-between gap-2 text-sm pt-2">
                                    <Badge variant="outline" className="flex items-center gap-1.5"><Tag className="h-4 w-4" /> {selectedIssue.type}</Badge>
                                    <Badge variant={getPriorityBadgeVariant(selectedIssue.priority)} className="flex items-center gap-1">
                                        {getPriorityIcon(selectedIssue.priority)} {selectedIssue.priority} Priority
                                    </Badge>
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
                                    ) : (
                                         <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                            <ImageIcon className="h-20 w-20 opacity-50 mb-2"/>
                                            <span className="text-sm">No Image Provided</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-base text-foreground bg-secondary/50 p-4 rounded-md">{selectedIssue.description}</p>

                                <div className="text-sm space-y-2.5 border-t pt-4">
                                    <h3 className="font-semibold text-foreground mb-2">Details:</h3>
                                    <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0"/> <span><strong>Location:</strong> {selectedIssue.location.address || `${selectedIssue.location.latitude.toFixed(5)}, ${selectedIssue.location.longitude.toFixed(5)}`}</span></p>
                                    <p className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4 text-primary"/> <strong>Reporter ID:</strong> {selectedIssue.reportedById}</p>
                                    <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 text-primary"/> <strong>Reported:</strong> {format(new Date(selectedIssue.reportedAt), 'MMM d, yyyy HH:mm')}</p>
                                    {selectedIssue.dueDate && (
                                        <p className={`flex items-center gap-2 ${getDueDateColorClass(selectedIssue.dueDate, selectedIssue.status)}`}>
                                            <Clock className="h-4 w-4"/> <strong>Due:</strong> {format(new Date(selectedIssue.dueDate), 'MMM d, yyyy')} {selectedIssue.status !== 'Resolved' ? `(${formatDueDate(selectedIssue.dueDate, selectedIssue.status)})` : ''}
                                        </p>
                                    )}
                                    {selectedIssue.resolvedAt && (
                                        <p className="flex items-center gap-2 text-accent"><CheckCircle className="h-4 w-4"/> <strong>Resolved:</strong> {format(new Date(selectedIssue.resolvedAt), 'MMM d, yyyy HH:mm')}</p>
                                    )}
                                    {selectedIssue.assignedTo && (
                                        <p className="flex items-center gap-2 text-muted-foreground pt-1"><User className="h-4 w-4 text-primary"/> <strong>Assigned To:</strong> {selectedIssue.assignedTo}</p>
                                    )}
                                    {selectedIssue.adminNotes && (
                                         <Alert className="mt-4">
                                             <AlertTitle className="flex items-center gap-2"><Info className="h-4 w-4"/>Admin Notes</AlertTitle>
                                            <AlertDescription>{selectedIssue.adminNotes}</AlertDescription>
                                         </Alert>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="mt-4 sm:justify-between items-center gap-3 border-t pt-4">
                                {/* Admin actions: Change Status & Priority Dropdowns */}
                                <div className="flex gap-2 items-center justify-center sm:justify-start">
                                    <Select
                                        value={selectedIssue.status}
                                        onValueChange={(newStatus: IssueStatus) => handleStatusChange(selectedIssue.id, newStatus)}
                                        disabled={updatingIssueId === selectedIssue.id}
                                    >
                                        <SelectTrigger className="w-[150px] h-9 text-sm" aria-label="Change Status">
                                             <span className="flex items-center gap-1.5">
                                                 {getStatusIcon(selectedIssue.status)}
                                                 <SelectValue />
                                             </span>
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="Pending"><span className="flex items-center gap-1.5">{getStatusIcon('Pending')} Pending</span></SelectItem>
                                             <SelectItem value="In Progress"><span className="flex items-center gap-1.5">{getStatusIcon('In Progress')} In Progress</span></SelectItem>
                                             <SelectItem value="Resolved"><span className="flex items-center gap-1.5">{getStatusIcon('Resolved')} Resolved</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                         value={selectedIssue.priority}
                                         onValueChange={(newPriority: IssuePriority) => handlePriorityChange(selectedIssue.id, newPriority)}
                                         disabled={updatingIssueId === selectedIssue.id}
                                    >
                                         <SelectTrigger className="w-[130px] h-9 text-sm" aria-label="Change Priority">
                                              <span className="flex items-center gap-1">
                                                   {getPriorityIcon(selectedIssue.priority)}
                                                   <SelectValue />
                                              </span>
                                         </SelectTrigger>
                                         <SelectContent>
                                             {priorities.map(p => (
                                                 <SelectItem key={p} value={p}><span className="flex items-center gap-1">{getPriorityIcon(p)} {p}</span></SelectItem>
                                             ))}
                                         </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2 justify-center sm:justify-end">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild onClick={stopPropagation}>
                                            <Button variant="destructive" disabled={deletingIssueId === selectedIssue.id}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent onClick={stopPropagation}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                Are you sure you want to permanently delete the issue: "{selectedIssue.title}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={deletingIssueId === selectedIssue.id}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                onClick={() => handleDeleteIssue(selectedIssue.id)}
                                                disabled={deletingIssueId === selectedIssue.id}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                {deletingIssueId === selectedIssue.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Confirm Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Close</Button>
                                    </DialogClose>
                                </div>
                            </DialogFooter>
                        </>
                    ) : (
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

