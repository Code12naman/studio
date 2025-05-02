
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, KeyRound, User, Mail, ListChecks, Star, CheckCircle, MessageSquare, Camera, Phone, MapPin, Settings, Activity, Info, LoaderCircle } from "lucide-react"; // Added Info, LoaderCircle
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import React, { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns'; // Import date-fns function

// Mock user data
const mockUser = {
    id: 'citizen123',
    email: "citizen@example.com",
    displayName: "Demo Citizen",
    photoURL: `https://picsum.photos/seed/citizen123/100/100`,
    createdAt: new Date(2023, 10, 15),
    phone: "+91 98765 43210",
    location: "Bangalore, Karnataka",
    bio: "Passionate about improving my community. I've been reporting local issues in Bangalore for over 2 years.",
    reportsSubmitted: 27,
    reportsResolved: 19,
    commentsMade: 42,
    badges: ["Active Member", "Top Reporter"],
};

// Mock Activity Data
const mockActivities = [
  {
    id: 'act1',
    type: 'report',
    title: 'Large Pothole on Main St',
    status: 'Pending',
    timestamp: new Date(2024, 6, 15, 10, 30),
  },
  {
    id: 'act2',
    type: 'resolve',
    title: 'Overflowing Bin',
    status: 'Resolved',
    timestamp: new Date(2024, 6, 12, 15, 0),
  },
  {
    id: 'act3',
    type: 'comment',
    title: 'Streetlight Out',
    comment: 'Any updates on this? It\'s still dark.',
    timestamp: new Date(2024, 6, 10, 9, 0),
  },
   {
    id: 'act4',
    type: 'report',
    title: 'Broken Park Bench',
    status: 'In Progress',
    timestamp: new Date(2024, 6, 8, 14, 15),
  },
  {
    id: 'act5',
    type: 'update', // Simulate an update from admin side
    title: 'Broken Park Bench',
    update: 'Assigned to parks department. Status changed to In Progress.',
    timestamp: new Date(2024, 6, 9, 11, 0),
  },
].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first

const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() ?? "?";
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
};

const ActivityIcon = ({ type, status }: { type: string; status?: string }) => {
  const className = "h-5 w-5 mt-1";
  switch (type) {
    case 'report':
      return <ListChecks className={`${className} text-primary`} />;
    case 'resolve':
      return <CheckCircle className={`${className} text-accent`} />;
    case 'comment':
      return <MessageSquare className={`${className} text-muted-foreground`} />;
    case 'update':
        if (status === 'In Progress') return <LoaderCircle className={`${className} text-primary animate-spin`} />;
        return <Info className={`${className} text-blue-500`} />; // Generic update icon
    default:
      return <Activity className={`${className} text-muted-foreground`} />;
  }
};

export default function CitizenProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(mockUser.displayName);
    const [email, setEmail] = useState(mockUser.email);
    const [phone, setPhone] = useState(mockUser.phone);
    const [location, setLocation] = useState(mockUser.location);
    const [bio, setBio] = useState(mockUser.bio);
    const { toast } = useToast();

    const handleEditToggle = () => {
        if (isEditing) {
            console.log("Saving profile:", { displayName, phone, location, bio });
            mockUser.displayName = displayName;
            mockUser.phone = phone;
            mockUser.location = location;
            mockUser.bio = bio;
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
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
                                <AvatarImage src={mockUser.photoURL || undefined} alt={displayName || "User avatar"} data-ai-hint="person face portrait" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">{getInitials(displayName)}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 group-hover:opacity-100 opacity-0 transition-opacity bg-background/80 hover:bg-muted" disabled>
                                <Camera className="h-4 w-4" />
                                 <span className="sr-only">Change photo (disabled)</span>
                            </Button>
                        </div>
                        <CardTitle className="text-2xl">{displayName || "User"}</CardTitle>
                        <CardDescription className="text-muted-foreground">{mockUser.email}</CardDescription>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            {mockUser.badges.map(badge => (
                                <Badge key={badge} variant={badge === "Top Reporter" ? "default" : "secondary"} className="flex items-center gap-1">
                                    {badge === "Active Member" && <CheckCircle className="h-3 w-3" />}
                                    {badge === "Top Reporter" && <Star className="h-3 w-3" />}
                                    {badge}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Member since {mockUser.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </p>
                    </CardHeader>
                    <CardContent className="border-t pt-4">
                        <div className="flex justify-around">
                            <StatItem value={mockUser.reportsSubmitted} label="Reports" />
                            <StatItem value={mockUser.reportsResolved} label="Resolved" />
                            <StatItem value={mockUser.commentsMade} label="Comments" />
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="personal-info">
                        <TabsList className="grid w-full grid-cols-3 mb-6 shadow-inner bg-muted">
                            <TabsTrigger value="personal-info"><User className="mr-1.5 h-4 w-4"/>Personal Info</TabsTrigger>
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
                                            placeholder="e.g., +91 98765 43210"
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
                                            placeholder="Tell us a bit about yourself..."
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
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>Your recent reports, comments, and issue updates.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {mockActivities.length > 0 ? (
                                        <div className="space-y-4">
                                            {mockActivities.map((activity, index) => (
                                                <React.Fragment key={activity.id}>
                                                    <div className="flex items-start gap-3">
                                                        <ActivityIcon type={activity.type} status={activity.status} />
                                                        <div className="flex-1">
                                                            <p className="text-sm leading-snug">
                                                                {activity.type === 'report' && <>You reported <span className="font-medium">"{activity.title}"</span></>}
                                                                {activity.type === 'resolve' && <>Your report <span className="font-medium">"{activity.title}"</span> was resolved.</>}
                                                                {activity.type === 'comment' && <>You commented on <span className="font-medium">"{activity.title}"</span>: <em className="text-muted-foreground">"{activity.comment}"</em></>}
                                                                 {activity.type === 'update' && <>Update on <span className="font-medium">"{activity.title}"</span>: <span className="text-muted-foreground">{activity.update}</span></>}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {formatDistanceToNowStrict(activity.timestamp, { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {index < mockActivities.length - 1 && <Separator />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No recent activity found.</p>
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
                                         <p className="text-sm text-muted-foreground">Notification preferences will be available here.</p>
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
