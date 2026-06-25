
// Bank Transfer Configuration
const BANK_CONFIG = {
    bankName: 'Your Bank Name',
    accountHolder: 'Ormidia Car Accessories',
    accountNumber: '1234567890',
    iban: 'GB1234567890123456',
    swiftCode: 'SWIFT123',
    branch: 'Main Branch',
    currency: 'EUR'
};

// Helper function to generate order number
function generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
}

const express = require('express');
const { Client } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '1234',
  database: 'ormidia_products'
};

app.use(express.json());
app.use(express.static(__dirname));

// Helper function to get database connection
async function getDb() {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
}

// API: Get all tables
app.get('/api/tables', async (req, res) => {
  let client;
  try {
    client = await getDb();
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    await client.end();
    res.json({ tables: result.rows.map(r => r.tablename) });
  } catch (err) {
    if (client) await client.end();
    res.status(500).json({ error: err.message });
  }
});

// API: Get table data
app.get('/api/data/:tableName', async (req, res) => {
  const { tableName } = req.params;
  let client;
  try {
    client = await getDb();
    
    // Get columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
    
    // Get data
    const dataResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 100`);
    
    await client.end();
    res.json({
      columns: columnsResult.rows,
      rows: dataResult.rows,
      count: dataResult.rowCount
    });
  } catch (err) {
    if (client) await client.end();
    res.status(500).json({ error: err.message });
  }
});

// API: Insert row
app.post('/api/data/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const { row } = req.body;
  let client;
  
  try {
    client = await getDb();
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) 
                 VALUES (${placeholders}) RETURNING *`;
    const result = await client.query(sql, values);
    await client.end();
    res.json({ success: true, row: result.rows[0] });
  } catch (err) {
    if (client) await client.end();
    res.status(500).json({ error: err.message });
  }
});

// API: Update row
app.put('/api/data/:tableName/:id', async (req, res) => {
  const { tableName, id } = req.params;
  const { row, idColumn } = req.body;
  let client;
  
  try {
    client = await getDb();
    const setClause = Object.keys(row)
      .map((col, i) => `"${col}" = $${i + 1}`)
      .join(', ');
    const values = [...Object.values(row), id];
    
    const sql = `UPDATE "${tableName}" SET ${setClause} WHERE "${idColumn}" = $${values.length}`;
    await client.query(sql, values);
    await client.end();
    res.json({ success: true });
  } catch (err) {
    if (client) await client.end();
    res.status(500).json({ error: err.message });
  }
});

// API: Delete row
app.delete('/api/data/:tableName/:id', async (req, res) => {
  const { tableName, id } = req.params;
  const { idColumn } = req.body;
  let client;
  
  try {
    client = await getDb();
    await client.query(`DELETE FROM "${tableName}" WHERE "${idColumn}" = $1`, [id]);
    await client.end();
    res.json({ success: true });
  } catch (err) {
    if (client) await client.end();
    res.status(500).json({ error: err.message });
  }
});

// API: Execute custom SQL
app.post('/api/query', async (req, res) => {
  const { sql } = req.body;
  let client;
  
  try {
    client = await getDb();
    const result = await client.query(sql);
    await client.end();
    res.json({ 
      success: true, 
      rows: result.rows, 
      rowCount: result.rowCount 
    });
  } catch (err) {
    if (client) await client.end();
    res.status(500).json({ error: err.message });
  }
});

// Serve the admin page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-simple.html'));
});

app.listen(port, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`✅ Admin Panel Running!`);
  console.log(`🌐 Open: http://localhost:${port}`);
  console.log(`💾 Database: ormidia_products`);
  console.log(`========================================\n`);
});
