require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 8080,

  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'carrental',
  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    database: process.env.MONGO_DATABASE || 'carrental',
  },

  cassandra: {
    host: process.env.CASSANDRA_HOST || 'localhost',
    port: parseInt(process.env.CASSANDRA_PORT || '9042', 10),
    keyspace: process.env.CASSANDRA_KEYSPACE || 'carrental',
  },

  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password123',
  },
};

module.exports = config;
