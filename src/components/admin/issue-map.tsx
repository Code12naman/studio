
"use client";

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Issue, IssuePriority } from '@/types/issue';
import L from 'leaflet';
import { ShieldAlert, MapPin } from 'lucide-react'; // Import icons
import ReactDOMServer from 'react-dom/server'; // For rendering React components to strings
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { useEffect, useState } from 'react'; // Import useEffect and useState

// Function to get marker color based on priority
const getMarkerColor = (priority: IssuePriority): string => {
    switch (priority) {
        case 'High': return '#dc2626'; // Destructive color (red)
        case 'Medium': return '#f97316'; // Orange
        case 'Low': return '#6b7280'; // Muted color (gray)
        default: return '#6b7280';
    }
};

// Custom Icon component to render inside the DivIcon
const CustomIconContent = ({ priority }: { priority: IssuePriority }) => (
    <div className="relative flex items-center justify-center">
        <MapPin className="w-8 h-8 drop-shadow-lg" style={{ color: getMarkerColor(priority) }} />
        <ShieldAlert className="w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-white" />
    </div>
);

// Function to create a custom Leaflet DivIcon
const createCustomIcon = (priority: IssuePriority): L.DivIcon => {
    const iconHtml = ReactDOMServer.renderToString(<CustomIconContent priority={priority} />);
    return L.divIcon({
        html: iconHtml,
        className: '', // No default Leaflet styles needed
        iconSize: [32, 32], // Adjust size as needed
        iconAnchor: [16, 32], // Point of the icon which corresponds to marker's location
        popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
    });
};

interface IssueMapProps {
    issues: Issue[];
}

const IssueMap: React.FC<IssueMapProps> = ({ issues }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true); // Set isClient to true after component mounts
    }, []);

    // Default center and zoom (can be adjusted or made dynamic)
    const defaultCenter: L.LatLngExpression = [34.0522, -118.2437]; // Example: Los Angeles
    const defaultZoom = 11;

    // Filter out issues without valid coordinates
    const validIssues = issues.filter(issue => typeof issue.location.latitude === 'number' && typeof issue.location.longitude === 'number');

    // Calculate center based on filtered issues if available
    const mapCenter = validIssues.length > 0
        ? [validIssues[0].location.latitude, validIssues[0].location.longitude] as L.LatLngExpression
        : defaultCenter;

    return (
         <div style={{ height: '450px', width: '100%' }} className="rounded-lg overflow-hidden">
             {isClient && ( // Only render MapContainer on the client
                 <MapContainer
                     // Do not use a key that changes frequently unless absolutely necessary for full re-render
                     center={mapCenter}
                     zoom={defaultZoom}
                     scrollWheelZoom={true}
                     style={{ height: '100%', width: '100%' }} // Ensure map takes full dimensions of parent
                     className="z-0" // Ensure map is behind UI elements if needed
                 >
                     <TileLayer
                         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                     />
                     {validIssues.map((issue) => (
                         <Marker
                             key={issue.id}
                             position={[issue.location.latitude, issue.location.longitude]}
                             icon={createCustomIcon(issue.priority)}
                         >
                             <Popup minWidth={200}>
                                 <div className="space-y-2">
                                     <h3 className="font-semibold text-base">{issue.title}</h3>
                                     <div className="flex justify-between items-center">
                                         <Badge variant="outline">{issue.type}</Badge>
                                         <Badge variant={issue.priority === 'High' ? 'destructive' : issue.priority === 'Medium' ? 'default' : 'secondary'}>
                                             {issue.priority} Priority
                                         </Badge>
                                     </div>
                                     <p className="text-xs text-muted-foreground">{issue.location.address || 'Address not available'}</p>
                                     <p className="text-xs text-muted-foreground">Reported: {format(new Date(issue.reportedAt), 'MMM d, yyyy')}</p>
                                     {/* Optional: Add a button to view full details */}
                                     {/* Consider how to trigger the detail dialog from here, might need context or prop drilling */}
                                     {/* <Button size="sm" variant="link" className="p-0 h-auto" asChild>
                                        <Link href={`#issue-${issue.id}`}>View Details</Link>
                                     </Button> */}
                                 </div>
                             </Popup>
                         </Marker>
                     ))}
                 </MapContainer>
             )}
         </div>
    );
};

export default IssueMap;
