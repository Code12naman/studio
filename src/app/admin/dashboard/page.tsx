
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
import { MapPin, Tag, Calendar, Info, Trash2, Edit, Search, Filter, CheckCircle, LoaderCircle, AlertCircle, Image as ImageIcon, User, ShieldAlert, Clock } from 'lucide-react'; // Added ShieldAlert, Clock
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Mock data fetching function - Reads from mock-db
const mockFetchAllIssues = async (): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Sort by due date (earliest first), then by priority (High first), then reported date (newest first) for pending/in progress
  return [...allIssuesData].sort((a, b) => {
      if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
      if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;

      // Sort by Due Date (earlier first)
      const dueDateA = a.dueDate || Infinity;
      const dueDateB = b.dueDate || Infinity;
      if (dueDateA !== dueDateB) return dueDateA - dueDateB;

      // Sort by Priority (High > Medium > Low)
      const priorityOrder: Record<IssuePriority, number> = { High: 1, Medium: 2, Low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Fallback to Reported Date (newest first)
      return b.reportedAt - a.reportedAt;
  });
};


// Mock function to update issue status - Uses mock-db
const mockUpdateIssueStatus = async (issueId: string, newStatus: IssueStatus): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const success = updateIssueStatusInDb(issueId, newStatus);
  if (!success) {
      throw new Error("Issue not found.");
  }
  console.log(`Updated issue ${issueId} status to ${newStatus}`);
};

// Mock function to update issue priority - Uses mock-db
const mockUpdateIssuePriority = async (issueId: string, newPriority: IssuePriority): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const success = updateIssuePriorityInDb(issueId, newPriority);
    if (!success) {
        throw new Error("Issue not found.");
    }
    console.log(`Updated issue ${issueId} priority to ${newPriority}`);
};


// Mock function to delete an issue - Uses mock-db
const mockDeleteIssue = async (issueId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const success = deleteIssueFromDb(issueId);
    if (!success) {
        throw new Error("Issue not found.");
    }
    console.log(`Deleted issue ${issueId}`);
};


const getStatusBadgeVariant = (status: IssueStatus): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'In Progress': return 'default';
    case 'Resolved': return 'outline';
    default: return 'secondary';
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
        case 'High': return <ShieldAlert className={`${className} text-destructive-foreground`} />;
        case 'Medium': return <ShieldAlert className={`${className} text-primary-foreground`} />;
        case 'Low': return <ShieldAlert className={`${className} text-secondary-foreground`} />;
        default: return <ShieldAlert className={className} />;
    }
};

const getStatusIcon = (status: IssueStatus): React.ReactNode => {
    switch (status) {
        case 'Pending': return <Info className="h-4 w-4 text-muted-foreground" />;
        case 'In Progress': return <LoaderCircle className="h-4 w-4 text-primary animate-spin" />;
        case 'Resolved': return <CheckCircle className="h-4 w-4 text-accent" />;
        default: return <Info className="h-4 w-4 text-muted-foreground" />;
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
    if (daysRemaining <= 2) return 'text-orange-500'; // Due soon
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
  const [filterPriority, setFilterPriority] = useState<IssuePriority | 'all'>('all'); // Added priority filter
  const [loading, setLoading] = useState(true);
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null); // For status/priority updates
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    const handler = setTimeout(() => {
        let tempIssues = [...issuesList]; // Use the full list fetched initially

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
            issue.id.toLowerCase().includes(lowerCaseSearchTerm) ||
            (issue.location.address && issue.location.address.toLowerCase().includes(lowerCaseSearchTerm)) ||
            issue.reportedById.toLowerCase().includes(lowerCaseSearchTerm)
        );
        }
        // Sorting is handled by initial fetch and updates
        setFilteredIssues(tempIssues);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, filterStatus, filterType, filterPriority, issuesList]); // Added filterPriority dependency


  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchAllIssues();
        setIssuesList(fetchedIssues); // Set the full, initially sorted list
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError("Could not load issues. Please try again later.");
        toast({ title: "Error", description: "Failed to load issues.", variant: "destructive"});
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, [toast]);


    useEffect(() => {
        const interval = setInterval(async () => { // Make async to await fetch
            try {
                const currentIssuesFromDb = await mockFetchAllIssues(); // Re-fetch with sorting logic
                // Simple comparison based on length and deep content (stringify for demo)
                if (JSON.stringify(currentIssuesFromDb) !== JSON.stringify(issuesList)) {
                    console.log("Detected changes in mock DB, updating admin dashboard...");
                    setIssuesList(currentIssuesFromDb);
                }
            } catch (err) {
                console.error("Error polling for issue updates:", err);
                // Optionally show a non-intrusive error
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [issuesList]); // Depend on local list for comparison


  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    setUpdatingIssueId(issueId);
    try {
      await mockUpdateIssueStatus(issueId, newStatus);
      // Fetch the updated list to get correct sorting
       const updatedList = await mockFetchAllIssues();
       setIssuesList(updatedList);
       toast({ title: "Status Updated", description: `Issue ${issueId} marked as ${newStatus}.` });
    } catch (err: any) {
      console.error(`Failed to update status for issue ${issueId}:`, err);
      toast({ title: "Update Failed", description: err.message || `Could not update status for issue ${issueId}.`, variant: "destructive" });
    } finally {
       setUpdatingIssueId(null);
    }
  };

  const handlePriorityChange = async (issueId: string, newPriority: IssuePriority) => {
    setUpdatingIssueId(issueId); // Use same loading state
    try {
      await mockUpdateIssuePriority(issueId, newPriority);
      // Fetch the updated list to get correct sorting
      const updatedList = await mockFetchAllIssues();
      setIssuesList(updatedList);
       toast({ title: "Priority Updated", description: `Issue ${issueId} priority set to ${newPriority}.` });
    } catch (err: any) {
      console.error(`Failed to update priority for issue ${issueId}:`, err);
      toast({ title: "Update Failed", description: err.message || `Could not update priority for issue ${issueId}.`, variant: "destructive" });
    } finally {
       setUpdatingIssueId(null);
    }
  };


   const handleDeleteIssue = async (issueId: string) => {
       setDeletingIssueId(issueId);
       try {
           await mockDeleteIssue(issueId);
           // Fetch the updated list to maintain consistency
           const updatedList = await mockFetchAllIssues();
           setIssuesList(updatedList);
           toast({ title: "Issue Deleted", description: `Issue ${issueId} has been removed.` });
       } catch (err: any) {
           console.error(`Failed to delete issue ${issueId}:`, err);
           toast({ title: "Deletion Failed", description: err.message || `Could not delete issue ${issueId}.`, variant: "destructive" });
       } finally {
            setDeletingIssueId(null);
            setSelectedIssue(null);
       }
   };

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

   const stopPropagation = (e: React.MouseEvent | React.FocusEvent) => {
       e.stopPropagation();
   };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Manage Reported Issues</h1>

       <div className="flex flex-wrap gap-4 items-center p-4 bg-card rounded-lg shadow">
            <div className="relative flex-grow min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search issues or reporter ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="flex items-center gap-2 min-w-[180px]">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={(value: IssueStatus | 'all') => setFilterStatus(value)}>
                    <SelectTrigger className="w-full">
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
             <div className="flex items-center gap-2 min-w-[180px]">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={(value: IssueType | 'all') => setFilterType(value)}>
                    <SelectTrigger className="w-full">
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
            <div className="flex items-center gap-2 min-w-[180px]">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                <Select value={filterPriority} onValueChange={(value: IssuePriority | 'all') => setFilterPriority(value)}>
                    <SelectTrigger className="w-full">
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
       </div>

      {loading && (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                 <Skeleton key={i} className="h-[88px] w-full" /> // Increased height for new columns
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

      {!loading && !error && (
        <Dialog onOpenChange={(open) => !open && setSelectedIssue(null)}>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[70px]">Image</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead> {/* Added Priority column */}
                            <TableHead>Due Date</TableHead> {/* Added Due Date column */}
                            <TableHead>Location</TableHead>
                            <TableHead>Reported</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredIssues.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground"> {/* Increased colSpan */}
                                    No issues found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredIssues.map((issue) => (
                             <DialogTrigger key={issue.id} asChild>
                                <TableRow
                                    onClick={() => setSelectedIssue(issue)}
                                    className={`cursor-pointer hover:bg-muted/50 ${updatingIssueId === issue.id || deletingIssueId === issue.id ? 'opacity-50 pointer-events-none' : ''}`}
                                    aria-label={`View details for issue: ${issue.title}`}
                                >
                                    <TableCell onClick={stopPropagation}>
                                        {issue.imageUrl ? (
                                            <Image
                                                src={issue.imageUrl}
                                                alt={`Image for ${issue.title}`}
                                                width={50}
                                                height={50}
                                                className="rounded-md object-cover"
                                                data-ai-hint={getImageHint(issue.type)}
                                            />
                                        ) : (
                                            <div className="w-[50px] h-[50px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                                <ImageIcon className="h-5 w-5"/>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium max-w-[200px] truncate" title={issue.title}>{issue.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                            <Tag className="h-3 w-3"/> {issue.type}
                                        </Badge>
                                    </TableCell>
                                    {/* Priority Column */}
                                    <TableCell onClick={stopPropagation}>
                                         <Select
                                             value={issue.priority}
                                             onValueChange={(newPriority: IssuePriority) => handlePriorityChange(issue.id, newPriority)}
                                             disabled={updatingIssueId === issue.id || deletingIssueId === issue.id}
                                         >
                                             <SelectTrigger className={`w-[110px] h-8 text-xs border-0 focus:ring-0 focus:ring-offset-0 shadow-none ${getPriorityBadgeVariant(issue.priority)}`} onFocus={stopPropagation}>
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
                                     {/* Due Date Column */}
                                     <TableCell className={`text-xs max-w-[100px] truncate ${getDueDateColorClass(issue.dueDate, issue.status)}`} title={issue.dueDate ? format(new Date(issue.dueDate), 'MMM d, yyyy') : 'N/A'}>
                                        <Clock className="h-3 w-3 inline mr-1"/>
                                        {formatDueDate(issue.dueDate, issue.status)}
                                     </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}>
                                        <MapPin className="h-3 w-3 inline mr-1"/>
                                        {issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3 inline mr-1"/>
                                        {format(new Date(issue.reportedAt), 'MMM d, yyyy HH:mm')}
                                        <div className="flex items-center gap-1 mt-0.5" title={`Reported by ${issue.reportedById}`}>
                                            <User className="h-3 w-3"/>
                                            <span className="truncate max-w-[100px]">{issue.reportedById}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={issue.status}
                                            onValueChange={(newStatus: IssueStatus) => handleStatusChange(issue.id, newStatus)}
                                            disabled={updatingIssueId === issue.id || deletingIssueId === issue.id}
                                        >
                                            <SelectTrigger className={`w-[120px] h-8 text-xs border-0 focus:ring-0 focus:ring-offset-0 shadow-none ${getStatusBadgeVariant(issue.status)}`} onClick={stopPropagation} onFocus={stopPropagation}>
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
                                    <TableCell className="text-right space-x-1" onClick={stopPropagation}>
                                        <AlertDialog>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={updatingIssueId === issue.id || deletingIssueId === issue.id}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete Issue</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <AlertDialogContent onClick={stopPropagation}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the issue titled "{issue.title}".
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
                                                Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        {/* Edit button can be added later */}
                                        {/* <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button> */}
                                    </TableCell>
                                </TableRow>
                             </DialogTrigger>
                            ))
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             {/* Issue Detail Dialog Content */}
            <DialogContent className="sm:max-w-[500px]">
                {selectedIssue && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{selectedIssue.title}</DialogTitle>
                             <DialogDescription className="flex items-center justify-between gap-1 text-xs text-muted-foreground pt-1">
                                <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {selectedIssue.type}</span>
                                <Badge variant={getPriorityBadgeVariant(selectedIssue.priority)} className="flex items-center gap-1">
                                    {getPriorityIcon(selectedIssue.priority)} {selectedIssue.priority} Priority
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
                                <p className="flex items-center gap-2"><User className="h-4 w-4"/> Reporter ID: {selectedIssue.reportedById}</p>
                                {selectedIssue.dueDate && selectedIssue.status !== 'Resolved' && (
                                    <p className={`flex items-center gap-2 ${getDueDateColorClass(selectedIssue.dueDate, selectedIssue.status)}`}>
                                        <Clock className="h-4 w-4"/> Due: {format(new Date(selectedIssue.dueDate), 'MMM d, yyyy')} ({formatDueDate(selectedIssue.dueDate, selectedIssue.status)})
                                    </p>
                                )}
                                {selectedIssue.resolvedAt && (
                                    <p className="flex items-center gap-2 text-accent"><CheckCircle className="h-4 w-4"/> Resolved: {format(new Date(selectedIssue.resolvedAt), 'MMM d, yyyy HH:mm')}</p>
                                )}
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="w-4 h-4">{getStatusIcon(selectedIssue.status)}</span>
                                    Status: <Badge variant={getStatusBadgeVariant(selectedIssue.status)}>{selectedIssue.status}</Badge>
                                </div>
                                {selectedIssue.assignedTo && (
                                    <p className="pt-2"><strong className="text-foreground">Assigned To:</strong> {selectedIssue.assignedTo}</p>
                                )}
                                {selectedIssue.adminNotes && (
                                     <p className="pt-2 border-t mt-2"><strong className="text-foreground">Admin Notes:</strong> {selectedIssue.adminNotes}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="sm:justify-between items-center gap-2">
                            {/* Admin actions: Change Status & Priority Dropdowns */}
                            <div className="flex gap-2 items-center">
                                <Select
                                    value={selectedIssue.status}
                                    onValueChange={(newStatus: IssueStatus) => {
                                        handleStatusChange(selectedIssue.id, newStatus);
                                        // Optimistically update details view
                                        setSelectedIssue(prev => prev ? {...prev, status: newStatus, resolvedAt: newStatus === 'Resolved' ? Date.now() : prev.resolvedAt} : null);
                                    }}
                                    disabled={updatingIssueId === selectedIssue.id}
                                >
                                    <SelectTrigger className="w-[150px] h-9 text-sm">
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
                                     onValueChange={(newPriority: IssuePriority) => {
                                         handlePriorityChange(selectedIssue.id, newPriority);
                                         // Optimistically update details view
                                         setSelectedIssue(prev => prev ? {...prev, priority: newPriority} : null);
                                     }}
                                     disabled={updatingIssueId === selectedIssue.id}
                                >
                                     <SelectTrigger className="w-[130px] h-9 text-sm">
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

                            <div className="flex gap-2 justify-end">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Close</Button>
                                </DialogClose>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild onClick={stopPropagation}>
                                        <Button variant="destructive" disabled={deletingIssueId === selectedIssue.id}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Issue
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent onClick={stopPropagation}>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the issue titled "{selectedIssue.title}".
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
                                            Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
