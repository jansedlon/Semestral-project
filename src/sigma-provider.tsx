import Sigma from "sigma/sigma";
import { createContext, useContext } from "react";

interface SigmaContextInterface {
  sigma: Sigma;
}

export const SigmaContext = createContext<SigmaContextInterface | null>(null);

export const SigmaProvider = SigmaContext.Provider;

export function useSigmaContext(): SigmaContextInterface {
  const context = useContext(SigmaContext);

  if (!context) {
    throw new Error(
      "No context provided: useSigmaContext() can only be used in a descendant of <SigmaContainer>"
    );
  }

  return context;
}
