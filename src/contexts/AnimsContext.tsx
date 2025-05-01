import React, { createContext, useContext, useState } from 'react';

export interface GeneratedAnim {
  url: string;
  added: boolean;
  selected: boolean;
}

interface AnimsContextType {
  generatedAnims: GeneratedAnim[];
  setGeneratedAnims: React.Dispatch<React.SetStateAction<GeneratedAnim[]>>;
  sourceAnim: string | null;
  setSourceAnim: React.Dispatch<React.SetStateAction<string | null>>;
}

interface AnimsProviderProps {
  children: React.ReactNode;
}

const AnimsContext = createContext<AnimsContextType | undefined>(undefined);

export const useAnims = () => {
  const context = useContext(AnimsContext);
  if (context === undefined) {
    throw new Error('useAnims must be used within an AnimsProvider');
  }
  return context;
};

export const AnimsProvider: React.FC<AnimsProviderProps> = ({ children }) => {
  const [generatedAnims, setGeneratedAnims] = useState<GeneratedAnim[]>([]);
  const [sourceAnim, setSourceAnim] = useState<string | null>(null);

  const value = {
    generatedAnims,
    setGeneratedAnims,
    sourceAnim,
    setSourceAnim
  };

  return (
    <AnimsContext.Provider value={value}>
      {children}
    </AnimsContext.Provider>
  );
}; 