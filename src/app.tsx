import React, { useEffect, useState } from "react";
import circlepackLayout from "graphology-layout/circlepack";
import Graph, { UndirectedGraph } from "graphology";
import gexf from "graphology-gexf/browser";
// @ts-ignore
import graphml from "graphology-graphml/browser";
import { Attributes, NodeKey } from "graphology-types";
// @ts-ignore
import data from "../got-network.graphml";
import {
  useLoadGraph,
  useRegisterEvents,
  useSettings,
  useSigma,
} from "./hooks";

function calculateIndependentCascadeModel(
  graph: Graph,
  initialNodes: NodeKey[],
  probability: number
): NodeKey[] {
  const influencedNodes = new Set<NodeKey>(initialNodes);
  const visitedNodes = new Set<NodeKey>();

  const process = (nodes: NodeKey[]) => {
    let newlyInfluencedNodes: NodeKey[] = [];

    // Iterate through all given nodes
    nodes.forEach((node) => {
      // Get neighbors of a node, but not ones that have been already influenced or visited
      const neighbors = graph
        .neighbors(node)
        .filter(
          (neighbor) =>
            !influencedNodes.has(neighbor) && !visitedNodes.has(neighbor)
        );
      // Mark them as visited
      neighbors.forEach((neighbor) => visitedNodes.add(neighbor));

      // Mark some of them as influenced. The number is determined by a probability
      newlyInfluencedNodes = neighbors.filter(
        () => Math.random() <= probability
      );

      // Add them to the array
      newlyInfluencedNodes.forEach((influencedNode) =>
        influencedNodes.add(influencedNode)
      );
    });

    // If any number (more than 0) of nodes have been influenced, repeat
    if (newlyInfluencedNodes.length > 0) process(newlyInfluencedNodes);
  };

  process(initialNodes);

  return Array.from(influencedNodes);
}

const App = () => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const loadGraph = useLoadGraph();
  const setSettings = useSettings();

  const [info, setInfo] = useState({ numberOfNodes: 0, numberOfEdges: 0 });
  const [probability, setProbability] = useState(0.3);
  const [initiallyInfluencedNodes, setInitiallyInfluencedNodes] = useState<
    NodeKey[]
  >([]);
  const [influencedNodes, setInfluencedNodes] = useState<NodeKey[] | null>(
    null
  );

  useEffect(() => {
    // invoke("my_custom_command", { invokeMessage: "message" })
    //   .then()
    //   .catch((err) => console.log(err));
    // const graph = gexf.parse(UndirectedGraph, data);
    const graph: Graph<Attributes, Attributes, Attributes> = graphml.parse(
      UndirectedGraph,
      data
    );
    circlepackLayout.assign(graph);

    graph.nodes().forEach((node) => {
      graph.mergeNodeAttributes(node, {
        label: node,
        size: 10,
        color: "#AAAAAA",
      });
    });

    loadGraph(graph);

    registerEvents({
      // enterNode: ({ node }) => setHoveredNode(node),
      clickNode: ({ node }) => {
        if (initiallyInfluencedNodes.includes(node)) {
          setInitiallyInfluencedNodes((prev) => prev.filter((n) => n !== node));
        } else if (initiallyInfluencedNodes.length <= 2) {
          setInitiallyInfluencedNodes((prev) => [...prev, node]);
        }
      },
      // leaveNode: () => setHoveredNode(null),
    });

    setInfo({
      numberOfNodes: graph.nodes().length,
      numberOfEdges: graph.edges().length,
    });
  }, []);

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      nodeReducer: (node, attrs) => {
        const newAttrs: Attributes = { ...attrs };

        if (initiallyInfluencedNodes.includes(node)) {
          newAttrs.color = "#ff0000";
        }

        return newAttrs;
      },
    }));
  }, [initiallyInfluencedNodes]);

  const handleCalculating = () => {
    console.log(
      calculateIndependentCascadeModel(
        sigma.getGraph(),
        initiallyInfluencedNodes,
        probability
      )
    );
    setInfluencedNodes(
      calculateIndependentCascadeModel(
        sigma.getGraph(),
        initiallyInfluencedNodes,
        probability
      )
    );
    // setCalculatedSteps(
    //   calculateIndependentCascadeModel(
    //     sigma.getGraph(),
    //     initiallyInfluencedNodes,
    //     0.5
    //   )
    // );
  };

  useEffect(() => {
    if (influencedNodes) {
      setSettings({
        nodeReducer: (node, attrs) => {
          const newAttrs: Attributes = { ...attrs };

          if (influencedNodes.includes(node)) {
            newAttrs.color = "#46c800";
          }

          return newAttrs;
        },
      });
    }
  }, [influencedNodes]);

  return (
    <>
      <div className="absolute flex flex-col top-0 left-0 z-50">
        <span className="text-red-900 text-4xl">
          Number of nodes: {info.numberOfNodes}
          <br />
          Number of edges: {info.numberOfEdges}
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
      </div>
      <div className="absolute bottom-0 right-0 z-50">
        {!influencedNodes ? (
          <button onClick={handleCalculating} type="button">
            Start calculating
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setInfluencedNodes(null);
              setInitiallyInfluencedNodes([]);
            }}
          >
            Reset
          </button>
        )}
      </div>
    </>
  );
};

export default App;
