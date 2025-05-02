
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, KeyRound, User, Mail, ShieldCheck, Briefcase, BarChart3, CheckCircle, Camera, Phone, MapPin, ListChecks, Settings, Activity, Info, LoaderCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import React, { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns'; // Import date-fns function

// Mock admin user data
const mockAdminUser = {
    id: 'admin456',
    email: "admin@example.com",
    displayName: "Admin User",
    role: "Administrator",
    photoURL: `https://picsum.photos/seed/admin456/100/100`,
    createdAt: new Date(2023, 8, 1),
    phone: "+1 123 456 7890",
    location: "City Hall, Metropolis",
    bio: "Dedicated administrator ensuring smooth operation of the FixIt Local platform.",
    issuesManaged: 152,
    issuesResolvedThisMonth: 35,
};

// Mock Admin Activity Data
const mockAdminActivities = [
  {
    id: 'admin_act1',
    type: 'status_change',
    issueId: 'issue2',
    issueTitle: 'Streetlight Out',
    oldStatus: 'Pending',
    newStatus: 'In Progress',
    timestamp: new Date(2024, 6, 14, 9, 0),
  },
  {
    id: 'admin_act2',
    type: 'priority_change',
    issueId: 'issue1',
    issueTitle: 'Large Pothole on Main St',
    newPriority: 'High',
    timestamp: new Date(2024, 6, 13, 11, 30),
  },
   {
    id: 'admin_act3',
    type: 'assignment',
    issueId: 'issue5',
    issueTitle: 'Illegal Dumping',
    assignedTo: 'Sanitation Dept.',
    timestamp: new Date(2024, 6, 12, 16, 45),
  },
   {
    id: 'admin_act4',
    type: 'status_change',
    issueId: 'issue3',
    issueTitle: 'Overflowing Bin',
    oldStatus: 'In Progress',
    newStatus: 'Resolved',
    timestamp: new Date(2024, 6, 11, 10, 0),
  },
].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first


const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() ?? "?";
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
};

const AdminActivityIcon = ({ type, status }: { type: string; status?: string }) => {
  const className = "h-5 w-5 mt-1";
  switch (type) {
    case 'status_change':
        if (status === 'Resolved') return <CheckCircle className={`${className} text-accent`} />;
        if (status === 'In Progress') return <LoaderCircle className={`${className} text-primary animate-spin`} />;
        return <Edit className={`${className} text-blue-500`} />; // Generic status change
    case 'priority_change':
      return <ShieldCheck className={`${className} text-orange-500`} />;
    case 'assignment':
      return <User className={`${className} text-purple-500`} />;
    default:
      return <Activity className={`${className} text-muted-foreground`} />;
  }
};


export default function AdminProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(mockAdminUser.displayName);
    const [email, setEmail] = useState(mockAdminUser.email);
    const [phone, setPhone] = useState(mockAdminUser.phone);
    const [location, setLocation] = useState(mockAdminUser.location);
    const [bio, setBio] = useState(mockAdminUser.bio);
    const { toast } = useToast();

    const handleEditToggle = () => {
        if (isEditing) {
            console.log("Saving admin profile:", { displayName, phone, location, bio });
            mockAdminUser.displayName = displayName;
            mockAdminUser.phone = phone;
            mockAdminUser.location = location;
            mockAdminUser.bio = bio;
            toast({ title: "Profile Updated", description: "Admin profile changes have been saved." });
        }
        setIsEditing(!isEditing);
    };

    const handleChangePassword = () => {
        toast({ title: "Change Password", description: "Password change feature coming soon." });
    };

    const StatItem = ({ value, label }: { value: number | string; label: string }) => (
        <div className="text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Basic Info & Stats */}
                <Card className="lg:col-span-1 shadow-lg h-fit">
                    <CardHeader className="items-center text-center">
                        <div className="relative group mb-4">
                            <Avatar className="h-24 w-24 border-2 border-primary ring-4 ring-primary/20">
                                <AvatarImage src={mockAdminUser.photoURL || undefined} alt={displayName || "Admin avatar"} data-ai-hint="person face portrait administrator" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">{getInitials(displayName)}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 group-hover:opacity-100 opacity-0 transition-opacity bg-background/80 hover:bg-muted" disabled>
                                <Camera className="h-4 w-4" />
                                <span className="sr-only">Change photo (disabled)</span>
                            </Button>
                        </div>
                        <CardTitle className="text-2xl">{displayName || "Admin User"}</CardTitle>
                        <CardDescription className="text-muted-foreground">{mockAdminUser.email}</CardDescription>
                         <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                                 <ShieldCheck className="h-3 w-3"/> {mockAdminUser.role}
                            </Badge>
                         </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Member since {mockAdminUser.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </p>
                    </CardHeader>
                    <CardContent className="border-t pt-4">
                        <div className="flex justify-around">
                            <StatItem value={mockAdminUser.issuesManaged} label="Issues Managed" />
                            <StatItem value={mockAdminUser.issuesResolvedThisMonth} label="Resolved (Month)" />
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="personal-info">
                        <TabsList className="grid w-full grid-cols-3 mb-6 shadow-inner bg-muted">
                            <TabsTrigger value="personal-info"><User className="mr-1.5 h-4 w-4" />Personal Info</TabsTrigger>
                            {/* Removed disabled prop */}
                            <TabsTrigger value="activity"><Activity className="mr-1.5 h-4 w-4"/>Activity</TabsTrigger>
                            <TabsTrigger value="settings"><Settings className="mr-1.5 h-4 w-4"/>Settings</TabsTrigger>
                        </TabsList>

                        {/* Personal Info Tab */}
                        <TabsContent value="personal-info">
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your personal information and contact details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="displayName">Full Name</Label>
                                        <Input
                                            id="displayName"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            disabled={!isEditing}
                                            className="disabled:opacity-70 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" value={email} disabled className="opacity-70 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={!isEditing}
                                            className="disabled:opacity-70 disabled:cursor-not-allowed"
                                            placeholder="e.g., +1 123 456 7890"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            disabled={!isEditing}
                                            className="disabled:opacity-70 disabled:cursor-not-allowed"
                                            placeholder="e.g., City, Country"
                                        />
                                    </div>
                                     <div className="space-y-1">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Textarea
                                            id="bio"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            disabled={!isEditing}
                                            className="disabled:opacity-70 disabled:cursor-not-allowed min-h-[100px]"
                                            placeholder="Tell us a little about your role..."
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-6 flex justify-end">
                                    <Button onClick={handleEditToggle}>
                                        {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* Activity Tab - Now with content */}
                         <TabsContent value="activity">
                           <Card className="shadow-lg">
                               <CardHeader>
                                   <CardTitle>Admin Activity Log</CardTitle>
                                   <CardDescription>Recent actions performed on issues.</CardDescription>
                               </CardHeader>
                               <CardContent>
                                  {mockAdminActivities.length > 0 ? (
                                       <div className="space-y-4">
                                           {mockAdminActivities.map((activity, index) => (
                                               <React.Fragment key={activity.id}>
                                                   <div className="flex items-start gap-3">
                                                        <AdminActivityIcon type={activity.type} status={activity.newStatus} />
                                                       <div className="flex-1">
                                                           <p className="text-sm leading-snug">
                                                               {activity.type === 'status_change' && <>You changed status of <span className="font-medium">"{activity.issueTitle}"</span> from <Badge variant="outline" className="text-xs">{activity.oldStatus}</Badge> to <Badge variant="outline" className="text-xs">{activity.newStatus}</Badge></>}
                                                               {activity.type === 'priority_change' && <>You set priority of <span className="font-medium">"{activity.issueTitle}"</span> to <Badge variant="outline" className="text-xs">{activity.newPriority}</Badge></>}
                                                               {activity.type === 'assignment' && <>You assigned <span className="font-medium">"{activity.issueTitle}"</span> to <span className="font-medium">{activity.assignedTo}</span></>}
                                                           </p>
                                                           <p className="text-xs text-muted-foreground mt-0.5">
                                                               {formatDistanceToNowStrict(activity.timestamp, { addSuffix: true })}
                                                           </p>
                                                       </div>
                                                   </div>
                                                   {index < mockAdminActivities.length - 1 && <Separator />}
                                               </React.Fragment>
                                           ))}
                                       </div>
                                   ) : (
                                       <p className="text-muted-foreground text-center py-8">No recent admin activity found.</p>
                                   )}
                               </CardContent>
                           </Card>
                        </TabsContent>

                        {/* Settings Tab */}
                        <TabsContent value="settings">
                           <Card className="shadow-lg">
                               <CardHeader>
                                   <CardTitle>Account Settings</CardTitle>
                                   <CardDescription>Manage your account security and preferences.</CardDescription>
                               </CardHeader>
                               <CardContent className="space-y-6">
                                   <div className="space-y-3">
                                        <h3 className="text-base font-semibold">Security</h3>
                                        <Button variant="outline" onClick={handleChangePassword} className="w-full sm:w-auto">
                                           <KeyRound className="mr-2 h-4 w-4" /> Change Password
                                        </Button>
                                   </div>
                                    <Separator />
                                    <div className="space-y-3">
                                         <h3 className="text-base font-semibold">Preferences</h3>
                                         <p className="text-sm text-muted-foreground">Notification settings and other preferences will be available here.</p>
                                    </div>
                               </CardContent>
                           </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
