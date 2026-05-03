/**
 * Database logo SVG components.
 * Official-style logos for MySQL, MongoDB, Cassandra, Neo4j.
 */

export function MySQLLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#00758F"/>
      <path d="M8 22V10h2.5l3 8 3-8H19v12h-2v-9l-3 9h-1l-3-9v9H8z" fill="white"/>
      <path d="M21 17.5c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5v2c0 1.5-1 2.5-2.5 2.5S21 21 21 19.5v-2zm2 0v2c0 .5.2.8.5.8s.5-.3.5-.8v-2c0-.5-.2-.8-.5-.8s-.5.3-.5.8z" fill="white" opacity="0.7"/>
    </svg>
  );
}

export function MongoDBLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#023430"/>
      <path d="M16.3 5c.3 1.5.8 2.8 1.8 3.9 1.2 1.3 2.4 2.7 3.3 4.3 1.8 3.2 1.2 7.5-1.5 10-1.3 1.2-2.8 1.9-4.5 2.1v0c-.1-.5-.2-1-.2-1.5 0-.3 0-.6-.1-.9-.1-.3-.3-.3-.5-.1-.5.4-.8 1-1 1.6l-.2.8c-3.3-1.2-5.2-3.7-5.6-7.2-.3-2.3.4-4.4 1.6-6.3.9-1.4 2-2.6 3.1-3.8.6-.7 1.1-1.5 1.5-2.3.1-.2.2-.4.3-.6z" fill="#00ED64"/>
      <path d="M16.3 5c-.1.2-.2.3-.3.5-.4.9-.9 1.6-1.5 2.3l-.3.3c.1-.1.3-.1.4 0 .3.2.4.5.4.8v15.5c0 .3 0 .5-.1.8.3-.1.4-.3.5-.5V5.3c0-.1 0-.2-.1-.3z" fill="#12924F" opacity="0.5"/>
    </svg>
  );
}

export function CassandraLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#1287B1"/>
      <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="1.5" fill="none"/>
      <ellipse cx="16" cy="16" rx="8" ry="3" stroke="white" strokeWidth="1.2" fill="none"/>
      <ellipse cx="16" cy="16" rx="3" ry="8" stroke="white" strokeWidth="1.2" fill="none"/>
      <circle cx="16" cy="16" r="1.5" fill="white"/>
      <circle cx="16" cy="8" r="1.2" fill="white" opacity="0.8"/>
      <circle cx="16" cy="24" r="1.2" fill="white" opacity="0.8"/>
      <circle cx="8" cy="16" r="1.2" fill="white" opacity="0.8"/>
      <circle cx="24" cy="16" r="1.2" fill="white" opacity="0.8"/>
    </svg>
  );
}

export function Neo4jLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#1A1A2E"/>
      <circle cx="10" cy="12" r="3.5" fill="#F76E00" opacity="0.9"/>
      <circle cx="22" cy="10" r="3" fill="#018BFF" opacity="0.9"/>
      <circle cx="16" cy="23" r="3.5" fill="#00ED64" opacity="0.9"/>
      <line x1="13" y1="12" x2="19" y2="10" stroke="white" strokeWidth="1.2" opacity="0.6"/>
      <line x1="11" y1="15" x2="14" y2="21" stroke="white" strokeWidth="1.2" opacity="0.6"/>
      <line x1="20" y1="13" x2="18" y2="20" stroke="white" strokeWidth="1.2" opacity="0.6"/>
    </svg>
  );
}

export function CarIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-5l-2-5H7l-2 5v5z"/>
      <circle cx="7.5" cy="17.5" r="1.5"/>
      <circle cx="16.5" cy="17.5" r="1.5"/>
      <path d="M3 12h18"/>
    </svg>
  );
}

export function DatabaseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
    </svg>
  );
}
