import type { Issue } from '@/types/issue';

// In-memory array to simulate a database for issues
export let allIssuesData: Issue[] = [
  {
    id: 'issue1',
    title: 'Large Pothole on Main St',
    description: 'A large pothole near the intersection of Main St and 1st Ave is causing traffic issues.',
    type: 'Road',
    location: { latitude: 34.0522, longitude: -118.2437, address: 'Main St & 1st Ave' },
    status: 'Pending',
    reportedById: 'citizen123',
    reportedAt: new Date(2024, 5, 10).getTime(),
    imageUrl: 'https://picsum.photos/seed/issue1/400/300', // Added image URL
  },
  {
    id: 'issue2',
    title: 'Streetlight Out',
    description: 'The streetlight at Elm St park entrance is not working.',
    type: 'Streetlight',
    location: { latitude: 34.0550, longitude: -118.2450, address: 'Elm St Park' },
    status: 'In Progress',
    reportedById: 'citizen123',
    reportedAt: new Date(2024, 5, 15).getTime(),
    assignedTo: 'Dept. of Public Works',
    imageUrl: 'https://picsum.photos/seed/issue2/400/300', // Added image URL
  },
  {
    id: 'issue3',
    title: 'Overflowing Bin',
    description: 'Public garbage bin at the bus stop on Oak Ave is overflowing.',
    type: 'Garbage',
    location: { latitude: 34.0500, longitude: -118.2400, address: 'Oak Ave Bus Stop' },
    status: 'Resolved',
    reportedById: 'citizen123',
    reportedAt: new Date(2024, 5, 1).getTime(),
    resolvedAt: new Date(2024, 5, 3).getTime(),
    imageUrl: 'https://picsum.photos/seed/issue3/400/300', // Added image URL
  },
  {
    id: 'issue4',
    title: 'Broken Park Bench',
    description: 'A bench in Central Park is broken and unsafe.',
    type: 'Park',
    location: { latitude: 34.0600, longitude: -118.2500, address: 'Central Park' },
    status: 'Pending',
    reportedById: 'citizen456', // Different user
    reportedAt: new Date(2024, 5, 18).getTime(),
    imageUrl: 'https://picsum.photos/seed/issue4/400/300', // Added image URL
  },
  {
    id: 'issue5',
    title: 'Illegal Dumping',
    description: 'Someone dumped trash behind the old factory on Industrial Rd.',
    type: 'Other',
    location: { latitude: 34.0400, longitude: -118.2300, address: 'Industrial Rd' },
    status: 'In Progress',
    reportedById: 'citizen789', // Different user
    reportedAt: new Date(2024, 5, 19).getTime(),
    assignedTo: 'Sanitation Dept.',
    imageUrl: 'https://picsum.photos/seed/issue5/400/300', // Added image URL
  },
  {
    id: 'issue6',
    title: 'Damaged Road Sign',
    description: 'Stop sign at Corner St & Avenue B is bent.',
    type: 'Road',
    location: { latitude: 34.0700, longitude: -118.2600, address: 'Corner St & Avenue B' },
    status: 'Pending',
    reportedById: 'citizen123',
    reportedAt: new Date(2024, 5, 20).getTime(),
    imageUrl: 'https://picsum.photos/seed/issue6/400/300', // Added image URL
  },
];

// Function to add a new issue to the mock database
export const addIssueToDb = (issue: Issue): void => {
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
    }
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
