
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";

const BuilderPage = () => {
  const [isCreateAgentDialogOpen, setIsCreateAgentDialogOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
            Agent Builder
          </h2>
          <p className="text-gray-600 mt-1">Design conversation flows with drag-and-drop interface</p>
        </div>
        <Button onClick={() => setIsCreateAgentDialogOpen(true)}>
          Create New Agent
        </Button>
      </div>
      {/* AgentBuilder will be rendered when an agent is selected for editing, not directly here */}

      <CreateAgentDialog
        open={isCreateAgentDialogOpen}
        onOpenChange={setIsCreateAgentDialogOpen}
      />
    </div>
  );
};

export default BuilderPage;
