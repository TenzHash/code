import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Eye,
  Search,
  Filter,
  Download,
  Phone,
  MapPin,
  Loader2,
  Info,
  RefreshCw,
  Trash2,
  Plus,
} from "lucide-react";
import {
  getUsers,
  isSupabaseConfigured,
  deleteUser,
  addUser,
  getColleges,
} from "../lib/supabase";

interface User {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  user_type: string;
  phone_number?: string;
  college?: string;
  status?: string;
  created_at?: string;
  last_active?: string;
}

// Move UserForm outside to prevent re-creation on every render
const UserForm = ({
  formData,
}: {
  formData: Partial<User>;
}) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-3 gap-4">
      <div>
        <Label htmlFor="first_name">First Name</Label>
        <Input
          id="first_name"
          value={formData.first_name || ""}
          readOnly
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
      </div>
      <div>
        <Label htmlFor="middle_name">Middle Name</Label>
        <Input
          id="middle_name"
          value={formData.middle_name || "N/A"}
          readOnly
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
      </div>
      <div>
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          id="last_name"
          value={formData.last_name || ""}
          readOnly
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ""}
          readOnly
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
      </div>
      <div>
        <Label htmlFor="user_type">User Type</Label>
        <Input
          id="user_type"
          value={
            formData.user_type
              ? formData.user_type.charAt(0).toUpperCase() +
                formData.user_type.slice(1)
              : ""
          }
          readOnly
          disabled
          className="bg-gray-50 cursor-not-allowed capitalize"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="college">College</Label>
        <Input
          id="college"
          value={formData.college || "N/A"}
          readOnly
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone_number"
          value={formData.phone_number || "N/A"}
          readOnly
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
      </div>
    </div>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="text-xs text-blue-800">
        <strong>ℹ️ View Only Mode:</strong> This modal displays
        user information from the Supabase "Users" table. All
        fields are read-only and cannot be edited from this
        interface.
      </p>
    </div>
  </div>
);

export default function UserManagementSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log(
        '🔄 Fetching users from Supabase "Users" table...',
      );
      const [usersData, collegesData] = await Promise.all([
        getUsers(),
        getColleges()
      ]);
      
      console.log(
        `✅ Successfully loaded ${usersData.length} users from database`,
      );
      console.log(
        `✅ Successfully loaded ${collegesData.length} colleges from database`,
      );
      
      if (usersData.length > 0) {
        console.log("👥 Sample user data:", usersData[0]);
      }
      if (collegesData.length > 0) {
        console.log("🏫 Sample college data:", collegesData[0]);
      }
      
      setUsers(usersData);
      setColleges(collegesData);
    } catch (error) {
      console.error("❌ Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName =
      `${user.first_name || ""} ${user.middle_name || ""} ${user.last_name || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.college
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesRole =
      filterRole === "all" ||
      (user.user_type &&
        user.user_type.toLowerCase() === filterRole);

    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Removed add/edit functionality - modal is view-only

  const handleAddUser = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name) {
      alert("Please fill in all required fields");
      return;
    }

    // Check if email already exists
    const emailExists = users.some(user => 
      user.email.toLowerCase() === (formData.email || '').toLowerCase()
    );

    if (emailExists) {
      alert("❌ Email already registered! This email is already associated with an existing account.");
      return;
    }

    // Check if user with same name already exists (first name + last name only)
    const nameExists = users.some(user => 
      user.first_name.toLowerCase() === (formData.first_name || '').toLowerCase() &&
      user.last_name.toLowerCase() === (formData.last_name || '').toLowerCase()
    );

    if (nameExists) {
      alert("❌ User already exists! A user with this first name and last name is already registered in the system.");
      return;
    }

    setIsAdding(true);
    try {
      console.log("➕ Adding new user:", formData);
      console.log("🔍 Validation passed - email and name are unique");
      
      const newUser = await addUser({
        email: formData.email,
        first_name: formData.first_name,
        middle_name: formData.middle_name || '',
        last_name: formData.last_name,
        user_type: formData.user_type || 'Student',
        phone_number: formData.phone_number || '',
        college: formData.college || ''
      });

      if (newUser) {
        console.log("✅ User added successfully:", newUser);
        setUsers([...users, newUser]);
        setIsAddUserOpen(false);
        setFormData({});
        console.log("✅ User list updated with new user");
        alert("✅ User added successfully!");
      } else {
        console.log("❌ Failed to add user");
        alert("❌ Failed to add user. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error adding user:", error);
      alert("❌ Error adding user. Please check the console for details.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log('🗑️ Attempting to delete user from database:', {
        id: userToDelete.id,
        name: `${userToDelete.first_name} ${userToDelete.last_name}`,
        email: userToDelete.email
      });
      
      // Debug: Log the complete user object being passed
      console.log('🔍 Complete user object being passed to deleteUser:', userToDelete);
      console.log('🔍 User object keys:', Object.keys(userToDelete));
      console.log('🔍 User object values:', Object.values(userToDelete));
      
      const success = await deleteUser(userToDelete);
      
      if (success) {
        console.log('✅ User deleted successfully from Supabase database');
        // Close the dialog first
        setIsDeleteDialogOpen(false);
        // Refresh the users list to reflect the deletion
        await loadUsers();
        // Clear the selected user
        setUserToDelete(null);
        // Show success message
        console.log('✅ User list refreshed - deletion complete');
      } else {
        console.error('❌ Failed to delete user from database');
        alert('Failed to delete user. Please check the console for details.');
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      alert('An error occurred while deleting the user. Error: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportUsers = () => {
    const csv = [
      [
        "First Name",
        "Middle Name",
        "Last Name",
        "Email",
        "User Type",
        "College",
        "Status",
      ],
      ...filteredUsers.map((user) => [
        user.first_name,
        user.middle_name || "",
        user.last_name,
        user.email,
        user.user_type,
        user.college || "",
        user.status || "Active",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  const dbConnected = isSupabaseConfigured();
  
  // Debug: Log database connection status
  console.log('🔍 Database connection status:', dbConnected);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">
            User Management
          </h2>
          <p className="text-muted-foreground">
            {dbConnected ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                Connected to Supabase • {users.length} users
                loaded from database
              </span>
            ) : (
              "Database not connected"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {dbConnected && (
            <Button
              variant="outline"
              onClick={loadUsers}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          )}
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Database Info Alert */}
      {dbConnected && users.length > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <strong>✅ Live Database Connected:</strong>{" "}
            Displaying {users.length} users from your Supabase
            "Users" table in view-only mode. Your table stores
            First Name, Middle Name, Last Name, Email, User
            Type, College, and Phone. Click "View" to see
            detailed user information.
          </AlertDescription>
        </Alert>
      )}

      {dbConnected && users.length === 0 && !loading && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-800">
            <strong>Database Connected but Empty:</strong> Your
            "Users" table exists but contains no data. Add users
            directly through your Supabase dashboard or via your
            application's registration system.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                <span className="text-sm font-semibold">
                  {users.length}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  Total Users
                </p>
                <p className="text-xs text-muted-foreground">
                  All registered users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                <span className="text-sm font-semibold">
                  {
                    users.filter((u) => u.status !== "Inactive")
                      .length
                  }
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  Active Users
                </p>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                <span className="text-sm font-semibold">
                  {
                    users.filter(
                      (u) => u.user_type?.toLowerCase() === "student",
                    ).length
                  }
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Students</p>
                <p className="text-xs text-muted-foreground">
                  Student accounts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                <span className="text-sm font-semibold">
                  {
                    users.filter(
                      (u) => u.user_type?.toLowerCase() === "faculty",
                    ).length
                  }
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Faculty</p>
                <p className="text-xs text-muted-foreground">
                  Faculty members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white">
                <span className="text-sm font-semibold">
                  {
                    users.filter(
                      (u) => u.user_type?.toLowerCase() === "staff",
                    ).length
                  }
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Staff</p>
                <p className="text-xs text-muted-foreground">
                  Staff members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
                <span className="text-sm font-semibold">
                  {
                    users.filter(
                      (u) => u.user_type?.toLowerCase() === "admin",
                    ).length
                  }
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">
                  Administrators
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or college..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filterRole}
                onValueChange={setFilterRole}
              >
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All User Types
                  </SelectItem>
                  <SelectItem value="student">
                    Student
                  </SelectItem>
                  <SelectItem value="faculty">
                    Faculty
                  </SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="visitor">
                    Visitor
                  </SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                console.log('➕ Add User button clicked from table header');
                setIsAddUserOpen(true);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add User
            </Button>
            {dbConnected && users.length > 0 && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Live from Database
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No users found</p>
              {!dbConnected && (
                <p className="text-sm mt-2">
                  Connect your Supabase database to manage users
                </p>
              )}
              {dbConnected && searchTerm && (
                <p className="text-sm mt-2">
                  Try adjusting your search filters
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>User Type & College</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {user.first_name}{" "}
                          {user.middle_name
                            ? user.middle_name + " "
                            : ""}
                          {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.phone_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.phone_number && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {user.phone_number}
                          </div>
                        )}
                        {!user.phone_number && (
                          <p className="text-xs text-muted-foreground">
                            No contact info
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge
                          variant="outline"
                          className="mb-1 capitalize"
                        >
                          {user.user_type}
                        </Badge>
                        {user.college && (
                          <p className="text-sm text-muted-foreground">
                            {user.college}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {dbConnected && (
                          <>
                            <Dialog
                              open={
                                isEditDialogOpen &&
                                selectedUser?.id === user.id
                              }
                              onOpenChange={setIsEditDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setFormData(user);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    View User Details
                                  </DialogTitle>
                                  <DialogDescription>
                                    User information from the
                                    Supabase "Users" table
                                    (Read-Only)
                                  </DialogDescription>
                                </DialogHeader>
                                <UserForm formData={formData} />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={() =>
                                      setIsEditDialogOpen(false)
                                    }
                                  >
                                    Close
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <AlertDialog
                              open={isDeleteDialogOpen && userToDelete?.id === user.id}
                              onOpenChange={(open) => {
                                setIsDeleteDialogOpen(open);
                                if (!open) {
                                  setUserToDelete(null);
                                }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete User from Database?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <div className="space-y-2">
                                      <div>
                                        This will permanently delete{" "}
                                        <strong className="text-foreground">
                                          {user.first_name} {user.middle_name ? user.middle_name + " " : ""}{user.last_name}
                                        </strong>{" "}
                                        <span className="text-muted-foreground">({user.email})</span> from your Supabase database.
                                      </div>
                                      <div className="text-red-600 font-medium">
                                        ⚠️ This action cannot be undone and will permanently remove all user data.
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel 
                                    onClick={() => {
                                      setUserToDelete(null);
                                      setIsDeleteDialogOpen(false);
                                    }}
                                    disabled={isDeleting}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteUser();
                                    }}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                  >
                                    {isDeleting ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting from Database...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Yes, Delete User
                                      </>
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account in the database
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                  className={formData.first_name && formData.last_name && users.some(user => 
                    user.first_name.toLowerCase() === (formData.first_name || '').toLowerCase() &&
                    user.last_name.toLowerCase() === (formData.last_name || '').toLowerCase()
                  ) ? "border-red-500 focus:border-red-500" : ""}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                  className={formData.first_name && formData.last_name && users.some(user => 
                    user.first_name.toLowerCase() === (formData.first_name || '').toLowerCase() &&
                    user.last_name.toLowerCase() === (formData.last_name || '').toLowerCase()
                  ) ? "border-red-500 focus:border-red-500" : ""}
                />
              </div>
            </div>
            
            {/* Duplicate name warning */}
            {formData.first_name && formData.last_name && users.some(user => 
              user.first_name.toLowerCase() === (formData.first_name || '').toLowerCase() &&
              user.last_name.toLowerCase() === (formData.last_name || '').toLowerCase()
            ) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-yellow-800 text-xs">⚠️ A user with this first name and last name already exists in the system</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name || ''}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                placeholder="Enter middle name (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className={formData.email && users.some(user => 
                  user.email.toLowerCase() === (formData.email || '').toLowerCase()
                ) ? "border-red-500 focus:border-red-500" : ""}
              />
              {formData.email && users.some(user => 
                user.email.toLowerCase() === (formData.email || '').toLowerCase()
              ) && (
                <p className="text-red-500 text-xs mt-1">❌ This email is already registered</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user_type">User Type</Label>
                <Select
                  value={formData.user_type || 'Student'}
                  onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number || ''}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, phone_number: value });
                  }}
                  placeholder="Enter phone number (numbers only)"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="college">College</Label>
              <Select
                value={formData.college || ''}
                onValueChange={(value) => setFormData({ ...formData, college: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((college) => (
                    <SelectItem key={college.id || college.college_id} value={college.college_name || college.name}>
                      {college.college_name || college.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddUserOpen(false);
                setFormData({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Adding User...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add User
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}