import type { NodeValue } from '../../types'

/** Class representing a node in a tree structure, which each node has value and children(nodes) saving by key. */
export class Node {
  childrenAsKeyValue: Record<string, Node>
  value?: NodeValue

  /**
   * Create a node.
   */
  constructor(value?: NodeValue) {
    this.value = value
    this.childrenAsKeyValue = {}
  }

  /**
   * Add child to the node.
   */
  addChild(node: Node, key: string) {
    this.childrenAsKeyValue[key] = node
  }

  /**
   * Override node data by other node by reference.
   */
  setData(node: Node) {
    this.value = node.value
    this.childrenAsKeyValue = node.childrenAsKeyValue
  }

  /**
   * Get node value.
   */
  getValue() {
    return this.value
  }
}
