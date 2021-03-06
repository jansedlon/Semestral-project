import React, { useEffect, useState } from "react";
import circlepackLayout from "graphology-layout/circlepack";
import forceAtlas2, {
  ForceAtlas2Settings,
} from "graphology-layout-forceatlas2";
import Graph, { UndirectedGraph } from "graphology";
import gexf from "graphology-gexf/browser";
// @ts-ignore
import graphml from "graphology-graphml/browser";
import { Attributes, EdgeKey, NodeKey } from "graphology-types";
// @ts-ignore
import data from "../got-network.graphml";
import {
  useLoadGraph,
  useRegisterEvents,
  useSettings,
  useSigma,
} from "./hooks";
import {
  EDGE_INFLUENCED_COLOR,
  NODE_DEFAULT_COLOR,
  NODE_INFLUENCED_COLOR,
  NODE_INFLUENCING_COLOR,
} from "./consts";

function calculateIndependentCascadeModel(
  graph: Graph,
  initialNodes: NodeKey[],
  probability: number
): [nodes: NodeKey[], edges: EdgeKey[]] {
  const influencedNodes = new Set<NodeKey>(initialNodes);
  const edges = new Set<EdgeKey>();
  // const visitedNodes = new Set<NodeKey>();

  const process = (nodes: NodeKey[]) => {
    let newlyInfluencedNodes: NodeKey[] = [];

    // Iterate through all given nodes
    nodes.forEach((node) => {
      // Get neighbors of a node, but not ones that have been already influenced or visited
      const neighbors = graph.neighbors(node).filter(
        (neighbor) => !influencedNodes.has(neighbor)
        //  && !visitedNodes.has(neighbor)
      );
      // Mark them as visited
      // neighbors.forEach((neighbor) => visitedNodes.add(neighbor));

      // Mark some of them as influenced. The number is determined by a probability
      newlyInfluencedNodes = neighbors.filter(
        () => Math.random() <= probability
      );

      // Insert edges between current node and newly influenced nodes to the edges array
      newlyInfluencedNodes.forEach((influencedNode) => {
        const edge = graph.edge(node, influencedNode)!;
        edges.add(edge);
      });

      // Add them to the array
      newlyInfluencedNodes.forEach((influencedNode) =>
        influencedNodes.add(influencedNode)
      );
    });

    // If any number (more than 0) of nodes have been influenced, repeat
    if (newlyInfluencedNodes.length > 0) process(newlyInfluencedNodes);
  };

  process(initialNodes);

  return [Array.from(influencedNodes), Array.from(edges)];
}

const App = () => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const loadGraph = useLoadGraph();
  const setSettings = useSettings();

  const [forceAtlasOptions, setForceAtlasOptions] =
    useState<ForceAtlas2Settings>({
      gravity: 1,
      scalingRatio: 2,
    });
  const [info, setInfo] = useState({ numberOfNodes: 0, numberOfEdges: 0 });
  const [probability, setProbability] = useState(0.3);
  const [initiallyInfluencedNodes, setInitiallyInfluencedNodes] = useState<
    NodeKey[]
  >([]);
  const [influencedNodes, setInfluencedNodes] = useState<NodeKey[] | null>(
    null
  );
  const [influencedEdges, setInfluencedEdges] = useState<NodeKey[] | null>(
    null
  );

  useEffect(() => {
    const graph: Graph<Attributes, Attributes, Attributes> = graphml.parse(
      UndirectedGraph,
      data
    );

    forceAtlas2.assign(graph, {
      iterations: 50,
      settings: forceAtlasOptions,
    });
    // circlepackLayout.assign(graph);

    graph.nodes().forEach((node) => {
      graph.mergeNodeAttributes(node, {
        label: node,
        size: 10,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: NODE_DEFAULT_COLOR,
      });
    });

    loadGraph(graph);

    setInfo({
      numberOfNodes: graph.nodes().length,
      numberOfEdges: graph.edges().length,
    });
  }, []);

  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => {
        if (initiallyInfluencedNodes.includes(node)) {
          setInitiallyInfluencedNodes((prev) => prev.filter((n) => n !== node));
        } else {
          setInitiallyInfluencedNodes((prev) => [...prev, node]);
        }
      },
    });
  }, [initiallyInfluencedNodes]);

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      nodeReducer: (node, attrs) => {
        const newAttrs: Attributes = { ...attrs };

        if (initiallyInfluencedNodes.includes(node)) {
          newAttrs.color = NODE_INFLUENCING_COLOR;
        }

        return newAttrs;
      },
    }));
  }, [initiallyInfluencedNodes]);

  const handleCalculating = () => {
    const calculation = calculateIndependentCascadeModel(
      sigma.getGraph(),
      initiallyInfluencedNodes,
      probability
    );
    setInfluencedNodes(calculation[0]);
    setInfluencedEdges(calculation[1]);
  };

  useEffect(() => {
    setSettings({
      nodeReducer: (node, attrs) => {
        const newAttrs: Attributes = { ...attrs };

        if (!influencedNodes) return newAttrs;

        if (influencedNodes.includes(node)) {
          newAttrs.color = NODE_INFLUENCED_COLOR;
        }

        return newAttrs;
      },
      edgeReducer: (edge, attrs) => {
        const newAttrs: Attributes = { ...attrs };

        if (!influencedEdges) {
          // newAttrs.color = EDGE_DEFAULT_COLOR;
          return newAttrs;
        }

        if (influencedEdges.includes(edge)) {
          newAttrs.color = EDGE_INFLUENCED_COLOR;
          newAttrs.size = 2;
          newAttrs.zIndex = 2;
        }

        return newAttrs;
      },
    });
  }, [influencedNodes, influencedEdges]);

  useEffect(() => {
    if (sigma.getGraph()) {
      forceAtlas2.assign(sigma.getGraph(), {
        iterations: 50,
        settings: forceAtlasOptions,
      });
    }
  }, [forceAtlasOptions]);

  return (
    <>
      <div className="absolute flex flex-col space-y-2 top-2 left-2 z-50">
        <span className="text-red-900 text-4xl flex flex-col space-y-2">
          <span>Number of nodes: {info.numberOfNodes}</span>
          <span>Number of edges: {info.numberOfEdges}</span>
        </span>
        <label className="text-red-900 text-4xl">
          Probability
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.1}
            onChange={(e) => setProbability(+e.target.value)}
            value={probability}
          />
          {probability}
        </label>
        {!influencedNodes ? (
          <button
            onClick={handleCalculating}
            type="button"
            className="inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start calculating
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => {
              setInfluencedNodes(null);
              setInfluencedEdges(null);
              setInitiallyInfluencedNodes([]);
            }}
          >
            Reset
          </button>
        )}
        {/* linLogMode?: boolean,
  outboundAttractionDistribution?: boolean,
  adjustSizes?: boolean,
  edgeWeightInfluence?: number,
  scalingRatio?: number,
  strongGravityMode?: boolean,
  gravity?: number,
  slowDown?: number,
  barnesHutOptimize?: boolean,
  barnesHutTheta?: number */}
        <label className="text-red-900 text-4xl">
          Linlog mode
          <input
            type="checkbox"
            checked={forceAtlasOptions.linLogMode}
            onChange={() =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                linLogMode: !prev.linLogMode,
              }))
            }
            value={probability}
          />
        </label>
        <label className="text-red-900 text-4xl">
          Outbound attraction distribution
          <input
            type="checkbox"
            checked={forceAtlasOptions.outboundAttractionDistribution}
            onChange={() =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                outboundAttractionDistribution:
                  !prev.outboundAttractionDistribution,
              }))
            }
          />
        </label>
        <label className="text-red-900 text-4xl">
          Adjust sizes
          <input
            type="checkbox"
            checked={!!forceAtlasOptions.adjustSizes}
            onChange={() =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                adjustSizes: !prev.adjustSizes,
              }))
            }
          />
        </label>
        <label className="text-red-900 text-4xl">
          Edge weight influence
          <input
            type="number"
            value={forceAtlasOptions.edgeWeightInfluence ?? 0}
            onChange={(e) =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                edgeWeightInfluence: +e.target.value,
              }))
            }
          />
        </label>
        <label className="text-red-900 text-4xl">
          Scaling ratio
          <input
            type="number"
            value={forceAtlasOptions.scalingRatio ?? 1}
            onChange={(e) =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                scalingRatio: +e.target.value,
              }))
            }
          />
        </label>
        <label className="text-red-900 text-4xl">
          Strong gravity mode
          <input
            type="checkbox"
            checked={!!forceAtlasOptions.strongGravityMode}
            onChange={() =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                strongGravityMode: !prev.strongGravityMode,
              }))
            }
          />
        </label>
        <label className="text-red-900 text-4xl">
          Gravity
          <input
            type="number"
            value={forceAtlasOptions.gravity ?? 1}
            onChange={(e) =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                gravity: +e.target.value,
              }))
            }
          />
        </label>
        <label className="text-red-900 text-4xl">
          Slow down
          <input
            type="number"
            value={forceAtlasOptions.slowDown ?? 1}
            onChange={(e) =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                slowDown: +e.target.value,
              }))
            }
          />
        </label>
        <label className="text-red-900 text-4xl">
          Barnes hut optimize
          <input
            type="checkbox"
            checked={!!forceAtlasOptions.barnesHutOptimize}
            onChange={() =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                barnesHutOptimize: !prev.barnesHutOptimize,
              }))
            }
          />
        </label>
        <label className="text-red-900 text-4xl">
          Barnes hut theta
          <input
            type="number"
            value={forceAtlasOptions.barnesHutTheta ?? 0.5}
            onChange={(e) =>
              setForceAtlasOptions((prev) => ({
                ...prev,
                barnesHutTheta: +e.target.value,
              }))
            }
          />
        </label>
      </div>
    </>
  );
};

export default App;
