import { createContext, useState, ReactNode, useContext } from 'react';

interface OpenConversation {
  pubkey: string;
  isMinimized: boolean;
}

interface FloatingDMContextType {
  openConversations: OpenConversation[];
  openConversation: (pubkey: string) => void;
  closeConversation: (pubkey: string) => void;
  toggleMinimize: (pubkey: string) => void;
}

const FloatingDMContext = createContext<FloatingDMContextType | null>(null);

export function FloatingDMProvider({ children }: { children: ReactNode }) {
  const [openConversations, setOpenConversations] = useState<OpenConversation[]>([]);

  const openConversation = (pubkey: string) => {
    const existing = openConversations.find(c => c.pubkey === pubkey);
    if (!existing) {
      setOpenConversations([...openConversations, { pubkey, isMinimized: false }]);
    } else if (existing.isMinimized) {
      // If it exists but is minimized, maximize it
      toggleMinimize(pubkey);
    }
  };

  const closeConversation = (pubkey: string) => {
    setOpenConversations(openConversations.filter(c => c.pubkey !== pubkey));
  };

  const toggleMinimize = (pubkey: string) => {
    setOpenConversations(
      openConversations.map(c =>
        c.pubkey === pubkey ? { ...c, isMinimized: !c.isMinimized } : c
      )
    );
  };

  return (
    <FloatingDMContext.Provider value={{ openConversations, openConversation, closeConversation, toggleMinimize }}>
      {children}
    </FloatingDMContext.Provider>
  );
}

export function useFloatingDM() {
  const context = useContext(FloatingDMContext);
  if (!context) {
    // Return a no-op implementation instead of throwing
    // This allows components to gracefully handle the absence of the provider
    return {
      openConversations: [],
      openConversation: () => {},
      closeConversation: () => {},
      toggleMinimize: () => {},
    };
  }
  return context;
}
