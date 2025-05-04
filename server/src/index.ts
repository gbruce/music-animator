import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import trackRoutes from './routes/trackRoutes';
import imageRoutes from './routes/imageRoutes';
import videoRoutes from './routes/videoRoutes';
import folderRoutes from './routes/folderRoutes';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import segmentRoutes from './routes/segmentRoutes';

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

// Create a route for serving videos by identifier
app.get('/videos/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`Fetching video with identifier: ${identifier}`);
    
    // Find the video in the database
    const video = await prisma.video.findUnique({
      where: { identifier }
    });
    
    if (!video) {
      console.log(`Video not found: ${identifier}`);
      return res.status(404).send('Video not found');
    }
    
    // Check if file exists
    if (!fs.existsSync(video.filePath)) {
      console.log(`Video file not found at: ${video.filePath}`);
      return res.status(404).send('Video file not found');
    }
    
    // Get file stats
    const stat = fs.statSync(video.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(video.filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.videoType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.videoType,
      };
      res.writeHead(200, head);
      fs.createReadStream(video.filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error serving video:', error);
    res.status(500).send('Error serving video');
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api', trackRoutes); // Track routes include their own prefixes
app.use('/api/segments', segmentRoutes);

// Add a ping endpoint for tests to check if server is running
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 