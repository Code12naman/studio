
import type { Issue, IssuePriority } from '@/types/issue';
import { addDays } from 'date-fns'; // Import addDays

// Function to calculate due date based on priority
export const calculateDueDate = (reportedAt: number, priority: IssuePriority): number => {
  const reportedDate = new Date(reportedAt);
  switch (priority) {
    case 'High':
      return addDays(reportedDate, 3).getTime();
    case 'Medium':
      return addDays(reportedDate, 5).getTime();
    case 'Low':
    default: // Default to Low if priority is somehow invalid
      return addDays(reportedDate, 7).getTime();
  }
};


// In-memory array to simulate a database for issues
export let allIssuesData: Issue[] = [
  {
    id: 'issue1',
    title: 'Large Pothole on Main St',
    description: 'A large pothole near the intersection of Main St and 1st Ave is causing traffic issues.',
    type: 'Road',
    priority: 'High',
    location: { latitude: 34.0522, longitude: -118.2437, address: '100 Main St, Los Angeles' },
    status: 'Pending',
    reportedById: 'citizen123',
    reportedAt: new Date(2024, 5, 10).getTime(),
    dueDate: calculateDueDate(new Date(2024, 5, 10).getTime(), 'High'), // Use function
    imageUrl: 'https://picsum.photos/seed/issue1/400/300',
  },
  {
    id: 'issue2',
    title: 'Streetlight Out',
    description: 'The streetlight at Elm St park entrance is not working.',
    type: 'Streetlight',
    priority: 'Medium',
    location: { latitude: 34.0550, longitude: -118.2450, address: '50 Elm St, Los Angeles' },
    status: 'In Progress',
    reportedById: 'citizen123',
    reportedAt: new Date(2024, 5, 15).getTime(),
    dueDate: calculateDueDate(new Date(2024, 5, 15).getTime(), 'Medium'), // Use function
    assignedTo: 'Dept. of Public Works',
    imageUrl: 'https://picsum.photos/seed/issue2/400/300',
  },
  {
    id: 'issue3',
    title: 'Overflowing Bin',
    description: 'Public garbage bin at the bus stop on Oak Ave is overflowing.',
    type: 'Garbage',
    priority: 'Low',
    location: { latitude: 34.0500, longitude: -118.2400, address: '25 Oak Ave, Los Angeles' },
    status: 'Resolved',
    reportedById: 'citizen123',
    reportedAt: new Date(2024, 5, 1).getTime(),
    dueDate: calculateDueDate(new Date(2024, 5, 1).getTime(), 'Low'), // Use function
    resolvedAt: new Date(2024, 5, 3).getTime(),
    imageUrl: 'https://picsum.photos/seed/issue3/400/300',
  },
  {
    id: 'issue4',
    title: 'Broken Park Bench',
    description: 'A bench in Central Park is broken and unsafe.',
    type: 'Park',
    priority: 'Medium',
    location: { latitude: 34.0600, longitude: -118.2500, address: 'Central Park, Los Angeles' },
    status: 'Pending',
    reportedById: 'citizen456',
    reportedAt: new Date(2024, 5, 18).getTime(),
    dueDate: calculateDueDate(new Date(2024, 5, 18).getTime(), 'Medium'), // Use function
    imageUrl: 'https://picsum.photos/seed/issue4/400/300',
  },
  {
    id: 'issue5',
    title: 'Illegal Dumping',
    description: 'Someone dumped trash behind the old factory on Industrial Rd.',
    type: 'Other',
    priority: 'High',
    location: { latitude: 34.0400, longitude: -118.2300, address: '1 Industrial Rd, Los Angeles' },
    status: 'In Progress',
    reportedById: 'citizen789',
    reportedAt: new Date(2024, 5, 19).getTime(),
    dueDate: calculateDueDate(new Date(2024, 5, 19).getTime(), 'High'), // Use function
    assignedTo: 'Sanitation Dept.',
    imageUrl: 'https://picsum.photos/seed/issue5/400/300',
  },
  {
    id: 'issue6',
    title: 'Damaged Road Sign',
    description: 'Stop sign at Corner St & Avenue B is bent.',
    type: 'Road',
    priority: 'Medium',
    location: { latitude: 34.0700, longitude: -118.2600, address: 'Corner St & Avenue B, Los Angeles' },
    status: 'Pending',
    reportedById: 'citizen123',
    reportedAt: new Date(2024, 5, 20).getTime(),
    dueDate: calculateDueDate(new Date(2024, 5, 20).getTime(), 'Medium'), // Use function
    imageUrl: 'https://picsum.photos/seed/issue6/400/300',
  },
];

// Function to add a new issue to the mock database
export const addIssueToDb = (issue: Issue): void => {
   // Ensure dueDate is calculated based on priority if not already set
   if (!issue.dueDate) {
     issue.dueDate = calculateDueDate(issue.reportedAt, issue.priority);
   }
  allIssuesData.push(issue);
  // Sort again after adding if needed, e.g., by date descending
  allIssuesData.sort((a, b) => b.reportedAt - a.reportedAt);
};

// Function to update an issue's status in the mock database
export const updateIssueStatusInDb = (issueId: string, newStatus: Issue['status']): boolean => {
  const issueIndex = allIssuesData.findIndex(issue => issue.id === issueId);
  if (issueIndex !== -1) {
    allIssuesData[issueIndex].status = newStatus;
    if (newStatus === 'Resolved') {
      allIssuesData[issueIndex].resolvedAt = Date.now();
    } else {
      // Clear resolvedAt if status changes from Resolved
      allIssuesData[issueIndex].resolvedAt = undefined;
    }
    return true;
  }
  return false;
};

// Function to update an issue's priority in the mock database
export const updateIssuePriorityInDb = (issueId: string, newPriority: IssuePriority): boolean => {
    const issueIndex = allIssuesData.findIndex(issue => issue.id === issueId);
    if (issueIndex !== -1) {
        allIssuesData[issueIndex].priority = newPriority;
        // Recalculate due date when priority changes
        allIssuesData[issueIndex].dueDate = calculateDueDate(allIssuesData[issueIndex].reportedAt, newPriority);
        return true;
    }
    return false;
};


// Function to delete an issue from the mock database
export const deleteIssueFromDb = (issueId: string): boolean => {
    const initialLength = allIssuesData.length;
    allIssuesData = allIssuesData.filter(issue => issue.id !== issueId);
    return allIssuesData.length < initialLength;
};

    