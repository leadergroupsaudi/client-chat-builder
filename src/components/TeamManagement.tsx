import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  Plus,
  Badge,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Team, User, Role, Permission } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";

export const TeamManagement = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded company ID
  const { authFetch } = useAuth();
  

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [isRoleModalOpen, setRoleModalOpen] = useState(false);
  
  const [selectedTeamForMember, setSelectedTeamForMember] = useState<Team | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form State
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMemberRole, setSelectedMemberRole] = useState("member");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);

  // --- DATA FETCHING ---
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const usersData = await response.json();
      console.log("Users data fetched:", usersData);
      return usersData;
    },
  });

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['teams', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/teams/`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['roles', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/roles/`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/permissions/`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
  });

  // --- MUTATIONS ---
  const createUserMutation = useMutation({
    mutationFn: (newUser: any) => authFetch(`/api/v1/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).then(res => { if (!res.ok) throw new Error('Failed to create user'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', companyId] });
      toast({ title: 'Success', description: 'User created successfully.' });
      setAddUserModalOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const createTeamMutation = useMutation({
    mutationFn: (newTeam: { name: string }) => authFetch(`/api/v1/teams/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeam),
    }).then(res => { if (!res.ok) throw new Error('Failed to create team'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: 'Success', description: 'Team created successfully.' });
      setCreateTeamModalOpen(false);
      setNewTeamName("");
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: string }) => authFetch(`/api/v1/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    }).then(res => { if (!res.ok) throw new Error('Failed to add member'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: 'Success', description: 'Member added successfully.' });
      setAddMemberModalOpen(false);
      setSelectedUserId("");
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) => authFetch(`/api/v1/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    }).then(res => { if (!res.ok) throw new Error('Failed to remove member'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: 'Success', description: 'Member removed successfully.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const roleMutation = useMutation({
    mutationFn: (roleData: { id?: number, name: string, description?: string, permission_ids: number[] }) => {
      const url = roleData.id
        ? `/api/v1/roles/${roleData.id}`
        : `/api/v1/roles/`;
      const method = roleData.id ? 'PUT' : 'POST';
      return authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ name: roleData.name, description: roleData.description, permission_ids: roleData.permission_ids }),
      }).then(res => { if (!res.ok) throw new Error('Failed to save role'); return res.json() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', companyId] });
      toast({ title: 'Success', description: 'Role saved successfully.' });
      setRoleModalOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => authFetch(`/api/v1/roles/${roleId}`, {
      method: 'DELETE',
    }).then(res => { if (!res.ok) throw new Error('Failed to delete role'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', companyId] });
      toast({ title: 'Success', description: 'Role deleted successfully.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // --- EVENT HANDLERS ---
  const handleCreateUser = () => {
    if (newUserEmail && newUserPassword) createUserMutation.mutate({ email: newUserEmail, password: newUserPassword });
  };

  const handleCreateTeam = () => {
    if (newTeamName) createTeamMutation.mutate({ name: newTeamName });
  };

  const handleAddMember = () => {
    if (selectedTeamForMember && selectedUserId) {
      addMemberMutation.mutate({
        teamId: selectedTeamForMember.id,
        userId: parseInt(selectedUserId),
        role: selectedMemberRole,
      });
    }
  };

  const openAddMemberModal = (team: Team) => {
    setSelectedTeamForMember(team);
    setAddMemberModalOpen(true);
  };

  const openRoleModal = (role: Role | null) => {
    setSelectedRole(role);
    if (role) {
      setRoleName(role.name);
      setRoleDescription(role.description || "");
      setRolePermissions(role.permissions.map(p => p.id));
    } else {
      setRoleName("");
      setRoleDescription("");
      setRolePermissions([]);
    }
    setRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    roleMutation.mutate({
      id: selectedRole?.id,
      name: roleName,
      description: roleDescription,
      permission_ids: rolePermissions,
    });
  };

  const handlePermissionToggle = (permissionId: number) => {
    setRolePermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updateData }: { userId: number; updateData: Partial<User> }) => {
      if (!companyId) throw new Error("Company ID not available");
      const response = await authFetch(`/api/v1/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "User updated successfully!" });
      console.log("User update successful, users query invalidated.");
    },
    onError: (error) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const handleRoleChange = (userId: number, roleId: string) => {
    console.log(`Attempting to change role for user ${userId} to role ${roleId}`);
    updateUserMutation.mutate({ userId, updateData: { role_id: parseInt(roleId, 10) } });
  };

  const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      <Card className="card-shadow-lg bg-white dark:bg-slate-800 overflow-visible">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="flex items-center gap-2 text-2xl dark:text-white">
            <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Team & User Management
          </CardTitle>
          <CardDescription className="dark:text-gray-400 text-base">
            Manage users, teams, and their roles and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-900 p-1">
              <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">👥 Users</TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">🏢 Teams</TabsTrigger>
              <TabsTrigger value="permissions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">🔒 Roles & Permissions</TabsTrigger>
            </TabsList>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-5 pt-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                  <Input
                    placeholder="Search users by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                <Dialog open={isAddUserModalOpen} onOpenChange={setAddUserModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white btn-hover-lift">
                      <UserPlus className="h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="new-user-email" className="text-sm dark:text-gray-300 mb-1.5 block">Email Address</Label>
                        <Input
                          id="new-user-email"
                          placeholder="user@example.com"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-user-password" className="text-sm dark:text-gray-300 mb-1.5 block">Password</Label>
                        <Input
                          id="new-user-password"
                          placeholder="••••••••"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddUserModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        {createUserMutation.isPending ? "Adding..." : "Add User"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Card className="border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900/80">
                          <TableHead className="dark:text-gray-300 font-semibold">User</TableHead>
                          <TableHead className="dark:text-gray-300 font-semibold">Role</TableHead>
                          <TableHead className="dark:text-gray-300 font-semibold">Status</TableHead>
                          <TableHead className="text-right dark:text-gray-300 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingUsers ? (
                          <TableRow className="dark:border-slate-700">
                            <TableCell colSpan={4} className="text-center py-8 dark:text-gray-400">
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                <span>Loading users...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.length === 0 ? (
                          <TableRow className="dark:border-slate-700">
                            <TableCell colSpan={4} className="text-center py-8 dark:text-gray-400">
                              No users found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-600">
                                    <AvatarImage src={user.profile_picture_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                                      {user.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium dark:text-white">{user.first_name} {user.last_name}</div>
                                    <div className="text-sm text-muted-foreground dark:text-gray-400">{user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={user.role_id?.toString()}
                                  onValueChange={(value) => handleRoleChange(user.id, value)}
                                  disabled={updateUserMutation.isPending}
                                >
                                  <SelectTrigger className="w-[180px] dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                    {roles?.map((role) => (
                                      <SelectItem key={role.id} value={role.id.toString()} className="dark:text-white dark:focus:bg-slate-700">
                                        {role.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  user.is_active
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                                }`}>
                                  {user.is_active ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                                      <MoreHorizontal className="h-4 w-4 dark:text-gray-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700">
                                    <DropdownMenuItem className="dark:text-white dark:focus:bg-slate-700">
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="dark:text-white dark:focus:bg-slate-700">
                                      {user.is_active ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-500 dark:text-red-400 dark:focus:bg-slate-700">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TEAMS TAB */}
            <TabsContent value="teams" className="space-y-5 pt-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">Manage Teams</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Create and organize teams within your organization</p>
                </div>
                <Dialog open={isCreateTeamModalOpen} onOpenChange={setCreateTeamModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white btn-hover-lift">
                      <Plus className="h-4 w-4" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Create New Team</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="new-team-name" className="text-sm dark:text-gray-300 mb-1.5 block">Team Name</Label>
                      <Input
                        id="new-team-name"
                        placeholder="e.g., Engineering, Marketing, Sales"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateTeamModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateTeam}
                        disabled={createTeamMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {isLoadingTeams ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span>Loading teams...</span>
                    </div>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <Users className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                    </div>
                    <p className="text-muted-foreground dark:text-gray-400">No teams created yet. Create your first team to get started.</p>
                  </div>
                ) : (
                  teams.map((team) => (
                    <Card key={team.id} className="flex flex-col card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 hover:shadow-xl transition-shadow">
                      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
                        <CardTitle className="dark:text-white flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          {team.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm dark:text-gray-300 uppercase tracking-wider">Members</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                            {team.members.length}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {team.members.length > 0 ? (
                            team.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.profile_picture_url} />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300">
                                      {member.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="dark:text-white truncate">{member.email}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: member.id })}
                                  className="hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-sm text-gray-500 dark:text-gray-400">No members yet.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardContent className="pt-0 pb-4">
                        <Button
                          variant="outline"
                          className="w-full dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          onClick={() => openAddMemberModal(team)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Member
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* PERMISSIONS TAB */}
            <TabsContent value="permissions" className="space-y-5 pt-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">Manage Roles</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Define roles and assign permissions to control access</p>
                </div>
                <Button
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white btn-hover-lift"
                  onClick={() => openRoleModal(null)}
                >
                  <Plus className="h-4 w-4" />
                  Create Role
                </Button>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                {isLoadingRoles ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span>Loading roles...</span>
                    </div>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <Shield className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                    </div>
                    <p className="text-muted-foreground dark:text-gray-400">No roles created yet. Create your first role to get started.</p>
                  </div>
                ) : (
                  roles.map((role) => (
                    <Card key={role.id} className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900/50">
                      <CardHeader className="flex flex-row items-start justify-between border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center flex-shrink-0">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base dark:text-white">{role.name}</CardTitle>
                            <CardDescription className="dark:text-gray-400 mt-1">
                              {role.description || "No description provided"}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleModal(role)}
                            className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteRoleMutation.mutate(role.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm dark:text-gray-300 uppercase tracking-wider">Permissions</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                            {role.permissions.length}
                          </span>
                        </div>
                        {role.permissions.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {role.permissions.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center text-sm p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                              >
                                <Check className="h-4 w-4 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <span className="dark:text-white truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No permissions assigned to this role.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Add Member to {selectedTeamForMember?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="user-select" className="text-sm dark:text-gray-300 mb-1.5 block">
                Select User
              </Label>
              <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                <SelectTrigger id="user-select" className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder="Choose a user to add" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id.toString()}
                      className="dark:text-white dark:focus:bg-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role-select" className="text-sm dark:text-gray-300 mb-1.5 block">
                Team Role
              </Label>
              <Select onValueChange={setSelectedMemberRole} defaultValue="member">
                <SelectTrigger id="role-select" className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  <SelectItem value="member" className="dark:text-white dark:focus:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Badge className="h-4 w-4" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" className="dark:text-white dark:focus:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddMemberModalOpen(false)}
              className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {addMemberMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {selectedRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <Label htmlFor="role-name" className="text-sm dark:text-gray-300 mb-1.5 block">
                Role Name
              </Label>
              <Input
                id="role-name"
                placeholder="e.g., Administrator, Editor, Viewer"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="role-description" className="text-sm dark:text-gray-300 mb-1.5 block">
                Role Description
              </Label>
              <Input
                id="role-description"
                placeholder="Brief description of this role's purpose"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm dark:text-gray-300 uppercase tracking-wider">
                  Permissions
                </h4>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                  {rolePermissions.length} selected
                </span>
              </div>
              {isLoadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <span>Loading permissions...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                  {permissions.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center space-x-2 p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                        rolePermissions.includes(p.id)
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                      }`}
                      onClick={() => handlePermissionToggle(p.id)}
                    >
                      <Checkbox
                        id={`perm-${p.id}`}
                        checked={rolePermissions.includes(p.id)}
                        onCheckedChange={() => handlePermissionToggle(p.id)}
                        className="dark:border-slate-500"
                      />
                      <label
                        htmlFor={`perm-${p.id}`}
                        className="text-sm font-medium leading-none cursor-pointer dark:text-white flex-1"
                      >
                        {p.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleModalOpen(false)}
              className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={roleMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {roleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;