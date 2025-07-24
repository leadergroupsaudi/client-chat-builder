import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const UserManagementPage = () => {
  const { authFetch, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError } = useQuery<User[]>({ 
    queryKey: ['users', companyId], 
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/users/`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updateData }: { userId: number; updateData: Partial<User> }) => {
      if (!companyId) throw new Error("Company ID not available");
      const response = await authFetch(`/api/v1/users/${userId}/set-admin?is_admin=${updateData.is_admin}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
    },
    onError: (error) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const handleToggleAdmin = (userId: number, currentStatus: boolean) => {
    updateUserMutation.mutate({ userId, updateData: { is_admin: !currentStatus } });
  };

  const handleToggleActive = (userId: number, currentStatus: boolean) => {
    const endpoint = currentStatus ? `deactivate` : `activate`;
    updateUserMutation.mutate({ userId, updateData: { is_active: !currentStatus } });
  };

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Error loading users.</div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">User Management</CardTitle>
        <CardDescription>Manage user roles and access within your company.</CardDescription>
      </CardHeader>
      <CardContent>
        {users && users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.first_name || 'N/A'}</TableCell>
                  <TableCell>{user.last_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_admin}
                      onCheckedChange={() => handleToggleAdmin(user.id, user.is_admin)}
                      disabled={updateUserMutation.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => handleToggleActive(user.id, user.is_active)}
                      disabled={updateUserMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Future actions like password reset, delete user */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500">No users found for your company.</p>
        )}
      </CardContent>
    </Card>
  );
};
