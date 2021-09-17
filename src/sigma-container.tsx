import React, {
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GraphOptions } from "graphology-types";
import { Settings } from "sigma/settings";
import Sigma from "sigma/sigma";
import { equals } from "ramda";
import Graph from "graphology";
import { SigmaProvider } from "./sigma-provider";

type Props = {
  graphOptions?: Partial<GraphOptions>;
  initialSettings?: Partial<Settings>;
  id?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export const SigmaContainer = ({
  graphOptions,
  id,
  className,
  style,
  initialSettings,
  children,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const props = {
    className: `w-screen h-screen ${className || ""}`,
    id,
    style,
  };
  const [sigma, setSigma] = useState<Sigma | null>(null);
  const settings = useRef<Partial<Settings>>();

  if (!equals(settings.current, initialSettings))
    settings.current = initialSettings;

  const graph = useRef<Partial<GraphOptions>>();
  if (!equals(graph.current, graphOptions)) graph.current = graphOptions;

  useEffect(() => {
    let instance: Sigma | null = null;

    if (containerRef.current !== null) {
      instance = new Sigma(
        new Graph(graph.current),
        containerRef.current,
        settings.current
      );
      setSigma(instance);
    }

    return () => {
      setSigma(() => {
        if (instance) instance.kill();

        return null;
      });
    };
  }, [containerRef, graph, settings]);

  const context = useMemo(() => (sigma ? { sigma } : null), [sigma]);
  const contents =
    context !== null ? (
      <SigmaProvider value={context}>{children}</SigmaProvider>
    ) : null;

  return (
    <div {...props}>
      <div className="w-screen h-screen" ref={containerRef} />
      {contents}
    </div>
  );
};
