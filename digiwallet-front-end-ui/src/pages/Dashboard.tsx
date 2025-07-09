import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WalletBalance, Transaction, TransactionRequest, TransferRequest } from '@/types';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferUserId, setTransferUserId] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get<WalletBalance>('/wallet/balance'),
        api.get<{ transactions: Transaction[] }>('/wallet/transactions?page=1&limit=10')
      ]);
      
      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data.transactions || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    setActionLoading('deposit');
    try {
      const data: TransactionRequest = {
        amount: parseFloat(depositAmount),
        currency: 'USD',
      };
      
      await api.post('/wallet/deposit', data);
      setDepositAmount('');
      await loadDashboardData();
      
      toast({
        title: "Deposit Successful",
        description: `$${depositAmount} has been added to your wallet`,
      });
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error.response?.data?.message || "Failed to process deposit",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    setActionLoading('withdraw');
    try {
      const data: TransactionRequest = {
        amount: parseFloat(withdrawAmount),
        currency: 'USD',
      };
      
      await api.post('/wallet/withdraw', data);
      setWithdrawAmount('');
      await loadDashboardData();
      
      toast({
        title: "Withdrawal Successful",
        description: `$${withdrawAmount} has been withdrawn from your wallet`,
      });
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.response?.data?.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0 || !transferUserId) {
      toast({
        title: "Invalid Transfer",
        description: "Please enter valid amount and recipient user ID",
        variant: "destructive",
      });
      return;
    }

    setActionLoading('transfer');
    try {
      const data: TransferRequest = {
        amount: parseFloat(transferAmount),
        recipientId: transferUserId,
        currency: 'USD',
      };
      
      await api.post('/wallet/transfer', data);
      setTransferAmount('');
      setTransferUserId('');
      await loadDashboardData();
      
      toast({
        title: "Transfer Successful",
        description: `$${transferAmount} has been transferred`,
      });
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.response?.data?.message || "Failed to process transfer",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-wallet-income" />;
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-wallet-expense" />;
      case 'transfer_in':
        return <ArrowDownLeft className="h-4 w-4 text-wallet-income" />;
      case 'transfer_out':
        return <ArrowUpRight className="h-4 w-4 text-wallet-expense" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'transfer_in':
        return 'text-wallet-income';
      case 'withdrawal':
      case 'transfer_out':
        return 'text-wallet-expense';
      default:
        return 'text-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your digital wallet</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-6 w-6" />
            <span>Wallet Balance</span>
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Your current account balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
  if (!balance) return (
    <>
      <span className="text-4xl font-bold">0.00</span>
      <span className="text-sm text-primary-foreground/80 ml-2">USD</span>
    </>
  );
  // If balance is an object with a nested currency object (e.g., { balance: { USD: 9750 } })
  if (typeof balance.balance === 'object' && balance.balance !== null) {
    const firstKey = Object.keys(balance.balance)[0];
    const amount = balance.balance[firstKey];
    if (typeof amount === 'number') {
      return <>
        <span className="text-4xl font-bold">{amount.toFixed(2)}</span>
        <span className="text-sm text-primary-foreground/80 ml-2">{firstKey}</span>
      </>;
    }
  }
  // If balance is a number property
  if (typeof balance.balance === 'number') return <><span className="text-4xl font-bold">{balance.balance.toFixed(2)}</span><span className="text-sm text-primary-foreground/80 ml-2">{balance.currency || 'USD'}</span></>;
  // If balance is an object with currency keys (e.g., { USD: 1000 })
  const firstKey = Object.keys(balance)[0];
  const amount = balance[firstKey];
  if (typeof amount === 'number') return <><span className="text-4xl font-bold">{amount.toFixed(2)}</span><span className="text-sm text-primary-foreground/80 ml-2">{firstKey}</span></>;
  return <><span className="text-4xl font-bold">0.00</span><span className="text-sm text-primary-foreground/80 ml-2">USD</span></>;
})()}

        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deposit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-wallet-income" />
              <span>Deposit Funds</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deposit">Amount (USD)</Label>
              <Input
                id="deposit"
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleDeposit}
              className="w-full"
              disabled={actionLoading === 'deposit'}
            >
              {actionLoading === 'deposit' ? 'Processing...' : 'Deposit'}
            </Button>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-wallet-expense" />
              <span>Withdraw Funds</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="withdraw">Amount (USD)</Label>
              <Input
                id="withdraw"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleWithdraw}
              className="w-full"
              disabled={actionLoading === 'withdraw'}
            >
              {actionLoading === 'withdraw' ? 'Processing...' : 'Withdraw'}
            </Button>
          </CardContent>
        </Card>

        {/* Transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-primary" />
              <span>Transfer Funds</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="transfer-amount">Amount (USD)</Label>
              <Input
                id="transfer-amount"
                type="number"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="transfer-user">Recipient User ID</Label>
              <Input
                id="transfer-user"
                placeholder="User ID"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
              />
            </div>
            <Button
              onClick={handleTransfer}
              className="w-full"
              disabled={actionLoading === 'transfer'}
            >
              {actionLoading === 'transfer' ? 'Processing...' : 'Transfer'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest wallet activities</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">
                        {transaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                      {transaction.type.includes('out') || transaction.type === 'withdrawal' ? '-' : '+'}
                      ${transaction.amount.toFixed(2)}
                    </p>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;