import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { HelpModal } from './HelpModal';
import { track } from '../lib/analytics';

const Ctx = createContext<{ openHelp: () => void }>({ openHelp: () => {} });

export function HelpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openHelp = useCallback(() => { setOpen(true); track('help_opened'); }, []);
  return (
    <Ctx.Provider value={{ openHelp }}>
      {children}
      <HelpModal open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

export const useHelp = () => useContext(Ctx);
