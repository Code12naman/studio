 "use client";

import { useState, useEffect } from 'react';
import Image from 'next/image'; // Import next/image
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Issue, IssueStatus, IssueType } from '@/types/issue';
import { allIssuesData, addIssueToDb, updateIssueStatusInDb, deleteIssueFromDb } from '@/lib/mock-db'; // Import from mock DB
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Import Dialog components for details
import { useToast } from "@/hooks/use-toast";
import { MapPin, Tag, Calendar, Info, Trash2, Edit, Search, Filter, CheckCircle, LoaderCircle, AlertCircle, Image as ImageIcon, User } from 'lucide-react'; // Added ImageIcon, User
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Mock data fetching function - Reads from mock-db
const mockFetchAllIssues = async (): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay shorter
  // Return a copy sorted by date descending
  return [...allIssuesData].sort((a, b) => b.reportedAt - a.reportedAt);
};

// Mock function to update issue status - Uses mock-db
const mockUpdateIssueStatus = async (issueId: string, newStatus: IssueStatus): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  const success = updateIssueStatusInDb(issueId, newStatus);
  if (!success) {
      throw new Error("Issue not found.");
  }
  console.log(`Updated issue ${issueId} status to ${newStatus}`);
};

// Mock function to delete an issue - Uses mock-db
const mockDeleteIssue = async (issueId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
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

const getStatusIcon = (status: IssueStatus): React.ReactNode => {
    switch (status) {
        case 'Pending': return <Info className="h-4 w-4 text-muted-foreground" />;
        case 'In Progress': return <LoaderCircle className="h-4 w-4 text-primary animate-spin" />;
        case 'Resolved': return <CheckCircle className="h-4 w-4 text-accent" />;
        default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
};

const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];


export default function AdminDashboardPage() {
  const [issuesList, setIssuesList] = useState<Issue[]>([]); // Renamed from allIssues
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null); // For details dialog
  const { toast } = useToast();

  // Debounce search term effect
  useEffect(() => {
    const handler = setTimeout(() => {
        let tempIssues = [...issuesList]; // Work with a copy of the current issues list

        // Filter by status
        if (filterStatus !== 'all') {
        tempIssues = tempIssues.filter(issue => issue.status === filterStatus);
        }

        // Filter by type
        if (filterType !== 'all') {
        tempIssues = tempIssues.filter(issue => issue.type === filterType);
        }

        // Filter by search term
        if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        tempIssues = tempIssues.filter(issue =>
            issue.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            issue.description.toLowerCase().includes(lowerCaseSearchTerm) ||
            issue.id.toLowerCase().includes(lowerCaseSearchTerm) ||
            (issue.location.address && issue.location.address.toLowerCase().includes(lowerCaseSearchTerm)) ||
            issue.reportedById.toLowerCase().includes(lowerCaseSearchTerm) // Search by reporter ID
        );
        }

        // Sorting is handled by initial fetch and updates
        // tempIssues.sort((a, b) => b.reportedAt - a.reportedAt);

        setFilteredIssues(tempIssues);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(handler); // Cleanup timeout on unmount or change
  }, [searchTerm, filterStatus, filterType, issuesList]); // Depend on filters, search term, and issuesList

  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchAllIssues();
        setIssuesList(fetchedIssues); // Already sorted
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


    // Simplified polling for real-time updates (replace with Firestore listeners in real app)
    useEffect(() => {
        const interval = setInterval(() => {
            // Re-fetch or check for changes in the mock data source
            const currentIssuesFromDb = [...allIssuesData].sort((a, b) => b.reportedAt - a.reportedAt);
            // Simple comparison based on length and content (shallow compare for demo)
             if (currentIssuesFromDb.length !== issuesList.length ||
                 !currentIssuesFromDb.every((issue, index) => issuesList[index] && issue.id === issuesList[index].id && issue.status === issuesList[index].status)) {
                 console.log("Detected changes in mock DB, updating admin dashboard...");
                 setIssuesList(currentIssuesFromDb);
             }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [issuesList]); // Rerun if local issues list changes


  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    setUpdatingIssueId(issueId);
    try {
      await mockUpdateIssueStatus(issueId, newStatus);
      // Update local state by mapping over the existing list
      setIssuesList(prevIssues =>
        prevIssues.map(issue =>
          issue.id === issueId ? { ...issue, status: newStatus, resolvedAt: newStatus === 'Resolved' ? Date.now() : issue.resolvedAt } : issue
        ).sort((a, b) => b.reportedAt - a.reportedAt) // Re-sort after update
      );
       toast({ title: "Status Updated", description: `Issue ${issueId} marked as ${newStatus}.` });
    } catch (err: any) {
      console.error(`Failed to update status for issue ${issueId}:`, err);
      toast({ title: "Update Failed", description: err.message || `Could not update status for issue ${issueId}.`, variant: "destructive" });
    } finally {
       setUpdatingIssueId(null);
    }
  };

   const handleDeleteIssue = async (issueId: string) => {
       setDeletingIssueId(issueId);
       try {
           await mockDeleteIssue(issueId);
           // Remove from local state by filtering the existing list
           setIssuesList(prevIssues => prevIssues.filter(issue => issue.id !== issueId));
           toast({ title: "Issue Deleted", description: `Issue ${issueId} has been removed.` });
       } catch (err: any) {
           console.error(`Failed to delete issue ${issueId}:`, err);
           toast({ title: "Deletion Failed", description: err.message || `Could not delete issue ${issueId}.`, variant: "destructive" });
       } finally {
            setDeletingIssueId(null);
            setSelectedIssue(null); // Close detail view if open
       }
   };

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

    // Prevent dialog close when interacting with buttons inside the row
   const stopPropagation = (e: React.MouseEvent) => {
       e.stopPropagation();
   };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Manage Reported Issues</h1>

       {/* Filters and Search */}
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
       </div>

      {loading && (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => ( // Render 5 skeleton rows
                 <Skeleton key={i} className="h-[73px] w-full" /> // Approx height of a table row
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
                            <TableHead className="w-[70px]">Image</TableHead> {/* Added Image column */}
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Reported</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredIssues.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground"> {/* Increased colSpan */}
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
                                    <TableCell onClick={stopPropagation}> {/* Stop propagation on cell */}
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
                                    <TableCell className="font-medium max-w-[250px] truncate" title={issue.title}>{issue.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                            <Tag className="h-3 w-3"/> {issue.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={issue.location.address || `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}>
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
                                        <Badge variant={getStatusBadgeVariant(issue.status)} className="flex items-center gap-1.5 w-fit">
                                            {getStatusIcon(issue.status)}
                                            {issue.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1" onClick={stopPropagation}> {/* Stop propagation on actions cell */}
                                        {issue.status !== 'In Progress' && (
                                            <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusChange(issue.id, 'In Progress')} disabled={updatingIssueId === issue.id || deletingIssueId === issue.id}>
                                                    <LoaderCircle className="h-4 w-4" />
                                                </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Mark as In Progress</TooltipContent>
                                            </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {issue.status !== 'Resolved' && (
                                            <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" onClick={() => handleStatusChange(issue.id, 'Resolved')} disabled={updatingIssueId === issue.id || deletingIssueId === issue.id}>
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Mark as Resolved</TooltipContent>
                                            </Tooltip>
                                            </TooltipProvider>
                                        )}
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
                                            <AlertDialogContent onClick={stopPropagation}> {/* Stop propagation on dialog content */}
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
                                <p className="flex items-center gap-2"><User className="h-4 w-4"/> Reporter ID: {selectedIssue.reportedById}</p>
                                {selectedIssue.resolvedAt && (
                                    <p className="flex items-center gap-2 text-accent"><CheckCircle className="h-4 w-4"/> Resolved: {format(new Date(selectedIssue.resolvedAt), 'MMM d, yyyy HH:mm')}</p>
                                )}
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="w-4 h-4">{getStatusIcon(selectedIssue.status)}</span>
                                    Status: <Badge variant={getStatusBadgeVariant(selectedIssue.status)}>{selectedIssue.status}</Badge>
                                </div>
                                {selectedIssue.adminNotes && (
                                     <p className="pt-2 border-t mt-2"><strong className="text-foreground">Admin Notes:</strong> {selectedIssue.adminNotes}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="sm:justify-between items-center gap-2">
                            {/* Add Admin specific actions here if needed inside the dialog, e.g., Add Note */}
                            <div className="flex gap-2 justify-end">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Close</Button>
                                </DialogClose>
                                {/* Example: Add a delete button inside the dialog footer */}
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
