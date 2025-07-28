import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const createTransaction = async (data: {
  type: string;
  amount: number;
  description: string;
  productId?: number;
  quantity?: number;
}) => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const getTransactions = async (page: number = 1, limit: number = 10) => {
  const response = await api.get('/transactions', { params: { page, limit } });
  return response.data;
};

export const createRawMaterial = async (data: {
  name: string;
  stock: number;
  costPerUnit: number;
}) => {
  const response = await api.post('/raw-materials', data);
  return response.data;
};

export const updateRawMaterial = async (
  id: number,
  data: {
    name?: string;
    costPerUnit?: number;
    stockToAdd?: number;
  }
) => {
  const response = await api.patch(`/raw-materials/${id}`, data);
  return response.data;
};

export const deleteRawMaterial = async (id: number) => {
  const response = await api.delete(`/raw-materials/${id}`);
  return response.data;
};

export const getRawMaterials = async () => {
  const response = await api.get('/raw-materials');
  return response.data;
};

export const createProduct = async (data: {
  name: string;
  productionTime?: number;
  profitMargin: number;
  rawMaterials: { rawMaterialId: number; quantity: number }[];
}) => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (
  id: number,
  data: {
    name?: string;
    productionTime?: number;
    profitMargin?: number;
    rawMaterials?: { rawMaterialId: number; quantity: number }[];
    stockToAdd?: number;
  }
) => {
  const response = await api.patch(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: number) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const updateCash = async (data: {
  amount: number;
  type: string;
  description: string;
}) => {
  const response = await api.post('/cash', data);
  return response.data;
};

export const getCash = async () => {
  const response = await api.get('/cash');
  return response.data;
};