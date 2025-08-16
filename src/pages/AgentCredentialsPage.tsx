import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Credential } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ResourceSelector } from "@/components/ResourceSelector";

export const AgentCredentialsPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const { data: agent, isLoading: isLoadingAgent } = useQuery<Agent>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return response.json();
    },
  });

  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<Credential[]>({
    queryKey: ['credentials'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/credentials/`);
      if (!response.ok) throw new Error('Failed to fetch credentials');
      return response.json();
    },
  });

  const [selectedCredentialId, setSelectedCredentialId] = useState<number | null>(null);

  useEffect(() => {
    if (agent) {
      setSelectedCredentialId(agent.credential_id);
    }
  }, [agent]);

  const mutation = useMutation({
    mutationFn: (credentialId: number | null) => {
      return authFetch(`/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_id: credentialId }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success("Agent credential updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update agent credential.");
    },
  });

  const handleSave = () => {
    mutation.mutate(selectedCredentialId);
  };

  if (isLoadingAgent) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Agent Hub
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>Select the credential this agent can use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResourceSelector
            resources={credentials || []}
            selectedIds={selectedCredentialId ? [selectedCredentialId] : []}
            onSelect={(ids) => setSelectedCredentialId(ids[0] || null)}
            title="Select Credential"
            triggerButtonText="Browse Credentials"
            isLoading={isLoadingCredentials}
            allowMultiple={false}
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
