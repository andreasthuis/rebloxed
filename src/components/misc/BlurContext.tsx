import { createContext, useContext, useState } from "react";

const BlurContext = createContext<{
  acquire: () => void;
  release: () => void;
} | null>(null);

export const BlurProvider = ({ children }: { children: React.ReactNode }) => {
  const [count, setCount] = useState(0);

  const acquire = () => setCount((c) => c + 1);
  const release = () => setCount((c) => Math.max(0, c - 1));

  return (
    <BlurContext.Provider value={{ acquire, release }}>
      {children}
      {count > 0 && <div className="ui-blur" />}
    </BlurContext.Provider>
  );
};

export const useBlur = () => {
  const ctx = useContext(BlurContext);
  if (!ctx) throw new Error("useBlur must be used inside BlurProvider");
  return ctx;
};
