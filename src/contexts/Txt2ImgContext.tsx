import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the type for generated images
export interface GeneratedImage {
  url: string;
  added: boolean;
  selected: boolean;
}

// Define the context type
interface Txt2ImgContextType {
  generatedImages: GeneratedImage[];
  setGeneratedImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  selectMode: boolean;
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create the context
const Txt2ImgContext = createContext<Txt2ImgContextType | undefined>(undefined);

// Create a hook to use the context
export const useTxt2Img = (): Txt2ImgContextType => {
  const context = useContext(Txt2ImgContext);
  if (!context) {
    throw new Error('useTxt2Img must be used within a Txt2ImgProvider');
  }
  return context;
};

// Provider component
interface Txt2ImgProviderProps {
  children: ReactNode;
}

export const Txt2ImgProvider: React.FC<Txt2ImgProviderProps> = ({ children }) => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectMode, setSelectMode] = useState<boolean>(false);

  const value = {
    generatedImages,
    setGeneratedImages,
    selectMode,
    setSelectMode
  };

  return (
    <Txt2ImgContext.Provider value={value}>
      {children}
    </Txt2ImgContext.Provider>
  );
}; 