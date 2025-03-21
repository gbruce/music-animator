import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import trackRoutes from './routes/trackRoutes';
import imageRoutes from './routes/imageRoutes';
import folderRoutes from './routes/folderRoutes';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Create a route for serving images by identifier
app.get('/images/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`Fetching image with identifier: ${identifier}`);
    
    // Find the image in the database
    const image = await prisma.image.findUnique({
      where: { identifier }
    });
    
    if (!image) {
      console.log(`Image not found: ${identifier}`);
      return res.status(404).send('Image not found');
    }
    
    // Check if file exists
    if (!fs.existsSync(image.filePath)) {
      console.log(`Image file not found at: ${image.filePath}`);
      return res.status(404).send('Image file not found');
    }
    
    // Serve the file
    console.log(`Serving image from: ${image.filePath}`);
    res.sendFile(image.filePath);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Error serving image');
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api', trackRoutes); // Track routes include their own prefixes

// Add a ping endpoint for tests to check if server is running
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 