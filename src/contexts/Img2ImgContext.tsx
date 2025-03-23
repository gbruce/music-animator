import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the type for generated images
export interface GeneratedImage {
  url: string;
  added: boolean;
  selected: boolean;
}

// Define the context type
interface Img2ImgContextType {
  generatedImages: GeneratedImage[];
  setGeneratedImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  sourceImage: string | null;
  setSourceImage: React.Dispatch<React.SetStateAction<string | null>>;
}

// Create the context
const Img2ImgContext = createContext<Img2ImgContextType | undefined>(undefined);

// Create a hook to use the context
export const useImg2Img = (): Img2ImgContextType => {
  const context = useContext(Img2ImgContext);
  if (!context) {
    throw new Error('useImg2Img must be used within a Img2ImgProvider');
  }
  return context;
};

// Provider component
interface Img2ImgProviderProps {
  children: ReactNode;
}

export const Img2ImgProvider: React.FC<Img2ImgProviderProps> = ({ children }) => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  const value = {
    generatedImages,
    setGeneratedImages,
    sourceImage,
    setSourceImage
  };

  return (
    <Img2ImgContext.Provider value={value}>
      {children}
    </Img2ImgContext.Provider>
  );
}; 