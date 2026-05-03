import axios from 'axios';

const TX_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/transactions';
const AUTH_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/auth';

export const createEscrow = async (vendorPhone: string, amount: number, description: string, imageUrl?: string) => {
  const response = await axios.post(`${TX_BASE}`, { vendorPhone, amount, description, imageUrl });
  return response.data;
};

export const getTransactions = async (phone: string) => {
  const response = await axios.get(`${TX_BASE}/seller/${phone}`);
  return response.data;
};

export const getTransaction = async (id: string) => {
  const response = await axios.get(`${TX_BASE}/${id}`);
  return response.data;
};

export const verifyTransaction = async (id: string, transaction_id: string) => {
  const response = await axios.post(`${TX_BASE}/${id}/verify`, { transaction_id });
  return response.data;
};

export const updateTransactionStatus = async (id: string, status: string) => {
  const response = await axios.patch(`${TX_BASE}/${id}/status`, { status });
  return response.data;
};

export const updateTransactionMetadata = async (id: string, action: string) => {
  const response = await axios.patch(`${TX_BASE}/${id}/metadata`, { action });
  return response.data;
};

export const signup = async (userData: any) => {
  const response = await axios.post(`${AUTH_BASE}/signup`, userData);
  return response.data;
};

export const signin = async (credentials: any) => {
  const response = await axios.post(`${AUTH_BASE}/signin`, credentials);
  return response.data;
};
