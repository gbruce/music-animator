// Get configuration from environment variables or use defaults
const host = import.meta.env.VITE_API_HOST || 'localhost';
const port = import.meta.env.VITE_API_PORT || '3001';

// Export the API configuration
export const API_CONFIG = {
  host,
  port,
  baseUrl: `http://${host}:${port}`,
  apiUrl: `http://${host}:${port}/api`
}; 