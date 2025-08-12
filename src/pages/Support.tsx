import { useEffect } from "react";
import { WalletHeader } from "@/components/WalletHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const Support = () => {
  useEffect(() => { document.title = "Support | WalletOS"; }, []);

  return (
    <div className="min-h-screen bg-background">
      <WalletHeader />
      <main className="container mx-auto p-6">
        <Card className="crypto-card border-0 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Customer Support</CardTitle>
            <CardDescription>Chat with our team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">A chatbot will appear here in a future update. For now, email support@walletos.app</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Support;
