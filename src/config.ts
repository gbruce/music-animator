// Get command line arguments
const args = process.argv.slice(2);
const hostArg = args.find(arg => arg.startsWith('--host='));
const portArg = args.find(arg => arg.startsWith('--port='));

// Parse host and port from arguments or use defaults
const host = hostArg ? hostArg.split('=')[1] : 'localhost';
const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3001;

// Export the API configuration
export const API_CONFIG = {
  host,
  port,
  baseUrl: `http://${host}:${port}`,
  apiUrl: `http://${host}:${port}/api`
}; 