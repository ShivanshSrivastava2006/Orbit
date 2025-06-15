import * as d3 from 'd3-force';

export function simulateGraphLayout({ nodes, edges, width, height, iterations = 300 }) {
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300)) // node repulsion
    .force('center', d3.forceCenter(width / 2, height / 2))
    .stop();

  for (let i = 0; i < iterations; ++i) {
    simulation.tick();
  }

  return nodes.map(n => ({ ...n, x: n.x, y: n.y }));
}