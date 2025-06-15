// utils/forceLayout.js
import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force';

export function computeForceLayout(nodes, edges, width, height) {
  return new Promise((resolve) => {
    const simulation = forceSimulation(nodes.map(n => ({ ...n })))
      .force("charge", forceManyBody().strength(-250))
      .force("center", forceCenter(width / 2, height / 2))
      .force("link", forceLink(edges).id(d => d.id).distance(120).strength(0.7))
      .alpha(1)
      .alphaDecay(0.02)
      .velocityDecay(0.3)
      .on("end", () => resolve(simulation.nodes()));
  });
}