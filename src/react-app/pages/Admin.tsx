import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { useNavigate } from "react-router";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/react-app/components/ui/select";
import { Badge } from "@/react-app/components/ui/badge";
import { ArrowLeft, Loader2, UserPlus, Trash2, Key, X, Check, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { Link } from "react-router";

interface UserRecord {
    id: number;
    username: string;
    role: string;
    created_at: string;
}

const getRoleBadge = (role: string) => {
    switch (role) {
        case "admin":
            return <Badge className="bg-purple-600 text-white"><ShieldCheck className="w-3 h-3 mr-1" />Admin</Badge>;
        case "moderator":
            return <Badge className="bg-blue-600 text-white"><Shield className="w-3 h-3 mr-1" />Moderator</Badge>;
        default:
            return <Badge variant="secondary"><UserIcon className="w-3 h-3 mr-1" />User</Badge>;
    }
};

export default function AdminPage() {
    const { user, token, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("user");
    const [resettingPasswordUserId, setResettingPasswordUserId] = useState<number | null>(null);
    const [resetPassword, setResetPassword] = useState("");
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            navigate("/");
            return;
        }
        fetchUsers();
    }, [user, navigate, authLoading]);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/auth/users", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setCreating(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    role: newRole
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create user");
            }

            setNewUsername("");
            setNewPassword("");
            setNewRole("user");
            fetchUsers();
            showSuccess(`User "${newUsername}" created successfully`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteUser = async (id: number, username: string) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
        setError("");

        try {
            const response = await fetch(`/api/auth/users/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete user");
            }

            fetchUsers();
            showSuccess(`User "${username}" deleted`);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleResetPassword = async (id: number) => {
        if (!resetPassword) return;
        setError("");
        setResetting(true);

        try {
            const response = await fetch(`/api/auth/users/${id}/password`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password: resetPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to reset password");
            }

            setResettingPasswordUserId(null);
            setResetPassword("");
            showSuccess("Password updated successfully");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setResetting(false);
        }
    };



    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950 dark:via-background dark:to-blue-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950 dark:via-background dark:to-blue-950">
            <header className="border-b bg-white/80 dark:bg-card/80 backdrop-blur-lg sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="One Nature MAHE Logo"
                                className="w-12 h-12 object-contain"
                            />
                            <div className="text-center md:text-left">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    Admin Panel
                                </h1>
                                <p className="text-sm text-muted-foreground">User Management</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link to="/">
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Home
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={logout}>
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Global Messages */}
                {successMessage && (
                    <div className="mb-6 text-sm text-green-700 bg-green-50 dark:bg-green-950/50 dark:text-green-400 p-3 rounded-md border border-green-200 dark:border-green-800">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-md border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Create User Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5" />
                                Create New User
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-username">Username</Label>
                                    <Input
                                        id="new-username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Enter username"
                                        required
                                        disabled={creating}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter password (min 6 chars)"
                                        required
                                        minLength={6}
                                        disabled={creating}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-role">Role</Label>
                                    <Select value={newRole} onValueChange={setNewRole} disabled={creating}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="moderator">Moderator</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Create User
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Users List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Existing Users</span>
                                <Badge variant="outline">{users.length} total</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {users.map((u) => {
                                        const isSelf = user!.id === u.id;
                                        return (
                                            <div
                                                key={u.id}
                                                className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors ${isSelf ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' : 'bg-card hover:bg-accent/50'}`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-medium truncate">{u.username}</p>
                                                            {isSelf && <Badge variant="outline" className="text-[10px] px-1.5 py-0">You</Badge>}
                                                        </div>
                                                        <div className="mt-1">
                                                            {getRoleBadge(u.role)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                                                            onClick={() => setResettingPasswordUserId(u.id)}
                                                            title="Reset Password"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                                            title={isSelf ? "Cannot delete own account" : "Delete User"}
                                                            disabled={isSelf}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>


                                                {/* Password Reset */}
                                                {resettingPasswordUserId === u.id && (
                                                    <div className="flex items-center gap-2 mt-1 pt-2 border-t">
                                                        <Input
                                                            type="password"
                                                            placeholder="New password (min 6 chars)"
                                                            value={resetPassword}
                                                            onChange={(e) => setResetPassword(e.target.value)}
                                                            className="h-8 text-sm"
                                                            minLength={6}
                                                            autoFocus
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="h-8"
                                                            disabled={resetting || resetPassword.length < 6}
                                                            onClick={() => handleResetPassword(u.id)}
                                                        >
                                                            {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8"
                                                            onClick={() => {
                                                                setResettingPasswordUserId(null);
                                                                setResetPassword("");
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}

                                                <div className="text-[10px] text-muted-foreground">
                                                    Created: {new Date(u.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {users.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">No users found</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
