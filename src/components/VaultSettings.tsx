import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Credential } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Trash2, Edit, PlusCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const VaultSettings = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<Credential | null>(null);
  const [formData, setFormData] = useState({
    platform: "",
    api_key: "",
  });

    const companyId = 1; // Hardcoded company ID for now

  const { data: credentials, isLoading, isError } = useQuery<Credential[]>({ queryKey: ['credentials', companyId], queryFn: async () => {
    console.log(`Fetching credentials for companyId: ${companyId}`);
    const response = await fetch(`http://localhost:8000/api/v1/credentials/`, {
      headers: {
        "X-Company-ID": companyId.toString(),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch credentials");
    }
    return response.json();
  }});

  const createCredentialMutation = useMutation({
    mutationFn: async (newCredential: { platform: string; api_key: string }) => {
      const response = await fetch(`http://localhost:8000/api/v1/credentials/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyId.toString(),
        },
        body: JSON.stringify(newCredential),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast({
        title: "Credential created successfully!",
        description: "Your API key has been securely stored.",
      });
      setFormData({ platform: "", api_key: "" });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create credential",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const updateCredentialMutation = useMutation({
    mutationFn: async (updatedCredential: Credential) => {
      const response = await fetch(`http://localhost:8000/api/v1/credentials/${updatedCredential.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyId.toString(),
        },
        body: JSON.stringify(updatedCredential),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast({
        title: "Credential updated successfully!",
        description: "Your API key has been updated.",
      });
      setIsEditDialogOpen(false);
      setCurrentCredential(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update credential",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      const response = await fetch(`http://localhost:8000/api/v1/credentials/${credentialId}`, {
        method: "DELETE",
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast({
        title: "Credential deleted successfully!",
        description: "The API key has been removed from your vault.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete credential",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCredentialMutation.mutate(formData);
  };

  const handleEditClick = (credential: Credential) => {
    setCurrentCredential(credential);
    setFormData({ platform: credential.platform, api_key: "" }); // API key is not returned, so set to empty
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCredential) {
      updateCredentialMutation.mutate({
        ...currentCredential,
        platform: formData.platform,
        api_key: formData.api_key || currentCredential.api_key, // Only update if new key is provided
      });
    }
  };

  if (isLoading) return <div>Loading credentials...</div>;
  if (isError) return <div>Error loading credentials.</div>;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">API Key Vault</CardTitle>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Key
        </Button>
      </CardHeader>
      <CardContent>
        {credentials && credentials.length > 0 ? (
          <div className="space-y-4">
            {credentials.map((credential) => (
              <div key={credential.id} className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="text-lg font-medium">{credential.platform}</p>
                  <p className="text-sm text-gray-500">Last updated: {new Date(credential.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(credential)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          <span className="font-bold"> {credential.platform} </span>
                          API key from your vault.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCredentialMutation.mutate(credential.id)}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No API keys found in your vault. Add one to get started!</p>
        )}
      </CardContent>

      {/* Create Credential Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform Name (e.g., groq, openai, gemini)</Label>
              <Input
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCredentialMutation.isPending}>
                {createCredentialMutation.isPending ? "Adding..." : "Add Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Credential Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-platform">Platform Name</Label>
              <Input
                id="edit-platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-api_key">API Key (Leave blank to keep current)</Label>
              <Input
                id="edit-api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCredentialMutation.isPending}>
                {updateCredentialMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
