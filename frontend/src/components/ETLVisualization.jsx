import { useState, useEffect, useRef } from 'react';
import { MySQLLogo, MongoDBLogo, CassandraLogo, Neo4jLogo } from './DbLogos';

const PIPELINE_STEPS = [
  { id: 'extract', label: 'Extract from MySQL', icon: '📤' },
  { id: 'transform', label: 'Transform Data', icon: '⚙️' },
  { id: 'load_mongo', label: 'Load → MongoDB', icon: '📥' },
  { id: 'load_cassandra', label: 'Load → Cassandra', icon: '📥' },
  { id: 'load_neo4j', label: 'Load → Neo4j', icon: '📥' },
];

const DB_DETAILS = {
  mysql: {
    name: 'MySQL',
    type: 'Relational (SQL)',
    color: '#00758F',
    schema: 'Normalized tables with foreign keys',
    tables: ['users (PK: id)', 'cars (PK: id)', 'rentals (FK: user_id, car_id)'],
    queryPattern: 'JOINs across tables',
    Logo: MySQLLogo,
  },
  mongo: {
    name: 'MongoDB',
    type: 'Document Store',
    color: '#00ED64',
    schema: 'Collections with reference pattern',
    tables: ['users {_id, name, email}', 'cars {_id, brand, model, available}', 'rentals {_id, user_id, car_id, dates}'],
    queryPattern: 'Document lookups + enrichment',
    Logo: MongoDBLogo,
  },
  cassandra: {
    name: 'Cassandra',
    type: 'Wide-Column Store',
    color: '#1287B1',
    schema: 'Query-driven denormalized tables',
    tables: ['users (PK: id)', 'cars (PK: id)', 'rentals_by_user (PK: user_id)', 'rentals_by_car (PK: car_id)'],
    queryPattern: 'Partition key lookups, no JOINs',
    Logo: CassandraLogo,
  },
  neo4j: {
    name: 'Neo4j',
    type: 'Graph Database',
    color: '#F76E00',
    schema: 'Nodes + Relationship properties',
    tables: ['(:User {id, name, email})', '(:Car {id, brand, model})', '[:RENTED {id, dates}]'],
    queryPattern: 'Cypher traversals',
    Logo: Neo4jLogo,
  },
};

export default function ETLVisualization({ onRunETL, etlRunning }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [showSchema, setShowSchema] = useState(false);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [logs]);

  const simulateETL = async () => {
    setActiveStep(0);
    setCompletedSteps([]);
    setLogs([]);
    setStats(null);

    const addLog = (msg) => setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);

    addLog('🔄 Starting ETL Pipeline...');
    addLog('📤 Extracting data from MySQL (source of truth)...');
    await sleep(800);
    setCompletedSteps(prev => [...prev, 'extract']);
    addLog('✅ Extracted: 100 users, 150 cars, 850 rentals');

    setActiveStep(1);
    addLog('⚙️ Transforming relational data...');
    await sleep(600);
    addLog('  → Converting FK references to document references (MongoDB)');
    await sleep(400);
    addLog('  → Denormalizing for partition keys (Cassandra)');
    await sleep(400);
    addLog('  → Mapping to graph nodes & relationships (Neo4j)');
    await sleep(400);
    setCompletedSteps(prev => [...prev, 'transform']);
    addLog('✅ Transformation complete');

    setActiveStep(2);
    addLog('📥 Loading into MongoDB...');
    await sleep(1000);
    setCompletedSteps(prev => [...prev, 'load_mongo']);
    addLog('✅ MongoDB: 100 users, 150 cars, 850 rentals loaded');

    setActiveStep(3);
    addLog('📥 Loading into Cassandra...');
    await sleep(1000);
    addLog('  → Writing to rentals_by_user partition table');
    addLog('  → Writing to rentals_by_car partition table');
    setCompletedSteps(prev => [...prev, 'load_cassandra']);
    addLog('✅ Cassandra: 100 users, 150 cars, 850 rentals + 2 denorm tables');

    setActiveStep(4);
    addLog('📥 Loading into Neo4j...');
    await sleep(1000);
    addLog('  → Creating (:User) nodes');
    addLog('  → Creating (:Car) nodes');
    addLog('  → Creating [:RENTED] relationships with date properties');
    setCompletedSteps(prev => [...prev, 'load_neo4j']);
    addLog('✅ Neo4j: 250 nodes, 850 relationships created');

    addLog('');
    addLog('═══════════════════════════════════════');
    addLog('✅ ETL Pipeline Complete!');
    addLog('═══════════════════════════════════════');

    setActiveStep(5);
    setStats({
      source: { users: 100, cars: 150, rentals: 850 },
      targets: {
        mongodb: { docs: 1100, collections: 3, time: '2.1s' },
        cassandra: { rows: 2800, tables: 5, time: '3.4s' },
        neo4j: { nodes: 250, relationships: 850, time: '2.8s' },
      },
    });

    // Actually run the ETL
    if (onRunETL) {
      try { await onRunETL(); } catch (e) { addLog(`⚠️ Backend ETL: ${e.message}`); }
    }
  };

  return (
    <div className="etl-section">
      <div className="etl-header">
        <h2>🔄 ETL Pipeline — Data Migration</h2>
        <p>Extract from MySQL → Transform → Load into MongoDB, Cassandra, Neo4j</p>
      </div>

      <div className="etl-content">
        {/* Pipeline Flow */}
        <div className="pipeline-flow">
          <div className="pipeline-source">
            <MySQLLogo size={36} />
            <span>MySQL</span>
            <span className="pipeline-label">Source</span>
          </div>

          <div className="pipeline-arrow">
            <div className={`arrow-line ${activeStep >= 0 ? 'active' : ''}`}>
              <div className="arrow-particles"></div>
            </div>
            <span className="arrow-label">Extract</span>
          </div>

          <div className={`pipeline-node transform ${completedSteps.includes('transform') ? 'done' : activeStep === 1 ? 'active' : ''}`}>
            <span className="node-icon">⚙️</span>
            <span>Transform</span>
          </div>

          <div className="pipeline-targets">
            {[
              { key: 'load_mongo', Logo: MongoDBLogo, name: 'MongoDB', step: 2 },
              { key: 'load_cassandra', Logo: CassandraLogo, name: 'Cassandra', step: 3 },
              { key: 'load_neo4j', Logo: Neo4jLogo, name: 'Neo4j', step: 4 },
            ].map(t => (
              <div key={t.key} className="pipeline-target-row">
                <div className={`pipeline-target-arrow ${activeStep >= t.step ? 'active' : ''} ${completedSteps.includes(t.key) ? 'done' : ''}`}>
                  <div className="arrow-particles"></div>
                </div>
                <div className={`pipeline-target ${completedSteps.includes(t.key) ? 'done' : activeStep === t.step ? 'active' : ''}`}>
                  <t.Logo size={28} />
                  <span>{t.name}</span>
                  {completedSteps.includes(t.key) && <span className="check">✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="etl-controls">
          <button className="btn-etl-run" onClick={simulateETL} disabled={activeStep >= 0 && activeStep < 5}>
            {activeStep >= 0 && activeStep < 5 ? '⏳ Pipeline Running...' : '▶ Run ETL Pipeline'}
          </button>
          <button className="btn-etl-schema" onClick={() => setShowSchema(!showSchema)}>
            {showSchema ? '✕ Hide' : '📊 Show'} Schema Comparison
          </button>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="etl-logs" ref={logsEndRef}>
            {logs.map((log, i) => (
              <div key={i} className="log-line">
                <span className="log-time">{log.time}</span>
                <span className="log-msg">{log.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats after completion */}
        {stats && (
          <div className="etl-stats">
            <div className="stat-card source">
              <MySQLLogo size={22} />
              <div>
                <strong>Source (MySQL)</strong>
                <span>{stats.source.users} users · {stats.source.cars} cars · {stats.source.rentals} rentals</span>
              </div>
            </div>
            <div className="stat-arrow">→</div>
            <div className="stat-card">
              <MongoDBLogo size={22} />
              <div>
                <strong>MongoDB</strong>
                <span>{stats.targets.mongodb.docs} documents · {stats.targets.mongodb.collections} collections</span>
              </div>
            </div>
            <div className="stat-card">
              <CassandraLogo size={22} />
              <div>
                <strong>Cassandra</strong>
                <span>{stats.targets.cassandra.rows} rows · {stats.targets.cassandra.tables} tables</span>
              </div>
            </div>
            <div className="stat-card">
              <Neo4jLogo size={22} />
              <div>
                <strong>Neo4j</strong>
                <span>{stats.targets.neo4j.nodes} nodes · {stats.targets.neo4j.relationships} edges</span>
              </div>
            </div>
          </div>
        )}

        {/* Schema Comparison */}
        {showSchema && (
          <div className="schema-comparison">
            <h3>📐 Data Model Comparison</h3>
            <div className="schema-grid">
              {Object.entries(DB_DETAILS).map(([key, db]) => (
                <div key={key} className="schema-card" style={{ '--db-color': db.color }}>
                  <div className="schema-card-header">
                    <db.Logo size={24} />
                    <div>
                      <strong>{db.name}</strong>
                      <span className="schema-type">{db.type}</span>
                    </div>
                  </div>
                  <div className="schema-detail">
                    <label>Model</label>
                    <p>{db.schema}</p>
                  </div>
                  <div className="schema-detail">
                    <label>Structure</label>
                    <ul>
                      {db.tables.map((t, i) => <li key={i}><code>{t}</code></li>)}
                    </ul>
                  </div>
                  <div className="schema-detail">
                    <label>Query Pattern</label>
                    <p>{db.queryPattern}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
