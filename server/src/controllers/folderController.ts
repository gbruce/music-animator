import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const folderController = {
  // Get all folders for the current user
  async getFolders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      const folders = await prisma.folder.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });
      
      res.json(folders);
    } catch (error) {
      console.error('Error getting folders:', error);
      res.status(500).json({ error: 'Failed to get folders' });
    }
  },
  
  // Create a new folder
  async createFolder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, parentId } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      if (!name) {
        res.status(400).json({ error: 'Folder name is required' });
        return;
      }
      
      // Check if parent folder exists and belongs to the user
      if (parentId) {
        const parentFolder = await prisma.folder.findUnique({
          where: { id: parentId }
        });
        
        if (!parentFolder) {
          res.status(404).json({ error: 'Parent folder not found' });
          return;
        }
        
        if (parentFolder.userId !== userId) {
          res.status(403).json({ error: 'Access denied to parent folder' });
          return;
        }
      }
      
      const folder = await prisma.folder.create({
        data: {
          name,
          parentId: parentId || null,
          userId
        }
      });
      
      res.status(201).json(folder);
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({ error: 'Failed to create folder' });
    }
  },
  
  // Get images in a folder
  async getFolderImages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { folderId } = req.params;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Check if folder exists and belongs to the user
      if (folderId) {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId }
        });
        
        if (!folder) {
          res.status(404).json({ error: 'Folder not found' });
          return;
        }
        
        if (folder.userId !== userId) {
          res.status(403).json({ error: 'Access denied to folder' });
          return;
        }
      }
      
      const images = await prisma.image.findMany({
        where: {
          userId,
          folderId: folderId || null
        },
        orderBy: { uploadDate: 'desc' }
      });
      
      res.json(images);
    } catch (error) {
      console.error('Error getting folder images:', error);
      res.status(500).json({ error: 'Failed to get folder images' });
    }
  },
  
  // Rename a folder
  async renameFolder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { folderId } = req.params;
      const { name } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      if (!name) {
        res.status(400).json({ error: 'Folder name is required' });
        return;
      }
      
      // Check if folder exists and belongs to the user
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      });
      
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }
      
      if (folder.userId !== userId) {
        res.status(403).json({ error: 'Access denied to folder' });
        return;
      }
      
      const updatedFolder = await prisma.folder.update({
        where: { id: folderId },
        data: { name }
      });
      
      res.json(updatedFolder);
    } catch (error) {
      console.error('Error renaming folder:', error);
      res.status(500).json({ error: 'Failed to rename folder' });
    }
  },
  
  // Move a folder to a new parent
  async moveFolder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { folderId } = req.params;
      const { parentId } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Check if folder exists and belongs to the user
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      });
      
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }
      
      if (folder.userId !== userId) {
        res.status(403).json({ error: 'Access denied to folder' });
        return;
      }
      
      // Check if new parent exists and belongs to the user
      if (parentId) {
        const parentFolder = await prisma.folder.findUnique({
          where: { id: parentId }
        });
        
        if (!parentFolder) {
          res.status(404).json({ error: 'Parent folder not found' });
          return;
        }
        
        if (parentFolder.userId !== userId) {
          res.status(403).json({ error: 'Access denied to parent folder' });
          return;
        }
        
        // Check for circular dependencies (can't move a folder into its own subtree)
        if (parentId === folderId) {
          res.status(400).json({ error: 'Cannot move a folder into itself' });
          return;
        }
        
        // Check if the new parent is a descendant of the folder being moved
        const isDescendantOfFolder = async (currentId: string, targetId: string): Promise<boolean> => {
          if (currentId === targetId) {
            return true;
          }
          
          const current = await prisma.folder.findUnique({
            where: { id: currentId },
            select: { parentId: true }
          });
          
          if (!current?.parentId) {
            return false;
          }
          
          return isDescendantOfFolder(current.parentId, targetId);
        };
        
        if (await isDescendantOfFolder(parentId, folderId)) {
          res.status(400).json({ error: 'Cannot move a folder into its own subtree' });
          return;
        }
      }
      
      const updatedFolder = await prisma.folder.update({
        where: { id: folderId },
        data: { parentId: parentId || null }
      });
      
      res.json(updatedFolder);
    } catch (error) {
      console.error('Error moving folder:', error);
      res.status(500).json({ error: 'Failed to move folder' });
    }
  },
  
  // Delete a folder
  async deleteFolder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { folderId } = req.params;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Check if folder exists and belongs to the user
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      });
      
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }
      
      if (folder.userId !== userId) {
        res.status(403).json({ error: 'Access denied to folder' });
        return;
      }
      
      // Get all descendant folders to delete
      const getDescendantFolderIds = async (folderId: string): Promise<string[]> => {
        const children = await prisma.folder.findMany({
          where: { parentId: folderId },
          select: { id: true }
        });
        
        const childIds = children.map(child => child.id);
        const descendantIds = await Promise.all(childIds.map(id => getDescendantFolderIds(id)));
        
        return [...childIds, ...descendantIds.flat()];
      };
      
      const descendantFolderIds = await getDescendantFolderIds(folderId);
      const allFolderIds = [folderId, ...descendantFolderIds];
      
      // Update images in these folders to have no folder
      await prisma.image.updateMany({
        where: {
          folderId: { in: allFolderIds },
          userId
        },
        data: {
          folderId: null
        }
      });
      
      // Delete folders in reverse order (children first, then parents)
      await prisma.folder.deleteMany({
        where: {
          id: { in: allFolderIds },
          userId
        }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting folder:', error);
      res.status(500).json({ error: 'Failed to delete folder' });
    }
  }
}; 