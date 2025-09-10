import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Phone, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CryptoBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function CryptoBuyModal({ isOpen, onClose, userId }: CryptoBuyModalProps) {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [cryptoType, setCryptoType] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const cryptoOptions = [
    { value: 'USDT', label: 'USDT (Tether)', rate: 150, icon: '₮' },
    { value: 'SOL', label: 'Solana', rate: 18000, icon: '◎' },
    { value: 'BTC', label: 'Bitcoin', rate: 6500000, icon: '₿' },
    { value: 'ETH', label: 'Ethereum', rate: 420000, icon: 'Ξ' }
  ];

  const selectedCrypto = cryptoOptions.find(c => c.value === cryptoType);
  const expectedCrypto = amount && selectedCrypto ? (parseFloat(amount) / selectedCrypto.rate).toFixed(6) : '0';
  const feeAmount = amount ? (parseFloat(amount) * 0.025).toFixed(2) : '0';
  const netAmount = amount ? (parseFloat(amount) - parseFloat(feeAmount)).toFixed(2) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !amount || !cryptoType) {
      toast.error('Please fill in all fields');
      return;
    }

    if (parseInt(amount) < 100) {
      toast.error('Minimum purchase amount is KES 100');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('https://ccgowkctshnacrrgaloj.functions.supabase.co/secure-crypto-buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          amount: parseInt(amount),
          phone: phone.replace(/\D/g, ''),
          cryptoType,
          expectedCryptoAmount: parseFloat(expectedCrypto)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Purchase initiated! Check your phone for M-Pesa prompt.');
        setPhone('');
        setAmount('');
        setCryptoType('');
        onClose();
      } else {
        toast.error(data.error || 'Failed to initiate purchase');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Buy Cryptocurrency
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p>• Pay via M-Pesa to Paybill: <strong>400200</strong></p>
            <p>• Account Number: <strong>20758</strong></p>
            <p>• 2.5% platform fee applies</p>
            <p>• Crypto will be credited after payment confirmation</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crypto">Cryptocurrency</Label>
              <Select value={cryptoType} onValueChange={setCryptoType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cryptocurrency" />
                </SelectTrigger>
                <SelectContent>
                  {cryptoOptions.map((crypto) => (
                    <SelectItem key={crypto.value} value={crypto.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{crypto.icon}</span>
                        <span>{crypto.label}</span>
                        <span className="text-muted-foreground text-sm">
                          ≈ KES {crypto.rate.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min="100"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                M-Pesa registered number starting with 254
              </p>
            </div>

            {selectedCrypto && amount && (
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span>KES {parseInt(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fee (2.5%):</span>
                  <span className="text-red-500">-KES {feeAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net Amount:</span>
                  <span>KES {netAmount}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>You'll receive:</span>
                  <span className="text-primary">
                    {expectedCrypto} {cryptoType}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ <strong>Important:</strong> You'll receive an M-Pesa prompt on your phone. 
                Enter your PIN to complete the purchase. Crypto will be credited within 10 minutes.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !selectedCrypto}
              >
                {loading ? 'Processing...' : `Buy ${cryptoType || 'Crypto'}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}