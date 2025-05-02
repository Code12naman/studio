
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, KeyRound, User, Mail, ShieldCheck, Briefcase, BarChart3, CheckCircle, Camera, Phone, MapPin, ListChecks, Settings, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Badge } from "@/components/ui/badge"; // Import Badge
import React, { useState } from 'react';

// Mock admin user data (replace with actual data fetching)
const mockAdminUser = {
    id: 'admin456',
    email: "admin@example.com",
    displayName: "Admin User",
    role: "Administrator",
    photoURL: `https://picsum.photos/seed/admin456/100/100`, // Example placeholder
    createdAt: new Date(2023, 8, 1), // Example registration date as Date object
    phone: "+1 123 456 7890", // Add phone
    location: "City Hall, Metropolis", // Add location
    bio: "Dedicated administrator ensuring smooth operation of the FixIt Local platform.", // Add bio
    // Mock stats for admin
    issuesManaged: 152,
    issuesResolvedThisMonth: 35,
};

const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() ?? "?";
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
};

export default function AdminProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(mockAdminUser.displayName);
    const [email, setEmail] = useState(mockAdminUser.email); // Email is typically read-only
    const [phone, setPhone] = useState(mockAdminUser.phone);
    const [location, setLocation] = useState(mockAdminUser.location);
    const [bio, setBio] = useState(mockAdminUser.bio);
    const { toast } = useToast();

    const handleEditToggle = () => {
        if (isEditing) {
            // Save logic (mock) - In a real app, update this via API call
            console.log("Saving admin profile:", { displayName, phone, location, bio });
            // Update mockUser details locally for demo purposes
            mockAdminUser.displayName = displayName;
            mockAdminUser.phone = phone;
            mockAdminUser.location = location;
            mockAdminUser.bio = bio;
            toast({ title: "Profile Updated", description: "Admin profile changes have been saved." });
        }
        setIsEditing(!isEditing);
    };

    const handleChangePassword = () => {
        // Placeholder for password change functionality
        toast({ title: "Change Password", description: "Password change feature coming soon." });
    };

    // Stat display component
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
                     {/* Removed footer, save button is in the tabs now */}
                </Card>

                {/* Right Column: Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="personal-info">
                        <TabsList className="grid w-full grid-cols-3 mb-6 shadow-inner bg-muted">
                            <TabsTrigger value="personal-info"><User className="mr-1.5 h-4 w-4" />Personal Info</TabsTrigger>
                            <TabsTrigger value="activity" disabled><Activity className="mr-1.5 h-4 w-4"/>Activity</TabsTrigger>
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

                        {/* Activity Tab */}
                         <TabsContent value="activity">
                           <Card className="shadow-lg">
                               <CardHeader>
                                   <CardTitle>Activity Log</CardTitle>
                                   <CardDescription>Recent actions and changes you've made.</CardDescription>
                               </CardHeader>
                               <CardContent>
                                   <p className="text-muted-foreground text-center py-8">Admin activity log feature coming soon.</p>
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
                                        {/* Add other security options like 2FA later */}
                                   </div>
                                    <Separator />
                                    <div className="space-y-3">
                                         <h3 className="text-base font-semibold">Preferences</h3>
                                         <p className="text-sm text-muted-foreground">Notification settings and other preferences will be available here.</p>
                                         {/* Placeholder for future settings */}
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
