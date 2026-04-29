const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "elearning_db",
  password: "harsha1810",
  port: 5432,
});

module.exports = pool;