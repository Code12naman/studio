"use client";

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Issue, IssueStatus, IssueType } from '@/types/issue';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Tag, Calendar, Info, Trash2, Edit, Search, Filter, CheckCircle, LoaderCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

// Mock data fetching function - Replace with actual Firebase query for ALL issues
const mockFetchAllIssues = async (): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
   const allIssues: Issue[] = [
    { id: 'issue1', title: 'Large Pothole on Main St', description: 'A large pothole near the intersection of Main St and 1st Ave is causing traffic issues.', type: 'Road', location: { latitude: 34.0522, longitude: -118.2437, address: 'Main St & 1st Ave' }, status: 'Pending', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 10).getTime() },
    { id: 'issue2', title: 'Streetlight Out', description: 'The streetlight at Elm St park entrance is not working.', type: 'Streetlight', location: { latitude: 34.0550, longitude: -118.2450, address: 'Elm St Park' }, status: 'In Progress', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 15).getTime(), assignedTo: 'Dept. of Public Works' },
    { id: 'issue3', title: 'Overflowing Bin', description: 'Public garbage bin at the bus stop on Oak Ave is overflowing.', type: 'Garbage', location: { latitude: 34.0500, longitude: -118.2400, address: 'Oak Ave Bus Stop' }, status: 'Resolved', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 1).getTime(), resolvedAt: new Date(2024, 5, 3).getTime() },
    { id: 'issue4', title: 'Broken Park Bench', description: 'A bench in Central Park is broken and unsafe.', type: 'Park', location: { latitude: 34.0600, longitude: -118.2500, address: 'Central Park' }, status: 'Pending', reportedById: 'citizen456', reportedAt: new Date(2024, 5, 18).getTime() },
    { id: 'issue5', title: 'Illegal Dumping', description: 'Someone dumped trash behind the old factory on Industrial Rd.', type: 'Other', location: { latitude: 34.0400, longitude: -118.2300, address: 'Industrial Rd' }, status: 'In Progress', reportedById: 'citizen789', reportedAt: new Date(2024, 5, 19).getTime(), assignedTo: 'Sanitation Dept.' },
     { id: 'issue6', title: 'Damaged Road Sign', description: 'Stop sign at Corner St & Avenue B is bent.', type: 'Road', location: { latitude: 34.0700, longitude: -118.2600, address: 'Corner St & Avenue B' }, status: 'Pending', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 20).getTime() },
  ];
  return allIssues;
};

// Mock function to update issue status - Replace with Firebase update
const mockUpdateIssueStatus = async (issueId: string, newStatus: IssueStatus): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
  console.log(`Updating issue ${issueId} status to ${newStatus}`);
   // Simulate potential error
  // if (Math.random() > 0.8) {
  //   throw new Error("Failed to update issue status in the database.");
  // }
};

// Mock function to delete an issue - Replace with Firebase delete
const mockDeleteIssue = async (issueId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    console.log(`Deleting issue ${issueId}`);
    // Simulate potential error
    // if (Math.random() > 0.8) {
    //   throw new Error("Failed to delete issue from the database.");
    // }
};


const getStatusBadgeVariant = (status: IssueStatus): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'In Progress': return 'default';
    case 'Resolved': return 'outline'; // Assuming outline uses accent color
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
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null); // Track which issue is being updated
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null); // Track which issue is being deleted
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedIssues = await mockFetchAllIssues();
        fetchedIssues.sort((a, b) => b.reportedAt - a.reportedAt); // Sort by date
        setAllIssues(fetchedIssues);
        setFilteredIssues(fetchedIssues); // Apply initial filters/search if any (currently none)
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError("Could not load issues. Please try again later.");
        toast({ title: "Error", description: "Failed to load issues.", variant: "destructive"});
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, []);

   // Apply filters and search whenever dependencies change
   useEffect(() => {
     let tempIssues = allIssues;

     // Filter by status
     if (filterStatus !== 'all') {
       tempIssues = tempIssues.filter(issue => issue.status === filterStatus);
     }

     // Filter by type
     if (filterType !== 'all') {
       tempIssues = tempIssues.filter(issue => issue.type === filterType);
     }

     // Filter by search term (simple title/description search)
     if (searchTerm) {
       const lowerCaseSearchTerm = searchTerm.toLowerCase();
       tempIssues = tempIssues.filter(issue =>
         issue.title.toLowerCase().includes(lowerCaseSearchTerm) ||
         issue.description.toLowerCase().includes(lowerCaseSearchTerm) ||
         issue.id.toLowerCase().includes(lowerCaseSearchTerm) ||
         (issue.location.address && issue.location.address.toLowerCase().includes(lowerCaseSearchTerm))
       );
     }

     setFilteredIssues(tempIssues);
   }, [searchTerm, filterStatus, filterType, allIssues]);

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    setUpdatingIssueId(issueId); // Indicate loading state for this specific row/action
    try {
      await mockUpdateIssueStatus(issueId, newStatus);
      // Update local state Optimistically or Refetch
      setAllIssues(prevIssues =>
        prevIssues.map(issue =>
          issue.id === issueId ? { ...issue, status: newStatus, resolvedAt: newStatus === 'Resolved' ? Date.now() : issue.resolvedAt } : issue
        )
      );
       toast({ title: "Status Updated", description: `Issue ${issueId} marked as ${newStatus}.` });
    } catch (err: any) {
      console.error(`Failed to update status for issue ${issueId}:`, err);
      toast({ title: "Update Failed", description: err.message || `Could not update status for issue ${issueId}.`, variant: "destructive" });
    } finally {
       setUpdatingIssueId(null); // Reset loading state
    }
  };

   const handleDeleteIssue = async (issueId: string) => {
       setDeletingIssueId(issueId);
       try {
           await mockDeleteIssue(issueId);
           // Remove from local state
           setAllIssues(prevIssues => prevIssues.filter(issue => issue.id !== issueId));
           toast({ title: "Issue Deleted", description: `Issue ${issueId} has been removed.` });
       } catch (err: any) {
           console.error(`Failed to delete issue ${issueId}:`, err);
           toast({ title: "Deletion Failed", description: err.message || `Could not delete issue ${issueId}.`, variant: "destructive" });
       } finally {
            setDeletingIssueId(null);
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
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
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
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No issues found matching your criteria.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredIssues.map((issue) => (
                        <TableRow key={issue.id} className={`${updatingIssueId === issue.id || deletingIssueId === issue.id ? 'opacity-50 pointer-events-none' : ''}`}>
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
                               {/* Add Edit button/modal later if needed */}
                               {/* <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                               </Button> */}
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

// Need to import Tooltip components used within the loop
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
