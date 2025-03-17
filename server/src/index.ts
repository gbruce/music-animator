import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import trackRoutes from './routes/trackRoutes';
import imageRoutes from './routes/imageRoutes';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Create a static route for serving images
app.use('/images', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/images', imageRoutes);
app.use('/api', trackRoutes); // Track routes include their own prefixes

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 