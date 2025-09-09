import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Phone, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function DepositModal({ isOpen, onClose, userId }: DepositModalProps) {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (parseInt(amount) < 10) {
      toast.error('Minimum deposit amount is KES 10');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone: phone.replace(/\D/g, ''), // Remove non-digits
          amount: parseInt(amount),
          user_id: userId
        }
      });

      if (error) throw error;

      toast.success('STK Push sent! Please check your phone and enter your M-Pesa PIN.');
      setPhone('');
      setAmount('');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Deposit via M-Pesa</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>• Minimum deposit: KES 10</p>
            <p>• You'll receive an STK Push notification</p>
            <p>• Funds will be available immediately after payment</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
                Enter your phone number starting with 254
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min="10"
                  required
                />
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ <strong>Disclaimer:</strong> This is for testnet use only. 
                Do not use real funds. Cryptocurrency trading involves risk.
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
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send STK Push'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}