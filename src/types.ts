import { CameraState, MouseCoords } from "sigma/types";
import { NodeKey } from "graphology-types";

interface MouseEvent {
  event: MouseCoords;
}

interface NodeEvent {
  node: NodeKey;
}

type NodeClicked = MouseEvent & NodeEvent;

export interface EventHandlers {
  /**
   * Trigger when the user click on a node
   */
  clickNode: ({ node, event }: NodeClicked) => void;
  /**
   * Trigger when the user right click on a node
   */
  rightClickNode: ({ node, event }: NodeClicked) => void;
  /**
   * Trigger when the user click/tap on a node
   */
  downNode: ({ node, event }: NodeClicked) => void;
  /**
   * Trigger when the user enter a node with the mouse
   */
  enterNode: ({ node }: NodeEvent) => void;
  /**
   * Trigger when the user leave a node.with the mouse
   */
  leaveNode: ({ node }: NodeEvent) => void;
  /**
   * Trigger when the user click on the background
   */
  clickStage: ({ event }: MouseEvent) => void;
  /**
   * Trigger when the user right click on the background
   */
  rightClickStage: ({ event }: MouseEvent) => void;
  /**
   * Trigger when the user click/tap on the background
   */
  downStage: ({ event }: MouseEvent) => void;
  /**
   * Trigger when sigma is killed
   */
  kill: () => void;
  /**
   * Trigger when the sigma's camera changes
   */
  cameraUpdated: (e: CameraState) => void;
}
