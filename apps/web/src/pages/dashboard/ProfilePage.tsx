import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ProfilePage() {
    const { user, token } = useAuth();
    const setAuth = useAuthStore((s) => s.setAuth);

    // Profile state
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState("");
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setName(data.name || "");
                    setPhone(data.phoneNumber || "");
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setProfileLoading(false);
            }
        };
        if (token) fetchProfile();
    }, [token]);

    // Save profile
    const handleSaveProfile = async () => {
        setProfileSaving(true);
        setProfileMsg(null);
        try {
            const res = await fetch(`${API_BASE}/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, phoneNumber: phone }),
            });
            const data = await res.json();
            if (res.ok) {
                // Update local auth store with new name
                if (user) {
                    setAuth({ ...user, name: data.name }, token!);
                }
                setProfileMsg({ type: "success", text: "Profile updated successfully." });
            } else {
                setProfileMsg({ type: "error", text: data.error || "Failed to update profile." });
            }
        } catch {
            setProfileMsg({ type: "error", text: "Network error. Please try again." });
        } finally {
            setProfileSaving(false);
        }
    };

    // Change password
    const handleChangePassword = async () => {
        setPasswordMsg(null);
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: "error", text: "New passwords do not match." });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordMsg({ type: "error", text: "Password must be at least 8 characters." });
            return;
        }

        setPasswordSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/profile/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordMsg({ type: "success", text: "Password changed successfully." });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setPasswordMsg({ type: "error", text: data.error || "Failed to change password." });
            }
        } catch {
            setPasswordMsg({ type: "error", text: "Network error. Please try again." });
        } finally {
            setPasswordSaving(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
                <p className="text-muted-foreground">Manage your account information and security.</p>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your name and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={user?.email || ""}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Email cannot be changed for security reasons.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        {profileMsg && (
                            <div
                                className={`flex items-center gap-2 rounded-md p-3 text-sm ${profileMsg.type === "success"
                                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                    }`}
                            >
                                {profileMsg.type === "success" ? (
                                    <Check className="h-4 w-4 shrink-0" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                )}
                                {profileMsg.text}
                            </div>
                        )}

                        <Button onClick={handleSaveProfile} disabled={profileSaving}>
                            {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                {/* Security / Password */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Change your password. You'll need your current password to set a new one.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="current-password"
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                >
                                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min 8 chars, uppercase, number, symbol"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                                    onClick={() => setShowNew(!showNew)}
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-destructive">Passwords do not match.</p>
                            )}
                        </div>

                        {passwordMsg && (
                            <div
                                className={`flex items-center gap-2 rounded-md p-3 text-sm ${passwordMsg.type === "success"
                                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                    }`}
                            >
                                {passwordMsg.type === "success" ? (
                                    <Check className="h-4 w-4 shrink-0" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                )}
                                {passwordMsg.text}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleChangePassword}
                            disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                        >
                            {passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
