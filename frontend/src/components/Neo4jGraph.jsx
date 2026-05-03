import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const GRAPH_OPTIONS = {
  groups: {
    User: {
      color: { background: '#8b5cf6', border: '#7c3aed', highlight: { background: '#a78bfa', border: '#7c3aed' } },
      font: { color: '#f1f5f9', size: 11 },
    },
    Car: {
      color: { background: '#f97316', border: '#ea580c', highlight: { background: '#fb923c', border: '#ea580c' } },
      font: { color: '#f1f5f9', size: 10 },
    },
  },
  edges: {
    color: { color: '#475569', highlight: '#94a3b8' },
    font: { color: '#64748b', size: 9, strokeWidth: 0 },
    smooth: { type: 'continuous' },
    width: 1.5,
  },
  physics: {
    solver: 'forceAtlas2Based',
    forceAtlas2Based: { gravitationalConstant: -40, centralGravity: 0.008, springLength: 140 },
    stabilization: { iterations: 100 },
  },
  interaction: { hover: true, tooltipDelay: 100, zoomView: true, dragView: true },
  layout: { improvedLayout: true },
};

function buildDataSets(graphData) {
  const nodes = new DataSet(
    graphData.nodes.map((n) => ({
      id: n.id,
      label: n.type === 'User' ? n.name : `${n.brand} ${n.model}`,
      group: n.type,
      shape: n.type === 'User' ? 'dot' : 'box',
      size: n.type === 'User' ? 20 : 16,
      title: n.type === 'User'
        ? `👤 ${n.name}\n✉️ ${n.email}`
        : `🚗 ${n.brand} ${n.model}\n${n.available ? '✅ Available' : '❌ Rented'}`,
    }))
  );
  const edges = new DataSet(
    graphData.edges.map((e, i) => ({
      id: `edge-${i}`,
      from: e.from,
      to: e.to,
      label: 'RENTED',
      title: `📅 ${e.start_date} → ${e.end_date}`,
      arrows: 'to',
    }))
  );
  return { nodes, edges };
}

/** Small inline graph inside the panel */
function InlineGraph({ graphData, onExpand }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;
    if (networkRef.current) networkRef.current.destroy();
    networkRef.current = new Network(containerRef.current, buildDataSets(graphData), GRAPH_OPTIONS);
    return () => { if (networkRef.current) { networkRef.current.destroy(); networkRef.current = null; } };
  }, [graphData]);

  const nodeCount = graphData?.nodes?.length || 0;
  const edgeCount = graphData?.edges?.length || 0;

  return (
    <div className="graph-inline-wrap">
      <div className="graph-toolbar">
        <span className="graph-info">{nodeCount} nodes · {edgeCount} edges</span>
        <button className="btn-graph-expand" onClick={onExpand}>⛶ Expand</button>
      </div>
      <div ref={containerRef} className="graph-container" />
    </div>
  );
}

/** Fullscreen graph overlay — rendered via Portal to escape overflow:hidden */
function ExpandedGraph({ graphData, onClose }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;
    if (networkRef.current) networkRef.current.destroy();
    networkRef.current = new Network(containerRef.current, buildDataSets(graphData), GRAPH_OPTIONS);
    // Fit after stabilization
    networkRef.current.once('stabilizationIterationsDone', () => {
      networkRef.current.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    });
    return () => { if (networkRef.current) { networkRef.current.destroy(); networkRef.current = null; } };
  }, [graphData]);

  const userCount = graphData.nodes.filter(n => n.type === 'User').length;
  const carCount = graphData.nodes.filter(n => n.type === 'Car').length;
  const edgeCount = graphData.edges.length;

  // Handle Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div className="graph-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="graph-expanded">
        <div className="graph-expanded-header">
          <div className="graph-title">
            <span className="graph-title-icon">🔗</span>
            <div>
              <h3>Neo4j — Graph Visualization</h3>
              <p>{userCount} Users · {carCount} Cars · {edgeCount} Rentals</p>
            </div>
          </div>
          <div className="graph-legend">
            <span className="legend-item"><span className="legend-dot user"></span> User Node</span>
            <span className="legend-item"><span className="legend-box car"></span> Car Node</span>
            <span className="legend-item"><span className="legend-line"></span> RENTED</span>
          </div>
          <button className="btn-graph-close" onClick={onClose}>✕ Close</button>
        </div>
        <div ref={containerRef} className="graph-container graph-fullscreen" />
      </div>
    </div>,
    document.body
  );
}

export default function Neo4jGraph({ graphData }) {
  const [expanded, setExpanded] = useState(false);

  if (!graphData || (!graphData.nodes.length && !graphData.edges.length)) {
    return (
      <div className="empty-state">
        <span className="icon">🕸️</span>
        <span>No graph data — create users, cars & rentals first</span>
      </div>
    );
  }

  return (
    <>
      <InlineGraph graphData={graphData} onExpand={() => setExpanded(true)} />
      {expanded && <ExpandedGraph graphData={graphData} onClose={() => setExpanded(false)} />}
    </>
  );
}
