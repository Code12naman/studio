
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, KeyRound, User, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image"; // Use next/image
import React, { useState } from 'react';

// Mock admin user data (replace with actual data fetching)
const mockAdminUser = {
    email: "admin@example.com",
    displayName: "Admin User",
    role: "Administrator",
    photoURL: `https://picsum.photos/seed/${'admin456'}/100/100`, // Example placeholder
    createdAt: new Date(2023, 8, 1).toLocaleDateString(), // Example registration date
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
    const [email, setEmail] = useState(mockAdminUser.email); // Email might not be editable
    const { toast } = useToast();

    const handleEditToggle = () => {
        if (isEditing) {
            // Save logic (mock)
            console.log("Saving admin profile:", { displayName, email });
            // Update mockUser or refetch after actual save
            mockAdminUser.displayName = displayName;
            mockAdminUser.email = email;
            toast({ title: "Profile Updated", description: "Admin profile changes have been saved." });
        }
        setIsEditing(!isEditing);
    };

    const handleChangePassword = () => {
        // Placeholder for password change functionality
        toast({ title: "Change Password", description: "Password change feature coming soon." });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Admin Profile</h1>
            <Card className="max-w-2xl mx-auto shadow-lg">
                <CardHeader className="items-center text-center">
                    <div className="relative group mb-4">
                         <Avatar className="h-24 w-24 border-2 border-primary ring-4 ring-primary/20">
                             <AvatarImage src={mockAdminUser.photoURL || undefined} alt={displayName || "Admin avatar"} data-ai-hint="person face portrait administrator" />
                             <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">{getInitials(displayName)}</AvatarFallback>
                         </Avatar>
                         {/* Add photo upload later */}
                         {/* <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 group-hover:opacity-100 opacity-0 transition-opacity">
                            <Edit className="h-4 w-4" />
                         </Button> */}
                    </div>
                    <CardTitle className="text-2xl">{displayName || "Admin User"}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-muted-foreground">
                         <ShieldCheck className="h-4 w-4 text-primary"/> {mockAdminUser.role} - Joined on {mockAdminUser.createdAt}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Separator />
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <Label htmlFor="displayName" className="text-xs text-muted-foreground">Display Name</Label>
                                {isEditing ? (
                                    <Input
                                        id="displayName"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="text-base"
                                    />
                                ) : (
                                    <p className="text-base font-medium">{displayName}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <Mail className="h-5 w-5 text-muted-foreground" />
                             <div className="flex-1">
                                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                                {/* Typically email is not directly editable */}
                                <p className="text-base font-medium text-muted-foreground">{email}</p>
                                {/* {isEditing ? (
                                    <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-base" />
                                ) : (
                                    <p className="text-base font-medium">{email}</p>
                                )} */}
                             </div>
                        </div>
                         <div className="flex items-center gap-3">
                             <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                             <div className="flex-1">
                                <Label htmlFor="role" className="text-xs text-muted-foreground">Role</Label>
                                <p className="text-base font-medium text-muted-foreground">{mockAdminUser.role}</p>
                             </div>
                        </div>
                    </div>
                     <Separator />
                      <div className="space-y-3">
                         <h3 className="text-lg font-semibold">Account Security</h3>
                         <Button variant="outline" onClick={handleChangePassword} className="w-full sm:w-auto">
                            <KeyRound className="mr-2 h-4 w-4" /> Change Password
                         </Button>
                         {/* Add other security options like 2FA later */}
                      </div>

                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-end">
                     <Button onClick={handleEditToggle}>
                        {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                     </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
