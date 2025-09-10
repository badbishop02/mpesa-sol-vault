import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Activity
} from 'lucide-react';

const Admin = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [users, setUsers] = useState([]);
  const [pendingTrades, setPendingTrades] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const adminLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://ccgowkctshnacrrgaloj.functions.supabase.co/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginData.email,
          password: loginData.password
        })
      });

      const result = await response.json();
      if (result.success) {
        setAdminToken(result.token);
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', result.token);
        toast({ title: 'Login successful', description: `Welcome, ${result.admin.email}` });
      } else {
        toast({ title: 'Login failed', description: 'Invalid credentials', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to login', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const performAdminAction = async (action: string, data: any) => {
    if (!adminToken) return;

    try {
      const response = await fetch('https://ccgowkctshnacrrgaloj.functions.supabase.co/admin-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer Admin ${adminToken}`
        },
        body: JSON.stringify({ action, ...data })
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        // Refresh data
        loadDashboardData();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const loadDashboardData = async () => {
    if (!adminToken) return;

    // This would typically load real data from your API
    // For demo purposes, using mock data
    setUsers([
      { id: '1', email: 'user1@example.com', status: 'active', kyc: 'approved' },
      { id: '2', email: 'user2@example.com', status: 'suspended', kyc: 'pending' },
      { id: '3', email: 'user3@example.com', status: 'active', kyc: 'rejected' }
    ]);

    setPendingTrades([
      { id: '1', userId: '1', amount: 5000, crypto: 'USDT', status: 'pending' },
      { id: '2', userId: '2', amount: 10000, crypto: 'SOL', status: 'pending' }
    ]);

    setKycRequests([
      { id: '1', userId: '1', document: 'ID Card', status: 'pending' },
      { id: '2', userId: '3', document: 'Passport', status: 'pending' }
    ]);
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAdminToken(token);
      setIsAuthenticated(true);
      loadDashboardData();
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md crypto-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="Admin Email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            <Button 
              onClick={adminLogin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </Button>
            
            <div className="text-xs text-muted-foreground bg-accent/5 p-3 rounded">
              <strong>Demo Credentials:</strong><br />
              Email: admin@walletos.com<br />
              Password: admin123
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsAuthenticated(false);
              setAdminToken(null);
              localStorage.removeItem('adminToken');
            }}
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="crypto-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{user.email}</p>
                        <div className="flex gap-2">
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                          <Badge variant={user.kyc === 'approved' ? 'default' : 'secondary'}>
                            KYC: {user.kyc}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => performAdminAction('suspend_user', { userId: user.id, reason: 'Admin action' })}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => performAdminAction('freeze_user', { userId: user.id })}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => performAdminAction('reactivate_user', { userId: user.id })}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades" className="space-y-4">
            <Card className="crypto-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pending Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTrades.map((trade: any) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">KES {trade.amount.toLocaleString()} → {trade.crypto}</p>
                        <p className="text-sm text-muted-foreground">User ID: {trade.userId}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => performAdminAction('process_pending_trades', {})}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <Card className="crypto-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  KYC Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kycRequests.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{request.document}</p>
                        <p className="text-sm text-muted-foreground">User ID: {request.userId}</p>
                        <Badge variant="secondary">{request.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => performAdminAction('approve_kyc', { userId: request.userId })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="crypto-card border-0">
              <CardHeader>
                <CardTitle>Send Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => performAdminAction('send_kyc_notification', { userId: 'all' })}
                    className="w-full"
                  >
                    Send KYC Reminder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast({ title: 'Feature coming soon', description: 'Custom notifications will be available soon' })}
                    className="w-full"
                  >
                    Custom Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast({ title: 'Maintenance alert sent', description: 'All users notified of upcoming maintenance' })}
                    className="w-full"
                  >
                    Maintenance Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;