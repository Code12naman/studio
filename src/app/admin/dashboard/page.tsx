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
import { useToast } from "@/hooks/use-toast";
import { MapPin, Tag, Calendar, Info, Trash2, Edit, Search, Filter, CheckCircle, LoaderCircle, AlertCircle, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Mock data fetching function - Reads from mock-db
const mockFetchAllIssues = async (): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay shorter
  // Return a copy to avoid direct state mutation if the source array is used elsewhere
  return [...allIssuesData];
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
  const { toast } = useToast();

  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchAllIssues();
        // No need to sort here if mock-db is already sorted or sorting happens in filtering
        setIssuesList(fetchedIssues);
        // setFilteredIssues(fetchedIssues); // Filtering will handle this in the next effect
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

   // Apply filters and search whenever dependencies change
   useEffect(() => {
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
         (issue.location.address && issue.location.address.toLowerCase().includes(lowerCaseSearchTerm))
       );
     }

     // Sort by date descending AFTER filtering
     tempIssues.sort((a, b) => b.reportedAt - a.reportedAt);

     setFilteredIssues(tempIssues);
   }, [searchTerm, filterStatus, filterType, issuesList]); // Depend on issuesList

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    setUpdatingIssueId(issueId);
    try {
      await mockUpdateIssueStatus(issueId, newStatus);
      // Update local state by mapping over the existing list
      setIssuesList(prevIssues =>
        prevIssues.map(issue =>
          issue.id === issueId ? { ...issue, status: newStatus, resolvedAt: newStatus === 'Resolved' ? Date.now() : issue.resolvedAt } : issue
        )
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Manage Reported Issues</h1>

       {/* Filters and Search */}
       <div className="flex flex-wrap gap-4 items-center p-4 bg-card rounded-lg shadow">
            <div className="relative flex-grow min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by title, description, ID, address..."
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
            {[...Array(4)].map((_, i) => ( // Render 4 skeleton rows
                <Card key={i} className="p-0">
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-[100px]" /></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
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

      {!loading && !error && (
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
                        <TableRow key={issue.id} className={`${updatingIssueId === issue.id || deletingIssueId === issue.id ? 'opacity-50 pointer-events-none' : ''}`}>
                            <TableCell>
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
                                <br/>
                                <span className="text-xs">by {issue.reportedById}</span>
                            </TableCell>
                            <TableCell>
                            <Badge variant={getStatusBadgeVariant(issue.status)} className="flex items-center gap-1.5 w-fit">
                                {getStatusIcon(issue.status)}
                                {issue.status}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
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
                                <AlertDialogContent>
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
                        ))
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
