import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';

const baseUrl = 'http://localhost:5001';
let authToken = '';
let testUserId = '';
let uploadedImageId = '';

// Ping the server to check if it's running
const pingServer = async (): Promise<boolean> => {
  try {
    await axios.get(`${baseUrl}/ping`);
    return true;
  } catch (error) {
    console.error('Server is not running. Please start the server on port 5001.');
    return false;
  }
};

// Create a test user
const createTestUser = async () => {
  const username = `test_${uuidv4().slice(0, 8)}`;
  const password = 'password123';
  
  try {
    const response = await axios.post(`${baseUrl}/api/users/signup`, {
      username,
      password,
      email: `${username}@example.com`
    });
    
    console.log('Test user created:', username);
    testUserId = response.data.userId;
    
    // Login to get token
    const loginResponse = await axios.post(`${baseUrl}/api/users/login`, {
      username,
      password
    });
    
    authToken = loginResponse.data.token;
    console.log('Auth token generated');
    
    return { username, password, userId: testUserId };
  } catch (error) {
    console.error('Error creating test user:', error.response?.data || error.message);
    throw error;
  }
};

// Clean up test user and related data
const cleanupTestUser = async () => {
  if (!testUserId || !authToken) return;
  
  try {
    await axios.delete(`${baseUrl}/auth/users/${testUserId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Test user and related data cleaned up');
  } catch (error) {
    console.error('Error cleaning up test user:', error.response?.data || error.message);
  }
};

// Verify test image exists
const checkTestImage = async (): Promise<string> => {
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  
  if (!fs.existsSync(testImagePath)) {
    console.error('Test image does not exist. Please run createTestImage.js first.');
    throw new Error('Test image not found');
  }
  
  console.log('Test image found at:', testImagePath);
  return testImagePath;
};

// Wait for server to be ready
const waitForServer = async (retries = 5, delay = 1000): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    const isRunning = await pingServer();
    if (isRunning) return true;
    
    console.log(`Waiting for server... (${i + 1}/${retries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return false;
};

describe('Image and Folder Integration Test', () => {
  beforeAll(async () => {
    // Ensure server is running
    const serverRunning = await waitForServer();
    if (!serverRunning) {
      throw new Error('Server is not running. Please start the server on port 5001.');
    }
    
    // Create test user and get auth token
    await createTestUser();
    
    // Verify test image exists
    await checkTestImage();
  }, 10000);
  
  afterAll(async () => {
    // Clean up test user and related data
    await cleanupTestUser();
  });
  
  test('Should upload an image, create a folder, and move the image to the folder', async () => {
    // Step 1: Upload an image
    try {
      const testImagePath = await checkTestImage();
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));
      
      const uploadResponse = await axios.post(`${baseUrl}/api/images/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      });
      
      console.log('Upload response:', uploadResponse.data);
      
      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.data.id).toBeDefined();
      
      uploadedImageId = uploadResponse.data.id;
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      throw error;
    }
    
    // Step 2: Create a folder
    let folderId = '';
    try {
      const folderResponse = await axios.post(`${baseUrl}/api/folders`, 
        { name: 'Test Folder' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(folderResponse.status).toBe(201);
      expect(folderResponse.data.id).toBeDefined();
      
      folderId = folderResponse.data.id;
    } catch (error) {
      console.error('Folder creation error:', error.response?.data || error.message);
      throw error;
    }
    
    // Step 3: Move the image to the folder
    try {
      const moveResponse = await axios.post(
        `${baseUrl}/api/images/move`,
        { imageIds: [uploadedImageId], folderId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(moveResponse.status).toBe(200);
    } catch (error) {
      console.error('Move image error:', error.response?.data || error.message);
      throw error;
    }
    
    // Step 4: Verify the image is in the folder
    try {
      const folderImagesResponse = await axios.get(
        `${baseUrl}/api/folders/${folderId}/images`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(folderImagesResponse.status).toBe(200);
      expect(folderImagesResponse.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: uploadedImageId })
        ])
      );
    } catch (error) {
      console.error('Folder images error:', error.response?.data || error.message);
      throw error;
    }
  }, 15000);
}); 