
import { useQuery } from "@tanstack/react-query";
import { ChatMessage } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ConversationDetailProps {
  agentId: number;
  sessionId: string;
  companyId: number;
  onBack: () => void;
}

export const ConversationDetail = ({ agentId, sessionId, companyId, onBack }: ConversationDetailProps) => {
  const { data: messages, isLoading, isError } = useQuery<ChatMessage[]>({
    queryKey: ['messages', agentId, sessionId, companyId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/conversations/${agentId}/sessions/${sessionId}/messages`, {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
  });

  if (isLoading) return <div>Loading messages...</div>;
  if (isError) return <div>Error loading messages.</div>;

  console.log("Messages in ConversationDetail:", messages);

  return (
    <div className="space-y-4">
      <Button onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Sessions
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Conversation with Session ID: {sessionId.substring(0, 8)}...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="font-semibold">{message.sender === 'user' ? 'You' : 'Agent'}</p>
                <p>{message.message}</p>
                <p className="text-xs text-right mt-1">
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
