export interface Video {
  id: string;
  identifier: string;
  filename: string;
  duration: number;
  fileSize: number;
  videoType: string;
  uploadDate: string;
  folderId: string | null;
  youtubeInfo?: {
    title: string;
    author: string;
    lengthSeconds: string;
  };
} 