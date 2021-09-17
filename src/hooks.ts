import Sigma from "sigma/sigma";
import Graph from "graphology";
import { useEffect, useState } from "react";
import { Settings } from "sigma/settings";
import { useSigmaContext } from "./sigma-provider";
import { EventHandlers } from "./types";

export const useSigma = (): Sigma => useSigmaContext().sigma;

export const useLoadGraph = () => {
  const sigma = useSigma();

  return (graph: Graph, clear = true) => {
    if (sigma && graph) {
      if (clear && sigma.getGraph().order > 0) sigma.getGraph().clear();

      sigma.getGraph().import(graph);
    }
  };
};

export const useRegisterEvents = () => {
  const sigma = useSigma();
  const [eventHandlers, setEventHandlers] = useState<Partial<EventHandlers>>(
    {}
  );

  useEffect(() => {
    if (!sigma || !eventHandlers) return;

    Object.entries(eventHandlers).forEach(([eventName, eventHandler]) => {
      if (eventName === "cameraUpdated") {
        sigma.getCamera().on(eventName, eventHandler);
      } else {
        sigma.on(eventName, eventHandler);
      }
    });

    return () => {
      Object.entries(eventHandlers).forEach(([eventName, eventHandler]) => {
        if (eventName === "cameraUpdated") {
          sigma.getCamera().removeListener(eventName, eventHandler);
        } else {
          sigma.removeListener(eventName, eventHandler);
        }
      });
    };
  }, [sigma, eventHandlers]);

  return setEventHandlers;
};

export const useSettings = () => {
  const sigma = useSigma();
  const [settings, setSettings] = useState<Partial<Settings>>({});

  useEffect(() => {
    if (!sigma || !settings) return;

    const prevSettings: Partial<Settings> = {};

    (Object.keys(settings) as Array<keyof Settings>).forEach((key) => {
      prevSettings[key] = settings[key] as never;
      sigma.setSetting(key, settings[key] as never);
    });

    return () => {
      (Object.keys(prevSettings) as Array<keyof Settings>).forEach((key) => {
        sigma.setSetting(key, prevSettings[key] as never);
      });
    };
  }, [sigma, settings]);

  return setSettings;
};
