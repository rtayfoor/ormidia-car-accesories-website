// ============ BANK TRANSFER PAYMENT ROUTES ============

// Get bank transfer details for an order
app.get('/api/bank-transfer/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const supabase = getSupabaseClient();

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError) throw orderError;

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get or create bank transfer details
        let { data: transfer, error: transferError } = await supabase
            .from('bank_transfers')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (transferError && transferError.code === 'PGRST116') {
            // No transfer record exists, create one
            const newTransfer = {
                order_id: orderId,
                bank_name: BANK_CONFIG.bankName,
                account_holder: BANK_CONFIG.accountHolder,
                account_number: BANK_CONFIG.accountNumber,
                reference_number: `REF-${order.order_number}`,
                amount: order.total_amount,
                status: 'pending'
            };

            const { data: newData, error: createError } = await supabase
                .from('bank_transfers')
                .insert([newTransfer])
                .select()
                .single();

            if (createError) throw createError;
            transfer = newData;
        } else if (transferError) {
            throw transferError;
        }

        // Add bank config to response
        const response = {
            ...transfer,
            bankDetails: {
                bankName: BANK_CONFIG.bankName,
                accountHolder: BANK_CONFIG.accountHolder,
                accountNumber: BANK_CONFIG.accountNumber,
                iban: BANK_CONFIG.iban,
                swiftCode: BANK_CONFIG.swiftCode,
                branch: BANK_CONFIG.branch,
                currency: BANK_CONFIG.currency
            },
            orderDetails: {
                orderNumber: order.order_number,
                totalAmount: order.total_amount,
                createdDate: order.created_at
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching bank transfer details:', error);
        res.status(500).json({ error: 'Failed to fetch bank transfer details' });
    }
});

// Confirm bank transfer (customer submits proof)
app.post('/api/bank-transfer/confirm', async (req, res) => {
    try {
        const { orderId, transferDate, referenceNumber, notes } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const supabase = getSupabaseClient();

        // Update bank transfer record
        const { data: transfer, error: updateError } = await supabase
            .from('bank_transfers')
            .update({
                transfer_date: transferDate || new Date(),
                reference_number: referenceNumber,
                status: 'confirmed',
                notes: notes
            })
            .eq('order_id', orderId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Update order payment status
        const { error: orderError } = await supabase
            .from('orders')
            .update({
                payment_status: 'pending_verification',
                updated_at: new Date()
            })
            .eq('id', orderId);

        if (orderError) throw orderError;

        res.json({
            success: true,
            message: 'Bank transfer confirmed successfully',
            transfer: transfer
        });
    } catch (error) {
        console.error('Error confirming bank transfer:', error);
        res.status(500).json({ error: 'Failed to confirm bank transfer' });
    }
});

// Admin: Verify bank transfer
app.post('/api/admin/bank-transfer/verify', async (req, res) => {
    try {
        const { orderId, status, notes } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ error: 'Order ID and status are required' });
        }

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be "verified" or "rejected"' });
        }

        const supabase = getSupabaseClient();

        // Update bank transfer status
        const { data: transfer, error: updateError } = await supabase
            .from('bank_transfers')
            .update({
                status: status,
                verified_at: new Date(),
                notes: notes || null
            })
            .eq('order_id', orderId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Update order status
        const orderStatus = status === 'verified' ? 'confirmed' : 'payment_failed';
        const paymentStatus = status === 'verified' ? 'completed' : 'rejected';

        const { error: orderError } = await supabase
            .from('orders')
            .update({
                status: orderStatus,
                payment_status: paymentStatus,
                updated_at: new Date()
            })
            .eq('id', orderId);

        if (orderError) throw orderError;

        res.json({
            success: true,
            message: `Bank transfer ${status} successfully`,
            transfer: transfer
        });
    } catch (error) {
        console.error('Error verifying bank transfer:', error);
        res.status(500).json({ error: 'Failed to verify bank transfer' });
    }
});

// Admin: Get all pending bank transfers
app.get('/api/admin/bank-transfer/pending', async (req, res) => {
    try {
        const supabase = getSupabaseClient();

        const { data: transfers, error } = await supabase
            .from('bank_transfers')
            .select(`
                *,
                orders (
                    id,
                    order_number,
                    user_id,
                    total_amount,
                    shipping_address,
                    created_at
                )
            `)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(transfers);
    } catch (error) {
        console.error('Error fetching pending transfers:', error);
        res.status(500).json({ error: 'Failed to fetch pending transfers' });
    }
});
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
