import { useState } from 'react';
import DatabasePanel from './components/DatabasePanel';
import ETLVisualization from './components/ETLVisualization';
import { MySQLLogo, MongoDBLogo, CassandraLogo, Neo4jLogo, CarIcon } from './components/DbLogos';
import { seedAll, runETL, healthCheck } from './api/client';
import './index.css';

export default function App() {
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'etl'

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSeedAll = async () => {
    setBusy(true);
    try {
      await seedAll();
      showToast('All databases seeded with 1000+ records!');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleETL = async () => {
    setBusy(true);
    try {
      await runETL();
      showToast('ETL pipeline completed successfully!');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleHealth = async () => {
    try {
      const data = await healthCheck();
      const dbs = Object.entries(data.databases)
        .map(([k, v]) => `${k}: ${v ? '✓' : '✗'}`)
        .join('  |  ');
      showToast(`Health: ${dbs}`);
    } catch (e) {
      showToast('Backend unreachable', 'error');
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-brand">
          <CarIcon size={28} />
          <div>
            <h1>Polyglot Car Rental</h1>
            <p>Same data — Four databases — Side by side</p>
          </div>
        </div>
        <div className="header-nav">
          <button
            className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-tab ${view === 'etl' ? 'active' : ''}`}
            onClick={() => setView('etl')}
          >
            🔄 ETL Pipeline
          </button>
        </div>
        <div className="header-actions">
          <button className="btn-global" onClick={handleHealth}>♥ Health</button>
          <button className="btn-global btn-seed" onClick={handleSeedAll} disabled={busy}>
            {busy ? '⏳ Working...' : '🌱 Seed All'}
          </button>
        </div>
        <div className="header-db-badges">
          <span className="db-badge mysql"><MySQLLogo size={18} /> MySQL</span>
          <span className="db-badge mongo"><MongoDBLogo size={18} /> MongoDB</span>
          <span className="db-badge cassandra"><CassandraLogo size={18} /> Cassandra</span>
          <span className="db-badge neo4j"><Neo4jLogo size={18} /> Neo4j</span>
        </div>
      </header>

      {view === 'dashboard' ? (
        <main className="dashboard-grid">
          <DatabasePanel dbKey="mysql" />
          <DatabasePanel dbKey="mongo" />
          <DatabasePanel dbKey="cassandra" />
          <DatabasePanel dbKey="neo4j" />
        </main>
      ) : (
        <main className="etl-main">
          <ETLVisualization onRunETL={handleETL} etlRunning={busy} />
        </main>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
