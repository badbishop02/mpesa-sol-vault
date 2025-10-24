import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  MessageCircle, 
  FileQuestion, 
  Shield, 
  Zap,
  HelpCircle,
  Book,
  ExternalLink
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Support = () => {
  useEffect(() => {
    document.title = "Support | WalletOS";
  }, []);

  const faqs = [
    {
      question: "How do I start copy trading?",
      answer: "Navigate to the Whales page, configure your copy trade settings (sizing type, value, and max slippage), then click 'Follow' on any whale you want to copy. When they make trades, the system will automatically execute similar trades for you based on your settings."
    },
    {
      question: "What is the difference between percentage and fixed sizing?",
      answer: "Percentage sizing means you'll trade a percentage of your balance relative to the whale's trade. Fixed sizing means you'll trade a specific USD amount regardless of the whale's position size. Percentage is recommended for beginners."
    },
    {
      question: "How does the Telegram bot work?",
      answer: "Add Telegram channels that share trading signals. The bot monitors these channels for trade signals (BUY/SELL commands or emoji indicators). If auto-execute is enabled, trades are executed automatically when signals are detected."
    },
    {
      question: "What is slippage and how should I set it?",
      answer: "Slippage is the difference between expected and actual trade execution prices. A setting of 0.05 (5%) means you'll accept up to 5% price difference. Higher slippage increases chance of execution but may result in worse prices. 1-5% is typical for most trades."
    },
    {
      question: "How do I deposit funds?",
      answer: "Use M-Pesa to deposit KES into your wallet. Go to your dashboard, click 'Deposit', enter the amount, and follow the M-Pesa prompts. Funds typically arrive within seconds to minutes."
    },
    {
      question: "Is my wallet secure?",
      answer: "Your wallet's private key is encrypted and stored securely. However, you should save your private key in a secure location offline. Never share your private key with anyone. WalletOS uses industry-standard encryption, but you are responsible for your key's safety."
    },
    {
      question: "What fees does WalletOS charge?",
      answer: "Trading fees vary by transaction type and network conditions. Check the fee amount displayed before confirming any trade. M-Pesa deposits may incur standard M-Pesa transaction fees."
    },
    {
      question: "Can I stop following a whale?",
      answer: "Yes, go to the Whales page, switch to the 'Following' tab, and click 'Unfollow' on any whale. This stops future copy trades but doesn't close existing positions."
    },
    {
      question: "What network does WalletOS use?",
      answer: "WalletOS operates on the Solana testnet for development. All trades are executed on Solana's high-speed blockchain. Make sure you understand testnet vs mainnet before trading."
    },
    {
      question: "How do I track my performance?",
      answer: "Visit the Portfolio page to see your holdings, allocations, P&L, success rate, and recent trades. The dashboard also shows real-time portfolio value and performance metrics."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold crypto-gradient bg-clip-text text-transparent">
                Support Center
              </h1>
              <p className="text-muted-foreground">
                Get help with WalletOS features and trading
              </p>
            </div>

            {/* Quick Contact */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="crypto-card border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Live Chat</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Chat with us using the widget
                      </p>
                      <Button variant="outline" size="sm">
                        Open Chat Widget
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="crypto-card border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Mail className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email Support</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get help via email
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = 'mailto:support@walletos.app'}
                      >
                        support@walletos.app
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="crypto-card border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-lg bg-success/10">
                      <Book className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Documentation</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Read our guides
                      </p>
                      <Button variant="outline" size="sm">
                        View Docs
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Guides */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="crypto-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>Get started with WalletOS in minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Create your account and secure your wallet</li>
                    <li>Deposit funds via M-Pesa</li>
                    <li>Explore whales and configure copy trade settings</li>
                    <li>Follow top performers to auto-copy trades</li>
                    <li>Monitor your portfolio and performance</li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="crypto-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Best Practices
                  </CardTitle>
                  <CardDescription>Keep your account safe</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Save your private key in a secure offline location</li>
                    <li>Never share your private key with anyone</li>
                    <li>Use strong, unique passwords</li>
                    <li>Enable two-factor authentication (coming soon)</li>
                    <li>Start with small amounts until familiar with the platform</li>
                    <li>Always verify transaction details before confirming</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* FAQ */}
            <Card className="crypto-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Common questions about WalletOS features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Disclaimers */}
            <Card className="crypto-card border-0 border-l-4 border-l-accent">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 text-accent">Important Disclaimers</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Not Investment Advice:</strong> WalletOS does not provide investment advice. All trades are your responsibility.</li>
                  <li>• <strong>Risk Warning:</strong> Cryptocurrency trading involves substantial risk. Only invest what you can afford to lose.</li>
                  <li>• <strong>Copy Trading Risks:</strong> Past performance of whales does not guarantee future results.</li>
                  <li>• <strong>Regulatory Compliance:</strong> Ensure cryptocurrency trading is legal in your jurisdiction.</li>
                  <li>• <strong>Testnet Notice:</strong> This platform operates on Solana testnet for development purposes.</li>
                  <li>• <strong>Private Key Security:</strong> You are solely responsible for securing your private keys. Loss of keys means loss of funds.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Still Need Help */}
            <Card className="crypto-card border-0 bg-primary/5">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Still Need Help?</h3>
                <p className="text-muted-foreground mb-4">
                  Our support team is here to help you with any questions or issues.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="default">
                    Open Chat Widget
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = 'mailto:support@walletos.app'}
                  >
                    Email Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default Support;
