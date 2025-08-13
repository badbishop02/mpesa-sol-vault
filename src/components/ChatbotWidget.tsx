import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hi! How can we help you today?' }
  ]);
  const [input, setInput] = useState("");

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: input }, { role: 'bot', text: 'Thanks! Our team will get back to you shortly.' }]);
    setInput("");
  };

  return (
    <>
      <button
        aria-label="Open support chat"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 crypto-gradient text-white rounded-full p-3 shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-3 border-b border-border font-medium">Support Chat</div>
          <div className="p-3 space-y-2 max-h-80 overflow-auto">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <span className={`inline-block px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary/10' : 'bg-secondary/50'}`}>{m.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." />
            <Button type="submit" size="icon" variant="secondary"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
