import { useEffect } from "react";

const Support = () => {
  useEffect(() => {
    document.title = "Support | WalletOS";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Support</h1>
        <p className="text-muted-foreground">Chat with us using the widget or email support@walletos.app</p>
      </main>
    </div>
  );
};

export default Support;
