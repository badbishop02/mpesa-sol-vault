import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    { role: "bot", text: "Hi! How can we help you today?" },
  ]);
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }, { role: "bot", text: "Thanks! Our team will get back shortly." }]);
    setText("");
  };

  return (
    <div>
      {/* Floating toggle button */}
      <Button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg"
        aria-label={open ? "Close support" : "Open support"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 max-w-[90vw] z-50">
          <Card className="crypto-card border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Customer Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 overflow-y-auto space-y-2 mb-3 pr-1">
                {messages.map((m, i) => (
                  <div key={i} className={`text-sm ${m.role === "bot" ? "text-muted-foreground" : "text-foreground"}`}>
                    <span className="font-medium mr-1">{m.role === "bot" ? "Support" : "You"}:</span>
                    <span>{m.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type your message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <Button onClick={send}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
