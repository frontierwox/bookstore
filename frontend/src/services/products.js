import api from './api';

export const getProducts = async (params) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const searchProducts = async (query) => {
  const response = await api.get('/products/search', { params: { q: query } });
  return response.data;
};

export const getProductsByCategory = async (category) => {
  const response = await api.get(`/products/category/${category}`);
  return response.data;
};

export const getProductsByOccasion = async (occasion) => {
  const response = await api.get(`/products/occasion/${occasion}`);
  return response.data;
};

export const addReview = async (productId, reviewData) => {
  const response = await api.post(`/products/${productId}/reviews`, reviewData);
  return response.data;
};

export const productsApi = {
  getProducts,
  getProductById,
  searchProducts,
  getProductsByCategory,
  getProductsByOccasion,
  addReview
};

export default productsApi;
