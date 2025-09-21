import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Edit, PlusCircle, Copy } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Updated type to match the new backend schema
interface Credential {
  id: number;
  name: string;
  service: string;
  created_at: string;
  updated_at: string;
}

interface CredentialFormData {
  name: string;
  service: string;
  credentials: string;
}

export const VaultSettings = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<Credential | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>({
    name: "",
    service: "",
    credentials: "",
  });
  const { authFetch } = useAuth();

  const { data: credentials, isLoading, isError } = useQuery<Credential[]>({ 
    queryKey: ['credentials'], 
    queryFn: async () => {
      const response = await authFetch(`/api/v1/credentials/`);
      if (!response.ok) throw new Error("Failed to fetch credentials");
      return response.json();
    }
  });

  const createCredentialMutation = useMutation({
    mutationFn: async (newCredential: CredentialFormData) => {
      const response = await authFetch(`/api/v1/credentials/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      toast.success("Credential created successfully!");
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to create credential", { description: error.message });
    },
  });

  const updateCredentialMutation = useMutation({
    mutationFn: async (updatedCredential: Partial<CredentialFormData> & { id: number }) => {
      const response = await authFetch(`/api/v1/credentials/${updatedCredential.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      toast.success("Credential updated successfully!");
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update credential", { description: error.message });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      const response = await authFetch(`/api/v1/credentials/${credentialId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete credential");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success("Credential deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete credential", { description: error.message });
    },
  });

  const handleOpenCreate = () => {
    setFormData({ name: "", service: "", credentials: "" });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (credential: Credential) => {
    setCurrentCredential(credential);
    setFormData({ name: credential.name, service: credential.service, credentials: "" });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCredential) {
      // Update logic
      const payload: Partial<CredentialFormData> & { id: number } = { id: currentCredential.id };
      if (formData.name !== currentCredential.name) payload.name = formData.name;
      if (formData.service !== currentCredential.service) payload.service = formData.service;
      if (formData.credentials) payload.credentials = formData.credentials;
      updateCredentialMutation.mutate(payload);
    } else {
      // Create logic
      createCredentialMutation.mutate(formData);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) return <div>Loading credentials...</div>;
  if (isError) return <div>Error loading credentials.</div>;

  const renderDialogContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-lg">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., My OpenAI Key"
          required
          className="p-3 text-lg"
        />
        <p className="text-sm text-gray-500">A descriptive name for your credential.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="service" className="text-lg">Service</Label>
        <Input
          id="service"
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          placeholder="e.g., openai"
          required
          className="p-3 text-lg"
        />
        <p className="text-sm text-gray-500">The name of the service (e.g., openai, google, etc.).</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="credentials" className="text-lg">
          {currentCredential ? "New API Key (Leave blank to keep current)" : "API Key"}
        </Label>
        <Input
          id="credentials"
          type="password"
          value={formData.credentials}
          onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
          required={!currentCredential}
          className="p-3 text-lg"
        />
        <p className="text-sm text-gray-500">Your secret API key.</p>
      </div>
      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={() => currentCredential ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)} className="text-lg p-3">
          Cancel
        </Button>
        <Button type="submit" disabled={createCredentialMutation.isPending || updateCredentialMutation.isPending} className="text-lg p-3 bg-blue-500 hover:bg-blue-600 text-white">
          {currentCredential ? (updateCredentialMutation.isPending ? "Saving..." : "Save Changes") : (createCredentialMutation.isPending ? "Adding..." : "Add Key")}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-teal-900 bg-clip-text text-transparent">
            API Key Vault
          </h2>
          <p className="text-gray-600 mt-1">Manage your API credentials for various AI platforms</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-blue-500 hover:bg-blue-600 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Key
        </Button>
      </div>

      {credentials && credentials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {credentials.map((credential) => (
            <Card key={credential.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                    {/* Placeholder for service logo */}
                    <i className="fas fa-key text-2xl text-gray-500"></i>
                  </div>
                  <div>
                    <p className="text-lg font-medium">{credential.name}</p>
                    <p className="text-sm text-gray-500">Service: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{credential.service}</span></p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(credential.id.toString())} className="w-full justify-start p-2 text-left">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Key ID
                </Button>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(credential)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the <span className="font-bold">{credential.name}</span> credential.
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
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-medium text-gray-800">No API keys found</h3>
          <p className="text-gray-500 mt-2">Add one to get started!</p>
          <Button onClick={handleOpenCreate} className="mt-6 bg-blue-500 hover:bg-blue-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Key
          </Button>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New API Key</DialogTitle></DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit API Key</DialogTitle></DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};