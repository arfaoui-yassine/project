import { useState, useEffect } from 'react';
import { useDbData } from '../hooks/useDbData';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Neo4jGraph from '../components/Neo4jGraph';
import { MySQLLogo, MongoDBLogo, CassandraLogo, Neo4jLogo } from './DbLogos';

const DB_META = {
  mysql:     { label: 'MySQL',     type: 'Relational',  Logo: MySQLLogo },
  mongo:     { label: 'MongoDB',   type: 'Document',    Logo: MongoDBLogo },
  cassandra: { label: 'Cassandra', type: 'Wide-Column', Logo: CassandraLogo },
  neo4j:     { label: 'Neo4j',     type: 'Graph',       Logo: Neo4jLogo },
};

const USER_COLS = [
  { key: 'id', label: 'ID', render: (v) => v?.substring(0, 8) + '…' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];

const CAR_COLS = [
  { key: 'id', label: 'ID', render: (v) => v?.substring(0, 8) + '…' },
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  {
    key: 'available', label: 'Status',
    render: (v) => (
      <span className={`badge-available ${v ? 'yes' : 'no'}`}>
        {v ? '✓ Available' : '✗ Rented'}
      </span>
    ),
  },
];

const RENTAL_COLS = [
  { key: 'id', label: 'ID', render: (v) => v?.substring(0, 8) + '…' },
  { key: 'user_name', label: 'User' },
  { key: 'car_brand', label: 'Car Brand' },
  { key: 'car_model', label: 'Car Model' },
  { key: 'start_date', label: 'Start' },
  { key: 'end_date', label: 'End' },
];

export default function DatabasePanel({ dbKey }) {
  const meta = DB_META[dbKey];
  const { users, cars, rentals, loading, error, refresh, addUser, addCar, addRental, api } = useDbData(dbKey);
  const [tab, setTab] = useState('users');
  const [modal, setModal] = useState(null);
  const [graphData, setGraphData] = useState(null);

  // Load graph data for Neo4j
  useEffect(() => {
    if (dbKey === 'neo4j' && tab === 'graph') {
      api.getGraph().then(setGraphData).catch(() => {});
    }
  }, [dbKey, tab, api, rentals]);

  const tabs = dbKey === 'neo4j'
    ? ['users', 'cars', 'rentals', 'graph']
    : ['users', 'cars', 'rentals'];

  const handleCreate = async (data) => {
    try {
      if (modal === 'user') await addUser(data);
      else if (modal === 'car') await addCar(data);
      else if (modal === 'rental') await addRental(data);
      setModal(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const renderModal = () => {
    if (!modal) return null;

    if (modal === 'user') {
      return (
        <Modal title="Create User" onClose={() => setModal(null)} onSubmit={handleCreate}
          fields={[
            { name: 'name', label: 'Name', placeholder: 'John Doe', required: true },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', required: true },
          ]}
        />
      );
    }

    if (modal === 'car') {
      return (
        <Modal title="Create Car" onClose={() => setModal(null)} onSubmit={handleCreate}
          fields={[
            { name: 'brand', label: 'Brand', placeholder: 'BMW', required: true },
            { name: 'model', label: 'Model', placeholder: 'Serie 3', required: true },
          ]}
        />
      );
    }

    if (modal === 'rental') {
      return (
        <Modal title="Rent a Car" onClose={() => setModal(null)} onSubmit={handleCreate}
          fields={[
            {
              name: 'user_id', label: 'User', type: 'select', required: true,
              options: users.map((u) => ({ value: u.id, label: u.name })),
            },
            {
              name: 'car_id', label: 'Car', type: 'select', required: true,
              options: cars.filter((c) => c.available).map((c) => ({ value: c.id, label: `${c.brand} ${c.model}` })),
            },
            { name: 'start_date', label: 'Start Date', type: 'date', required: true },
            { name: 'end_date', label: 'End Date', type: 'date', required: true },
          ]}
        />
      );
    }
  };

  const Logo = meta.Logo;

  return (
    <div className="db-panel" data-db={dbKey}>
      {/* Header */}
      <div className="panel-header">
        <div className="db-logo-wrap">
          <Logo size={32} />
        </div>
        <div>
          <h2>{meta.label}</h2>
          <span className="db-type">{meta.type}</span>
        </div>
        <div className="panel-stats">
          <span className="stat-badge"><strong>{users.length}</strong>Users</span>
          <span className="stat-badge"><strong>{cars.length}</strong>Cars</span>
          <span className="stat-badge"><strong>{rentals.length}</strong>Rentals</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        {tabs.map((t) => (
          <button key={t} className={`panel-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}>
            {t === 'graph' ? '🔗 Graph' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      {tab !== 'graph' && (
        <div className="action-bar">
          {tab === 'users' && <button className="btn-action" onClick={() => setModal('user')}>+ User</button>}
          {tab === 'cars' && <button className="btn-action" onClick={() => setModal('car')}>+ Car</button>}
          {tab === 'rentals' && <button className="btn-action" onClick={() => setModal('rental')}>+ Rental</button>}
          <button className="btn-action" onClick={refresh} style={{ marginLeft: 'auto' }}>↻ Refresh</button>
        </div>
      )}

      {/* Content */}
      <div className="panel-content">
        {loading ? (
          <div className="empty-state"><span className="loading-spinner"></span><span>Loading...</span></div>
        ) : error ? (
          <div className="empty-state"><span className="icon">⚠️</span><span>{error}</span></div>
        ) : (
          <>
            {tab === 'users' && <DataTable columns={USER_COLS} data={users} emptyText="No users yet" />}
            {tab === 'cars' && <DataTable columns={CAR_COLS} data={cars} emptyText="No cars yet" />}
            {tab === 'rentals' && <DataTable columns={RENTAL_COLS} data={rentals} emptyText="No rentals yet" />}
            {tab === 'graph' && <Neo4jGraph graphData={graphData} />}
          </>
        )}
      </div>

      {renderModal()}
    </div>
  );
}
