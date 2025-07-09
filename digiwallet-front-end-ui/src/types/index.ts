export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  admin_token?: string;
  user: User;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  fromUserId?: string;
  toUserId?: string;
}

export interface TransactionRequest {
  amount: number;
  currency?: string;
  description?: string;
}

export interface TransferRequest extends TransactionRequest {
  toUserId: string;
}

export interface AdminStats {
  totalBalance: number;
  currency: string;
  totalUsers: number;
  totalTransactions: number;
}

export interface TopUser {
  id: string;
  username: string;
  email: string;
  balance: number;
  transactionVolume: number;
}