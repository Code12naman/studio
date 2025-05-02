export type IssueStatus = "Pending" | "In Progress" | "Resolved";

export type IssueType = "Road" | "Garbage" | "Streetlight" | "Park" | "Other";

export type IssuePriority = "Low" | "Medium" | "High"; // Added Priority type

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority; // Added priority field
  location: {
    latitude: number;
    longitude: number;
    address?: string; // Optional: Store a reverse-geocoded address
  };
  status: IssueStatus;
  reportedById: string; // User ID of the citizen who reported
  reportedAt: number; // Timestamp (e.g., Date.now())
  dueDate?: number; // Optional: Calculated due date (e.g., reportedAt + 7 days)
  imageUrl?: string; // Optional URL for an image of the issue
  // Optional fields for admin
  assignedTo?: string;
  resolvedAt?: number;
  adminNotes?: string;
}
