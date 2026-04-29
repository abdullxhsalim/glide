/**
 * Singleton Pattern - Database Connection Manager
 * Ensures a single instance of database connection across the application
 */
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    this.connection = null;
    this.isConnected = false;
    this.connectionConfig = {
      host: process.env.MONGODB_HOST || 'localhost',
      port: process.env.MONGODB_PORT || 27017,
      database: process.env.MONGODB_DB || 'glide',
      options: {
        maxPoolSize: 10,
        minPoolSize: 2,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000
      }
    };
    DatabaseConnection.instance = this;
  }

  static getInstance() {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  getConnection() {
    return this.connection;
  }

  setConnection(mongooseConnection) {
    this.connection = mongooseConnection;
    this.isConnected = true;
  }

  isConnected() {
    return this.isConnected;
  }

  getConfig() {
    return { ...this.connectionConfig };
  }

  // Simulate connection health check
  healthCheck() {
    return {
      status: this.isConnected ? 'healthy' : 'disconnected',
      timestamp: new Date().toISOString(),
      config: {
        host: this.connectionConfig.host,
        port: this.connectionConfig.port,
        database: this.connectionConfig.database
      }
    };
  }
}

module.exports = DatabaseConnection.getInstance();