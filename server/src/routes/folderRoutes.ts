import express from 'express';
import { folderController } from '../controllers/folderController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all folders for the current user
router.get('/', folderController.getFolders);

// Create a new folder
router.post('/', folderController.createFolder);

// Get images in a folder
router.get('/:folderId/images', folderController.getFolderImages);

// Rename a folder
router.put('/:folderId', folderController.renameFolder);

// Move a folder to a new parent
router.patch('/:folderId/move', folderController.moveFolder);

// Delete a folder
router.delete('/:folderId', folderController.deleteFolder);

export default router; 