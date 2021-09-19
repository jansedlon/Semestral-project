import React, { useEffect, useState } from "react";
import circlepackLayout from "graphology-layout/circlepack";
import Graph, { UndirectedGraph } from "graphology";
import { clone } from "ramda";
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  EDGE_INFLUENCING_COLOR,
  EDGE_NOT_INFLUENCED_COLOR,
  NODE_DEFAULT_COLOR,
  NODE_INFLUENCED_COLOR,
  NODE_INFLUENCING_COLOR,
  NODE_NOT_INFLUENCED_COLOR,
} from "./consts";

type Step = {
  influencedNodes: NodeKey[];
  influencedEdges: EdgeKey[];
  influencingNodes: NodeKey[];
  influencingEdges: EdgeKey[];
  notInfluencedNodes: NodeKey[];
  notInfluencedEdges: EdgeKey[];
};

function calculateIndependentCascadeModel(
  graph: Graph,
  initialNodes: NodeKey[],
  probability: number
): [nodes: NodeKey[], edges: EdgeKey[]] {
  const influencedNodes = new Set<NodeKey>(initialNodes);
  const edges = new Set<EdgeKey>();
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

function calculateIndependentCascadeModelWithSteps(
  graph: Graph,
  initialNodes: NodeKey[],
  probability: number
): Step[] {
  const influencedNodes = new Set<NodeKey>(initialNodes);
  const edges = new Set<EdgeKey>();
  const visitedNodes = new Set<NodeKey>();

  // Assign initial data
  const steps: Step[] = [
    {
      influencedNodes: initialNodes,
      influencedEdges: [],
      influencingNodes: [],
      influencingEdges: [],
      notInfluencedNodes: [],
      notInfluencedEdges: [],
    },
  ];

  const process = (nodes: NodeKey[], stepIndex = 0) => {
    let newlyInfluencedNodes: NodeKey[] = [];
    /*
      If stepIndex is gt 0, assign data from a previous step.
      TODO: The most basic step tracking algorithm I could think of, not really memory optimized.

      Each call of the `process` function will add two steps.
      One step is to show which nodes are tried to be influenced
      and the second step is to show which have actually been influenced.

      For simplicity sake, since we add 2 steps for each call, incrementing stepIndex
      by 1 and then trying to get a previous step by that index,
      steps is a two dimensional array which is then flatted.
     */
    const firstStep: Step = clone(steps[steps.length - 1]);

    const influencingNodes: NodeKey[] = [];
    const influencingEdges: EdgeKey[] = [];
    const newlyInfluencedEdges: EdgeKey[] = [];

    // Iterate through all given nodes
    nodes.forEach((node) => {
      // Get neighbors of a node, but not ones that have been already influenced or visited
      const neighbors = graph
        .neighbors(node)
        .filter(
          (neighbor) =>
            !influencedNodes.has(neighbor) && !visitedNodes.has(neighbor)
        );

      influencingNodes.push(...neighbors);
      neighbors.forEach((neighbor) => {
        // Mark them as visited
        visitedNodes.add(neighbor);

        const edge = graph.edge(node, neighbor)!;
        influencingEdges.push(edge);
      });

      // Mark some of them as influenced. The number is determined by a probability
      newlyInfluencedNodes = neighbors.filter(
        () => Math.random() <= probability
      );

      // Insert edges between current node and newly influenced nodes to the edges array
      newlyInfluencedNodes.forEach((influencedNode) => {
        const edge = graph.edge(node, influencedNode)!;
        edges.add(edge);

        newlyInfluencedEdges.push(edge);
      });

      // Add them to the array
      newlyInfluencedNodes.forEach((influencedNode) => {
        influencedNodes.add(influencedNode);
        // newlyInfluencedNodes.push(influencedNode);
      });
    });

    firstStep.influencingNodes.push(...influencingNodes);
    firstStep.influencingEdges.push(...influencingEdges);

    const secondStep: Step = {
      influencedNodes: firstStep.influencedNodes.concat(newlyInfluencedNodes),
      influencedEdges: firstStep.influencedEdges.concat(newlyInfluencedEdges),
      influencingNodes: [],
      influencingEdges: [],
      notInfluencedNodes: firstStep.notInfluencedNodes.concat(
        influencingNodes.filter((node) => !newlyInfluencedNodes.includes(node))
      ),
      notInfluencedEdges: firstStep.notInfluencedEdges.concat(
        influencingEdges.filter((edge) => !newlyInfluencedEdges.includes(edge))
      ),
    };

    steps.push(firstStep);
    steps.push(secondStep);

    // If any number (more than 0) of nodes have been influenced, repeat
    if (newlyInfluencedNodes.length > 0)
      process(newlyInfluencedNodes, stepIndex + 1);
  };

  process(initialNodes, 0);

  return steps;
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
  const [influencedEdges, setInfluencedEdges] = useState<NodeKey[] | null>(
    null
  );
  const [steps, setSteps] = useState<Step[] | null>();
  const [stepToShow, setStepToShow] = useState(0);

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

    console.log(
      calculateIndependentCascadeModelWithSteps(
        sigma.getGraph(),
        initiallyInfluencedNodes,
        probability
      )
    );
    setSteps(
      calculateIndependentCascadeModelWithSteps(
        sigma.getGraph(),
        initiallyInfluencedNodes,
        probability
      )
    );
    // setInfluencedNodes(calculation[0]);
    // setInfluencedEdges(calculation[1]);
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
    setSettings({
      nodeReducer: (node, attrs) => {
        const newAttrs: Attributes = { ...attrs };

        if (!steps) return newAttrs;

        if (steps![stepToShow].influencedNodes.includes(node)) {
          newAttrs.color = NODE_INFLUENCED_COLOR;
        } else if (steps![stepToShow].influencingNodes.includes(node))
          newAttrs.color = NODE_INFLUENCING_COLOR;
        else if (steps![stepToShow].notInfluencedNodes.includes(node))
          newAttrs.color = NODE_NOT_INFLUENCED_COLOR;

        return newAttrs;
      },
      edgeReducer: (edge, attrs) => {
        const newAttrs: Attributes = { ...attrs };

        if (!steps) return newAttrs;

        if (steps![stepToShow].influencedEdges.includes(edge)) {
          newAttrs.color = EDGE_INFLUENCED_COLOR;
          newAttrs.size = 2;
          newAttrs.zIndex = 2;
        } else if (steps![stepToShow].influencingEdges.includes(edge)) {
          newAttrs.color = EDGE_INFLUENCING_COLOR;
          newAttrs.size = 2;
          newAttrs.zIndex = 2;
        } else if (steps![stepToShow].notInfluencedEdges.includes(edge)) {
          newAttrs.color = EDGE_NOT_INFLUENCED_COLOR;
          newAttrs.size = 2;
          newAttrs.zIndex = 2;
        }

        return newAttrs;
      },
    });
  }, [steps, stepToShow]);

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
        {steps && (
          <div className="flex space-x-2">
            <button
              onClick={() => setStepToShow((prev) => prev - 1)}
              type="button"
              className="inline-flex flex-1 justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={stepToShow <= 0}
            >
              Prev
            </button>
            <button
              onClick={() => setStepToShow((prev) => prev + 1)}
              type="button"
              className="inline-flex flex-1 justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={stepToShow >= steps.length - 1}
            >
              Next
            </button>
          </div>
        )}
        {!influencedNodes && !steps ? (
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
              setSteps(null);
              setStepToShow(0);
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
