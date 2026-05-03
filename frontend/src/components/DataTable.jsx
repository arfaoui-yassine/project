export default function DataTable({ columns, data, emptyText }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <span className="icon">📭</span>
        <span>{emptyText || 'No data yet'}</span>
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={row.id || idx}>
            {columns.map((col) => (
              <td key={col.key} title={String(row[col.key] ?? '')}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
