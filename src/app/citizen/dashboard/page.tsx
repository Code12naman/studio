"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Issue, IssueStatus } from '@/types/issue';
import { format } from 'date-fns';
import { MapPin, Tag, Calendar, Info, Filter } from 'lucide-react'; // Import icons
import { Skeleton } from "@/components/ui/skeleton";

// Mock data fetching function - Replace with actual Firebase query
const mockFetchIssues = async (userId: string): Promise<Issue[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
  // Simulate fetching issues for the logged-in citizen (userId 'citizen123')
   const allIssues: Issue[] = [
    { id: 'issue1', title: 'Large Pothole on Main St', description: 'A large pothole near the intersection of Main St and 1st Ave is causing traffic issues.', type: 'Road', location: { latitude: 34.0522, longitude: -118.2437, address: 'Main St & 1st Ave' }, status: 'Pending', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 10).getTime() },
    { id: 'issue2', title: 'Streetlight Out', description: 'The streetlight at Elm St park entrance is not working.', type: 'Streetlight', location: { latitude: 34.0550, longitude: -118.2450, address: 'Elm St Park' }, status: 'In Progress', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 15).getTime(), assignedTo: 'Dept. of Public Works' },
    { id: 'issue3', title: 'Overflowing Bin', description: 'Public garbage bin at the bus stop on Oak Ave is overflowing.', type: 'Garbage', location: { latitude: 34.0500, longitude: -118.2400, address: 'Oak Ave Bus Stop' }, status: 'Resolved', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 1).getTime(), resolvedAt: new Date(2024, 5, 3).getTime() },
     { id: 'issue4', title: 'Broken Park Bench', description: 'A bench in Central Park is broken and unsafe.', type: 'Park', location: { latitude: 34.0600, longitude: -118.2500, address: 'Central Park' }, status: 'Pending', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 18).getTime() },
      { id: 'issue5', title: 'Illegal Dumping', description: 'Someone dumped trash behind the old factory on Industrial Rd.', type: 'Other', location: { latitude: 34.0400, longitude: -118.2300, address: 'Industrial Rd' }, status: 'In Progress', reportedById: 'citizen123', reportedAt: new Date(2024, 5, 19).getTime(), assignedTo: 'Sanitation Dept.' },
  ];
  return allIssues.filter(issue => issue.reportedById === userId);
};


const getStatusBadgeVariant = (status: IssueStatus): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
  switch (status) {
    case 'Pending':
      return 'secondary'; // Use secondary (gray) for pending
    case 'In Progress':
      return 'default'; // Use default (blue/primary) for in progress
    case 'Resolved':
      return 'outline'; // Use outline (theme accent green) for resolved (or define a 'success' variant)
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: IssueStatus): React.ReactNode => {
    switch (status) {
        case 'Pending':
            return <Info className="h-4 w-4 text-muted-foreground" />;
        case 'In Progress':
            return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-circle text-primary"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>; // Loader icon for In Progress
        case 'Resolved':
             return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle text-accent"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>; // CheckCircle for Resolved (using accent color)
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
        // Sort by reported date descending
        fetchedIssues.sort((a, b) => b.reportedAt - a.reportedAt);
        setIssues(fetchedIssues);
        setFilteredIssues(fetchedIssues); // Initially show all
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
    // Apply filter when filterStatus or issues change
    if (filterStatus === 'all') {
      setFilteredIssues(issues);
    } else {
      setFilteredIssues(issues.filter(issue => issue.status === filterStatus));
    }
  }, [filterStatus, issues]);

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
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
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
          {/* Optional: Add a button to report issue if list is empty */}
           {/* <Button className="mt-4">Report New Issue</Button> */}
        </div>
      )}

      {!loading && !error && filteredIssues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
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
                 {/* Optional: Add a details button */}
                 {/* <Button variant="link" size="sm" className="p-0 h-auto">Details</Button> */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
