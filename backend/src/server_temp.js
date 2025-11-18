const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

// Import database connection
const { query } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');

// Import authentication middleware
const { authenticate, enforceTenancy } = require('./middlewares/authMiddleware');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - More relaxed for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute (very generous for dev)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Only apply to routes that need it in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Catat Jasamu API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Docker health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await query('SELECT 1');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: 'up'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: 'down'
      },
      error: error.message
    });
  }
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Catat Jasamu API',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      bookings: '/api/bookings',
      clients: '/api/clients',
      services: '/api/services',
    }
  });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount admin routes
app.use('/api/admin', adminRoutes);

// Real endpoints with database
app.get('/api/user/dashboard/stats', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id; // Get from authenticated user
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_booking,
        COUNT(*) FILTER (WHERE status = 'confirmed') as scheduled,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM bookings
      WHERE user_id = $1
    `;
    
    const paymentQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'unpaid') as unpaid,
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'partial') as down_payment,
        COUNT(*) FILTER (WHERE COALESCE(p.payment_status, 'unpaid') = 'paid') as paid
      FROM bookings b
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.user_id = $1
    `;
    
    const stats = await query(statsQuery, [userId]);
    const payments = await query(paymentQuery, [userId]);
    
    res.json({
      success: true,
      data: {
        totalBooking: parseInt(stats.rows[0].total_booking),
        scheduled: parseInt(stats.rows[0].scheduled),
        completed: parseInt(stats.rows[0].completed),
        cancelled: parseInt(stats.rows[0].cancelled),
        unpaid: parseInt(payments.rows[0].unpaid),
        downPayment: parseInt(payments.rows[0].down_payment),
        paid: parseInt(payments.rows[0].paid)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

app.get('/api/user/bookings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // Get filter parameters
    const statusFilter = req.query.status; // 'confirmed', 'completed', 'cancelled'
    const paymentFilter = req.query.payment_status; // 'unpaid', 'partial', 'paid'
    
    // Build WHERE conditions dynamically
    let whereConditions = ['b.user_id = $1'];
    let queryParams = [userId];
    let paramIndex = 2;
    
    if (statusFilter) {
      whereConditions.push(`b.status = $${paramIndex}`);
      queryParams.push(statusFilter);
      paramIndex++;
    }
    
    if (paymentFilter) {
      whereConditions.push(`COALESCE(p.payment_status, 'unpaid') = $${paramIndex}`);
      queryParams.push(paymentFilter);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const bookingsQuery = `
      SELECT 
        b.id,
        b.service_id,
        c.name as client_name,
        c.phone as contact,
        s.name as service_name,
        to_char(b.booking_date, 'YYYY-MM-DD') as booking_date,
        to_char(b.booking_time, 'HH24:MI:SS') as booking_time,
        b.location_name,
        b.location_map_url,
        b.status,
        b.total_price as total_amount,
        b.notes,
        COALESCE(p.payment_status, 'unpaid') as payment_status,
        COALESCE(p.amount, 0) as amount_paid
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN services s ON b.service_id = s.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC, b.booking_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE ${whereClause}
    `;
    
    // Add LIMIT and OFFSET params
    queryParams.push(pageSize, offset);
    
    const bookings = await query(bookingsQuery, queryParams);
    
    // Parse booking details from notes if JSON format
    const parsedBookings = bookings.rows.map(booking => {
      let bookingDetails = null;
      try {
        if (booking.notes && booking.notes.trim().startsWith('{')) {
          bookingDetails = JSON.parse(booking.notes);
        }
      } catch (parseError) {
        console.log('Notes is not JSON format for booking', booking.id);
      }
      
      return {
        ...booking,
        booking_details: bookingDetails
      };
    });
    
    // For count query, use same params but without LIMIT/OFFSET
    const countParams = queryParams.slice(0, -2);
    const count = await query(countQuery, countParams);
    
    const total = parseInt(count.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);
    
    res.json({
      success: true,
      data: {
        bookings: parsedBookings.map(booking => ({
          id: booking.id,
          service_id: booking.service_id,
          client_name: booking.client_name,
          contact: booking.contact,
          services: [booking.service_name],
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          location_name: booking.location_name,
          location_map_url: booking.location_map_url,
          status: booking.status,
          payment_status: booking.payment_status,
          total_amount: parseFloat(booking.total_amount || booking.total_price),
          amount_paid: parseFloat(booking.amount_paid),
          notes: booking.notes,
          booking_details: booking.booking_details
        })),
        total,
        totalPages,
        currentPage: page,
        pageSize
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

app.get('/api/user/services', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const servicesQuery = `
      SELECT id, name, price as default_price, description, category, duration
      FROM services
      WHERE user_id = $1 AND is_active = true
      ORDER BY name
    `;
    
    const services = await query(servicesQuery, [userId]);
    
    res.json({
      success: true,
      data: services.rows.map(service => ({
        id: service.id,
        name: service.name,
        default_price: parseFloat(service.default_price),
        description: service.description,
        category: service.category,
        duration: service.duration
      }))
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
});

// POST: Create new service
app.post('/api/user/services', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { name, description, default_price } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'User ID and service name are required'
      });
    }

    const insertQuery = `
      INSERT INTO services (user_id, name, description, price, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, price as default_price, description
    `;

    const result = await query(insertQuery, [
      user_id,
      name,
      description || null,
      default_price || 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        default_price: parseFloat(result.rows[0].default_price),
        description: result.rows[0].description
      }
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service'
    });
  }
});

// PUT: Update service
app.put('/api/user/services/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;
    const { name, description, default_price } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Service name is required'
      });
    }

    const updateQuery = `
      UPDATE services 
      SET name = $1, description = $2, price = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, price as default_price, description
    `;

    const result = await query(updateQuery, [
      name,
      description || null,
      default_price || 0,
      serviceId,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        default_price: parseFloat(result.rows[0].default_price),
        description: result.rows[0].description
      }
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
});

// DELETE: Delete service
app.delete('/api/user/services/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;

    const deleteQuery = `
      DELETE FROM services 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await query(deleteQuery, [serviceId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
});

app.get('/api/user/clients', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const clientsQuery = `
      SELECT id, name, phone, email, address, company
      FROM clients
      WHERE user_id = $1
      ORDER BY name
    `;
    
    const clients = await query(clientsQuery, [userId]);
    
    res.json({
      success: true,
      data: clients.rows
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients'
    });
  }
});

// POST: Create new client
app.post('/api/user/clients', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID, name, and phone are required'
      });
    }

    const insertQuery = `
      INSERT INTO clients (user_id, name, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, phone, address
    `;

    const result = await query(insertQuery, [user_id, name, phone, address || null]);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client'
    });
  }
});

// PUT: Update client
app.put('/api/user/clients/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const clientId = req.params.id;
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const updateQuery = `
      UPDATE clients 
      SET name = $1, phone = $2, address = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, phone, address
    `;

    const result = await query(updateQuery, [name, phone, address || null, clientId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client'
    });
  }
});

// DELETE: Delete client
app.delete('/api/user/clients/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const clientId = req.params.id;
    const userId = req.user.id;

    const deleteQuery = `
      DELETE FROM clients 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await query(deleteQuery, [clientId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client'
    });
  }
});

// Responsible Parties endpoints
app.get('/api/user/responsible-parties', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const partiesQuery = `
      SELECT id, name, phone, address
      FROM responsible_parties
      WHERE user_id = $1
      ORDER BY name
    `;
    
    const parties = await query(partiesQuery, [userId]);
    
    res.json({
      success: true,
      data: parties.rows
    });
  } catch (error) {
    console.error('Error fetching responsible parties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch responsible parties'
    });
  }
});

// Service Responsible Parties endpoints
app.get('/api/user/service-responsible-parties', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const queryText = `
      SELECT 
        srp.id,
        rp.name,
        rp.phone,
        rp.address,
        srp.service_id,
        s.name as service_name
      FROM service_responsible_parties srp
      JOIN responsible_parties rp ON srp.responsible_party_id = rp.id
      JOIN services s ON srp.service_id = s.id
      WHERE rp.user_id = $1
      ORDER BY rp.name
    `;
    const result = await query(queryText, [userId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching service responsible parties:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service responsible parties' });
  }
});

// POST: Create new responsible party
app.post('/api/user/responsible-parties', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const insertQuery = `
      INSERT INTO responsible_parties (user_id, name, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, phone, address
    `;

    const result = await query(insertQuery, [user_id, name, phone, address || null]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Responsible party created successfully'
    });
  } catch (error) {
    console.error('Error creating responsible party:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create responsible party'
    });
  }
});

// PUT: Update responsible party
app.put('/api/user/responsible-parties/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const partyId = req.params.id;
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const updateQuery = `
      UPDATE responsible_parties
      SET name = $1, phone = $2, address = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, phone, address
    `;

    const result = await query(updateQuery, [name, phone, address || null, partyId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Responsible party not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Responsible party updated successfully'
    });
  } catch (error) {
    console.error('Error updating responsible party:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update responsible party'
    });
  }
});

// DELETE: Delete responsible party
app.delete('/api/user/responsible-parties/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const partyId = req.params.id;
    const userId = req.user.id;

    const deleteQuery = `
      DELETE FROM responsible_parties
      WHERE id = $1 AND user_id = $2
    `;

    const result = await query(deleteQuery, [partyId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Responsible party not found'
      });
    }

    res.json({
      success: true,
      message: 'Responsible party deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting responsible party:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete responsible party'
    });
  }
});

// PUT: Update booking
app.put('/api/user/bookings/:id', authenticate, enforceTenancy, async (req, res) => {
  const client = await require('./config/database').getClient();
  
  try {
    await client.query('BEGIN');
    
    const bookingId = req.params.id;
    const userId = req.user.id;
    const {
      service_id,
      booking_date,
      booking_time,
      location_name,
      location_map_url,
      status,
      payment_status: requestPaymentStatus,
      total_amount,
      amount_paid,
      notes
    } = req.body;

    console.log('=== UPDATE BOOKING ===');
    console.log('Booking ID:', bookingId);
    console.log('Service ID:', service_id, 'Type:', typeof service_id);
    console.log('Booking Date:', booking_date);
    console.log('Booking Time:', booking_time);
    console.log('Location Name:', location_name);
    console.log('Location Map URL:', location_map_url);
    console.log('Status:', status);
    console.log('Total Amount:', total_amount);
    console.log('Amount Paid:', amount_paid);
    console.log('Payment Status:', requestPaymentStatus);
    console.log('Notes length:', notes ? notes.length : 0);
    console.log('====================');

    // Validate required fields
    if (!booking_date) {
      throw new Error('booking_date is required');
    }
    if (!status) {
      throw new Error('status is required');
    }

    // Build dynamic update query based on whether service_id is provided
    let updateBookingQuery;
    let updateParams;
    
    if (service_id) {
      // Update with service_id
      updateBookingQuery = `
        UPDATE bookings 
        SET service_id = $1, 
            booking_date = $2, 
            booking_time = $3, 
            location_name = $4,
            location_map_url = $5,
            status = $6, 
            total_price = $7, 
            notes = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 AND user_id = $10
        RETURNING id
      `;
      updateParams = [
        service_id,
        booking_date,
        booking_time,
        location_name,
        location_map_url,
        status,
        total_amount,
        notes || null,
        bookingId,
        userId
      ];
    } else {
      // Update without service_id (keep existing service_id)
      updateBookingQuery = `
        UPDATE bookings 
        SET booking_date = $1, 
            booking_time = $2, 
            location_name = $3,
            location_map_url = $4,
            status = $5, 
            total_price = $6, 
            notes = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8 AND user_id = $9
        RETURNING id
      `;
      updateParams = [
        booking_date,
        booking_time,
        location_name,
        location_map_url,
        status,
        total_amount,
        notes || null,
        bookingId,
        userId
      ];
    }
    
    const updateResult = await client.query(updateBookingQuery, updateParams);

    if (updateResult.rows.length === 0) {
      throw new Error('Booking not found');
    }

    // Determine payment_status: use request payment_status if provided, otherwise calculate
    let payment_status = requestPaymentStatus;
    if (!payment_status) {
      payment_status = amount_paid >= total_amount ? 'paid' : amount_paid > 0 ? 'partial' : 'unpaid';
    }

    // Auto-adjust amount_paid based on payment_status if needed
    let finalAmountPaid = amount_paid;
    if (payment_status === 'paid' && amount_paid < total_amount) {
      // If status is 'paid' but amount_paid is less than total, set it to total
      finalAmountPaid = total_amount;
    } else if (payment_status === 'unpaid') {
      // If status is 'unpaid', set amount_paid to 0
      finalAmountPaid = 0;
    }

    // Update or create payment
    const checkPaymentQuery = `SELECT id FROM payments WHERE booking_id = $1`;
    const paymentCheck = await client.query(checkPaymentQuery, [bookingId]);

    if (paymentCheck.rows.length > 0) {
      // Update existing payment
      const updatePaymentQuery = `
        UPDATE payments 
        SET amount = $1, 
            payment_status = $2::VARCHAR,
            payment_date = CASE WHEN $2::VARCHAR != 'unpaid' THEN CURRENT_TIMESTAMP ELSE payment_date END
        WHERE booking_id = $3
      `;
      await client.query(updatePaymentQuery, [finalAmountPaid, payment_status, bookingId]);
    } else {
      // Create new payment if doesn't exist
      const createPaymentQuery = `
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_date)
        VALUES ($1, $2, $3, $4::VARCHAR, CASE WHEN $4::VARCHAR != 'unpaid' THEN CURRENT_TIMESTAMP ELSE NULL END)
      `;
      await client.query(createPaymentQuery, [bookingId, finalAmountPaid, 'cash', payment_status]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Booking berhasil diupdate'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('=== ERROR UPDATING BOOKING ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('============================');
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengupdate booking',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// DELETE: Delete booking
app.delete('/api/user/bookings/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    
    // Delete booking (cascade will delete payments)
    const deleteQuery = `
      DELETE FROM bookings 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await query(deleteQuery, [bookingId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Booking berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus booking'
    });
  }
});

// GET: Get single booking detail
app.get('/api/user/bookings/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    
    const bookingQuery = `
      SELECT 
        b.id,
        b.user_id,
        b.client_id,
        c.name as client_name,
        c.phone as contact,
        c.address,
        b.service_id,
        s.name as service_name,
        to_char(b.booking_date, 'YYYY-MM-DD') as booking_date,
        to_char(b.booking_time, 'HH24:MI') as booking_time,
        b.location_name,
        b.location_map_url,
        b.status,
        b.total_price as total_amount,
        b.notes,
        COALESCE(p.payment_status, 'unpaid') as payment_status,
        COALESCE(p.amount, 0) as amount_paid
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN services s ON b.service_id = s.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE b.id = $1 AND b.user_id = $2
    `;
    
    const result = await query(bookingQuery, [bookingId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    const booking = result.rows[0];
    
    // Parse booking details from notes if JSON format
    let bookingDetails = null;
    try {
      if (booking.notes && booking.notes.trim().startsWith('{')) {
        bookingDetails = JSON.parse(booking.notes);
      }
    } catch (parseError) {
      console.log('Notes is not JSON format for booking', booking.id);
    }

    res.json({
      success: true,
      data: {
        ...booking,
        booking_details: bookingDetails
      }
    });

  } catch (error) {
    console.error('Error fetching booking detail:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat detail booking'
    });
  }
});

// POST: Create new booking
app.post('/api/user/bookings', authenticate, enforceTenancy, async (req, res) => {
  const client = await require('./config/database').getClient();
  
  try {
    await client.query('BEGIN');
    
    const user_id = req.user.id;
    const {
      client_id,
      client_name,
      contact,
      address,
      service_id,
      booking_date,
      booking_time,
      location_name,
      location_map_url,
      status = 'pending',
      total_amount,
      amount_paid = 0,
      notes
    } = req.body;

    let finalClientId = client_id;

    // If new client, create client first
    if (!client_id && client_name) {
      const createClientQuery = `
        INSERT INTO clients (user_id, name, phone, address)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const clientResult = await client.query(createClientQuery, [user_id, client_name, contact, address]);
      finalClientId = clientResult.rows[0].id;
    }

    // Create booking
    const createBookingQuery = `
      INSERT INTO bookings (user_id, client_id, service_id, booking_date, booking_time, location_name, location_map_url, status, total_price, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    
    const bookingResult = await client.query(createBookingQuery, [
      user_id,
      finalClientId,
      service_id,
      booking_date,
      booking_time,
      location_name,
      location_map_url,
      status,
      total_amount,
      notes
    ]);

    const bookingId = bookingResult.rows[0].id;

    // Create payment record if amount_paid > 0
    if (amount_paid > 0) {
      const payment_status = amount_paid >= total_amount ? 'paid' : 'partial';
      const createPaymentQuery = `
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_date)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;
      await client.query(createPaymentQuery, [bookingId, amount_paid, 'cash', payment_status]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: { booking_id: bookingId }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat booking'
    });
  } finally {
    client.release();
  }
});

// Company Settings Endpoints
app.get('/api/user/company-settings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;

    const settingsQuery = `
      SELECT *
      FROM company_settings
      WHERE user_id = $1
    `;

    const result = await query(settingsQuery, [userId]);

    res.json({
      success: true,
      data: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company settings'
    });
  }
});

app.post('/api/user/company-settings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      company_name,
      company_address,
      company_phone,
      company_email,
      company_logo_url,
      bank_name,
      account_number,
      account_holder_name,
      payment_instructions,
      bank_name_alt,
      account_number_alt,
      account_holder_name_alt
    } = req.body;

    const insertQuery = `
      INSERT INTO company_settings (
        user_id, company_name, company_address, company_phone, company_email,
        company_logo_url, bank_name, account_number, account_holder_name,
        payment_instructions, bank_name_alt, account_number_alt, account_holder_name_alt
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      user_id,
      company_name,
      company_address,
      company_phone,
      company_email,
      company_logo_url || null,
      bank_name,
      account_number,
      account_holder_name,
      payment_instructions,
      bank_name_alt || null,
      account_number_alt || null,
      account_holder_name_alt || null
    ]);

    res.json({
      success: true,
      message: 'Company settings saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save company settings'
    });
  }
});

app.put('/api/user/company-settings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      company_name,
      company_address,
      company_phone,
      company_email,
      company_logo_url,
      bank_name,
      account_number,
      account_holder_name,
      payment_instructions,
      bank_name_alt,
      account_number_alt,
      account_holder_name_alt
    } = req.body;

    const updateQuery = `
      UPDATE company_settings
      SET company_name = $2,
          company_address = $3,
          company_phone = $4,
          company_email = $5,
          company_logo_url = $6,
          bank_name = $7,
          account_number = $8,
          account_holder_name = $9,
          payment_instructions = $10,
          bank_name_alt = $11,
          account_number_alt = $12,
          account_holder_name_alt = $13,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await query(updateQuery, [
      user_id,
      company_name,
      company_address,
      company_phone,
      company_email,
      company_logo_url,
      bank_name,
      account_number,
      account_holder_name,
      payment_instructions,
      bank_name_alt,
      account_number_alt,
      account_holder_name_alt
    ]);

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company settings'
    });
  }
});

// ====================================
// USER PROFILE ENDPOINTS
// ====================================

// Get user profile
app.get('/api/user/profile', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await query(
      'SELECT id, email as username, full_name as name, email, role, created_at FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// Update user profile (name & email)
app.put('/api/user/profile', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { name, email } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email is already used by another user
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, user_id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use by another account'
      });
    }

    // Update profile
    const result = await query(
      `UPDATE users 
       SET full_name = $1, email = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, email as username, full_name as name, email, role, created_at`,
      [name, email, user_id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
app.put('/api/user/change-password', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { currentPassword, newPassword, verificationPin } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user's current password hash and PIN
    const userResult = await query(
      'SELECT password, security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const bcrypt = require('bcryptjs');

    // If user has PIN, require PIN verification
    if (user.security_pin) {
      if (!verificationPin) {
        return res.status(400).json({
          success: false,
          message: 'PIN verifikasi diperlukan untuk mengubah password'
        });
      }

      if (verificationPin.length !== 6 || !/^\d{6}$/.test(verificationPin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN harus 6 digit angka'
        });
      }

      // Verify PIN
      const isPinValid = await bcrypt.compare(verificationPin, user.security_pin);
      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: 'PIN verifikasi salah'
        });
      }
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user_id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// ====================================
// SECURITY PIN ENDPOINTS
// ====================================

// Get PIN status (check if user has set PIN)
app.get('/api/user/pin-status', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await query(
      'SELECT security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        hasPin: result.rows[0].security_pin !== null && result.rows[0].security_pin !== ''
      }
    });
  } catch (error) {
    console.error('Error checking PIN status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check PIN status'
    });
  }
});

// Set or update security PIN
app.post('/api/user/set-pin', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { pin, currentPassword, currentPin } = req.body;

    // Validate PIN
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit angka'
      });
    }

    // Verify current password for security
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini diperlukan untuk keamanan'
      });
    }

    // Get user's current password hash and security PIN
    const userResult = await query(
      'SELECT password, security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const bcrypt = require('bcryptjs');

    // If user already has PIN, require current PIN verification
    if (user.security_pin) {
      if (!currentPin) {
        return res.status(400).json({
          success: false,
          message: 'PIN saat ini diperlukan untuk verifikasi'
        });
      }

      if (currentPin.length !== 6 || !/^\d{6}$/.test(currentPin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN saat ini harus 6 digit angka'
        });
      }

      // Verify current PIN
      const isCurrentPinValid = await bcrypt.compare(currentPin, user.security_pin);
      if (!isCurrentPinValid) {
        return res.status(401).json({
          success: false,
          message: 'PIN saat ini salah'
        });
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini salah'
      });
    }

    // Hash PIN for security
    const hashedPin = await bcrypt.hash(pin, 10);

    // Update PIN
    await query(
      'UPDATE users SET security_pin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPin, user_id]
    );

    res.json({
      success: true,
      message: 'PIN keamanan berhasil diatur'
    });
  } catch (error) {
    console.error('Error setting PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengatur PIN'
    });
  }
});

// Verify security PIN
app.post('/api/user/verify-pin', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { pin } = req.body;

    // Validate PIN format
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit angka'
      });
    }

    // Get user's PIN hash
    const result = await query(
      'SELECT security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!result.rows[0].security_pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN belum diatur'
      });
    }

    // Verify PIN
    const bcrypt = require('bcryptjs');
    const isPinValid = await bcrypt.compare(pin, result.rows[0].security_pin);

    if (!isPinValid) {
      return res.status(400).json({
        success: false,
        message: 'PIN salah'
      });
    }

    res.json({
      success: true,
      message: 'PIN benar'
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi PIN'
    });
  }
});

// Reset password with PIN (Lupa Password)
app.post('/api/user/reset-password-with-pin', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { pin, newPassword } = req.body;

    // Validate inputs
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit angka'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }

    // Get user's PIN hash
    const result = await query(
      'SELECT security_pin FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (!result.rows[0].security_pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN belum diatur. Tidak dapat mereset password dengan PIN.'
      });
    }

    // Verify PIN
    const bcrypt = require('bcryptjs');
    const isPinValid = await bcrypt.compare(pin, result.rows[0].security_pin);

    if (!isPinValid) {
      return res.status(400).json({
        success: false,
        message: 'PIN salah'
      });
    }

    // PIN valid, hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user_id]
    );

    res.json({
      success: true,
      message: 'Password berhasil direset'
    });
  } catch (error) {
    console.error('Error resetting password with PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mereset password'
    });
  }
});

// ====================================
// EXPENSES (PENGELUARAN) ENDPOINTS
// ====================================

// Get all expenses with filters
app.get('/api/user/expenses', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { month, year, category } = req.query;
    
    let queryText = `
      SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.user_id = $1
    `;
    
    const params = [user_id];
    let paramCount = 1;
    
    if (month) {
      paramCount++;
      queryText += ` AND EXTRACT(MONTH FROM e.expense_date) = $${paramCount}`;
      params.push(month);
    }
    
    if (year) {
      paramCount++;
      queryText += ` AND EXTRACT(YEAR FROM e.expense_date) = $${paramCount}`;
      params.push(year);
    }
    
    if (category) {
      paramCount++;
      queryText += ` AND e.category_id = $${paramCount}`;
      params.push(category);
    }
    
    queryText += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses'
    });
  }
});

// Get expense by ID
app.get('/api/user/expenses/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await query(
      `SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = $1 AND e.user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense'
    });
  }
});

// Create new expense
app.post('/api/user/expenses', authenticate, enforceTenancy, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      category_id,
      amount,
      description,
      expense_date,
      notes
    } = req.body;
    
    const result = await query(
      `INSERT INTO expenses (
        user_id,
        category_id,
        amount,
        description,
        expense_date,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [user_id, category_id, amount, description, expense_date, notes]
    );
    
    res.json({
      success: true,
      message: 'Expense created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense'
    });
  }
});

// Update expense
app.put('/api/user/expenses/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      category_id,
      amount,
      description,
      expense_date,
      notes
    } = req.body;
    
    const result = await query(
      `UPDATE expenses 
      SET 
        category_id = $1,
        amount = $2,
        description = $3,
        expense_date = $4,
        notes = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7
      RETURNING *`,
      [category_id, amount, description, expense_date, notes, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
});

// Delete expense
app.delete('/api/user/expenses/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
});

// Get expense categories
app.get('/api/user/expense-categories', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT * FROM expense_categories 
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY is_default DESC, name ASC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories'
    });
  }
});

// Create expense category
app.post('/api/user/expense-categories', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color, icon } = req.body;
    
    const result = await query(
      `INSERT INTO expense_categories (user_id, name, color, icon, is_default)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *`,
      [userId, name, color || '#6B7280', icon || '💰']
    );
    
    res.json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense category'
    });
  }
});

// Update expense category
app.put('/api/user/expense-categories/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, color, icon } = req.body;
    
    const result = await query(
      `UPDATE expense_categories 
      SET name = $1, color = $2, icon = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND is_default = false AND user_id = $5
      RETURNING *`,
      [name, color, icon, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be edited (default category)'
      });
    }
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense category'
    });
  }
});

// Delete expense category
app.delete('/api/user/expense-categories/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if category has expenses
    const checkResult = await query(
      'SELECT COUNT(*) as count FROM expenses WHERE category_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing expenses'
      });
    }
    
    const result = await query(
      'DELETE FROM expense_categories WHERE id = $1 AND is_default = false AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be deleted (default category)'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense category'
    });
  }
});

// Get financial summary
app.get('/api/user/financial-summary', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    
    let dateFilter = '';
    const params = [userId];
    let paramCount = 1;
    
    if (month && year) {
      paramCount++;
      dateFilter = ` AND EXTRACT(MONTH FROM b.booking_date) = $${paramCount}::int`;
      params.push(parseInt(month));
      paramCount++;
      dateFilter += ` AND EXTRACT(YEAR FROM b.booking_date) = $${paramCount}::int`;
      params.push(parseInt(year));
    }
    
    // Get revenue data from bookings and payments
    // Logika:
    // 1. Status 'cancelled' + unpaid (amount_paid = 0) → TIDAK dihitung sama sekali
    // 2. Status 'cancelled' + partial/paid (amount_paid > 0) → amount_paid masuk ke total_paid, sisa tidak dihitung
    // 3. Status lainnya → dihitung normal
    const revenueResult = await query(
      `SELECT 
        -- Total Revenue: hanya dari booking yang BUKAN (cancelled + unpaid)
        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'cancelled' AND COALESCE(p.amount_paid, 0) = 0 THEN 0
              ELSE CAST(b.total_price AS DECIMAL)
            END
          ), 0
        ) as total_revenue,
        
        -- Total Paid: amount yang sudah dibayar (termasuk dari cancelled jika ada pembayaran)
        COALESCE(SUM(CAST(COALESCE(p.amount_paid, 0) AS DECIMAL)), 0) as total_paid,
        
        -- Total Unpaid: sisa yang belum dibayar, KECUALI dari booking cancelled
        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'cancelled' THEN 0
              ELSE CAST(b.total_price AS DECIMAL) - CAST(COALESCE(p.amount_paid, 0) AS DECIMAL)
            END
          ), 0
        ) as total_unpaid
      FROM bookings b
      LEFT JOIN (
        SELECT booking_id, SUM(amount) as amount_paid
        FROM payments
        GROUP BY booking_id
      ) p ON b.id = p.booking_id
      WHERE b.user_id = $1 ${dateFilter}`,
      params
    );
    
    // Get expenses data
    let expenseParams = [userId];
    let expenseDateFilter = '';
    
    if (month && year) {
      expenseDateFilter = ' AND EXTRACT(MONTH FROM expense_date) = $2::int AND EXTRACT(YEAR FROM expense_date) = $3::int';
      expenseParams = [userId, parseInt(month), parseInt(year)];
    }
    
    const expenseResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE user_id = $1 ${expenseDateFilter}`,
      expenseParams
    );

    // Get tax data from paid bookings (exclude cancelled bookings)
    const taxResult = await query(
      `SELECT b.id, b.total_price, b.notes
      FROM bookings b
      LEFT JOIN (
        SELECT booking_id, 
               SUM(amount) as amount_paid,
               MAX(payment_status) as payment_status
        FROM payments
        GROUP BY booking_id
      ) p ON b.id = p.booking_id
      WHERE b.user_id = $1 ${dateFilter} AND COALESCE(p.payment_status, 'unpaid') = 'paid' AND b.status != 'cancelled'`,
      params
    );

    console.log('Tax query result count:', taxResult.rows.length);
    console.log('Tax query params:', params);

    let totalTax = 0;
    console.log('Calculating total tax for user:', userId, 'with date filter:', dateFilter);
    for (const booking of taxResult.rows) {
      try {
        if (booking.notes && booking.notes.trim().startsWith('{')) {
          const bookingDetails = JSON.parse(booking.notes);
          console.log('Booking:', booking.id || 'unknown', 'total_price:', booking.total_price, 'tax_percentage:', bookingDetails.tax_percentage);
          
          // Try to calculate from booking details if available
          if (bookingDetails.services && bookingDetails.tax_percentage) {
            console.log('Calculating tax from booking details...');
            
            // Calculate subtotal from services
            let subtotal = 0;
            if (Array.isArray(bookingDetails.services)) {
              subtotal = bookingDetails.services.reduce((sum, service) => {
                return sum + (parseFloat(service.custom_price || 0) * parseInt(service.quantity || 1));
              }, 0);
            }
            
            // Multiply by booking days
            const bookingDays = parseInt(bookingDetails.booking_days) || 1;
            subtotal = subtotal * bookingDays;
            
            // Apply discount
            if (bookingDetails.discount) {
              if (bookingDetails.discount_type === 'persen') {
                subtotal = subtotal * (1 - parseFloat(bookingDetails.discount) / 100);
              } else {
                subtotal = Math.max(0, subtotal - parseFloat(bookingDetails.discount));
              }
            }
            
            // Calculate tax
            const taxPercentage = parseFloat(bookingDetails.tax_percentage) || 0;
            const taxAmount = subtotal * (taxPercentage / 100);
            
            totalTax += taxAmount;
            console.log('Calculated tax_amount:', taxAmount, 'from subtotal:', subtotal, 'booking_days:', bookingDays, 'tax_percentage:', taxPercentage);
          } else {
            console.log('Skipping booking - insufficient tax calculation data');
          }
        } else {
          console.log('Booking notes is not JSON or empty for booking total_price:', booking.total_price);
        }
      } catch (error) {
        // Skip if notes is not valid JSON
        console.log('Error parsing booking notes for tax calculation:', error.message, 'for booking total_price:', booking.total_price);
      }
    }
    console.log('Final totalTax:', totalTax);
    
    // Get tax from cancelled bookings that are paid (add to net income)
    const cancelledTaxResult = await query(
      `SELECT b.id, b.total_price, b.notes
      FROM bookings b
      LEFT JOIN (
        SELECT booking_id, 
               SUM(amount) as amount_paid,
               MAX(payment_status) as payment_status
        FROM payments
        GROUP BY booking_id
      ) p ON b.id = p.booking_id
      WHERE b.user_id = $1 ${dateFilter} AND COALESCE(p.payment_status, 'unpaid') = 'paid' AND b.status = 'cancelled'`,
      params
    );

    let cancelledTax = 0;
    console.log('Calculating cancelled tax for user:', userId, 'with date filter:', dateFilter);
    for (const booking of cancelledTaxResult.rows) {
      try {
        if (booking.notes && booking.notes.trim().startsWith('{')) {
          const bookingDetails = JSON.parse(booking.notes);
          console.log('Cancelled Booking:', booking.id || 'unknown', 'total_price:', booking.total_price, 'tax_percentage:', bookingDetails.tax_percentage);
          
          // Try to calculate from booking details if available
          if (bookingDetails.services && bookingDetails.tax_percentage) {
            console.log('Calculating cancelled tax from booking details...');
            
            // Calculate subtotal from services
            let subtotal = 0;
            if (Array.isArray(bookingDetails.services)) {
              subtotal = bookingDetails.services.reduce((sum, service) => {
                return sum + (parseFloat(service.custom_price || 0) * parseInt(service.quantity || 1));
              }, 0);
            }
            
            // Multiply by booking days
            const bookingDays = parseInt(bookingDetails.booking_days) || 1;
            subtotal = subtotal * bookingDays;
            
            // Apply discount
            if (bookingDetails.discount) {
              if (bookingDetails.discount_type === 'persen') {
                subtotal = subtotal * (1 - parseFloat(bookingDetails.discount) / 100);
              } else {
                subtotal = Math.max(0, subtotal - parseFloat(bookingDetails.discount));
              }
            }
            
            // Calculate tax
            const taxPercentage = parseFloat(bookingDetails.tax_percentage) || 0;
            const taxAmount = subtotal * (taxPercentage / 100);
            
            cancelledTax += taxAmount;
            console.log('Calculated cancelled tax_amount:', taxAmount, 'from subtotal:', subtotal, 'booking_days:', bookingDays, 'tax_percentage:', taxPercentage);
          } else {
            console.log('Skipping cancelled booking - insufficient tax calculation data');
          }
        } else {
          console.log('Cancelled booking notes is not JSON or empty for booking total_price:', booking.total_price);
        }
      } catch (error) {
        // Skip if notes is not valid JSON
        console.log('Error parsing cancelled booking notes for tax calculation:', error.message, 'for booking total_price:', booking.total_price);
      }
    }
    console.log('Final cancelledTax:', cancelledTax);
    
    const revenue = revenueResult.rows[0];
    const expenses = expenseResult.rows[0];
    
    res.json({
      success: true,
      data: {
        total_revenue: parseFloat(revenue.total_revenue),
        total_paid: parseFloat(revenue.total_paid),
        total_unpaid: parseFloat(revenue.total_unpaid),
        total_expenses: parseFloat(expenses.total_expenses),
        total_tax: parseFloat(totalTax.toFixed(2)),
        net_income: parseFloat(revenue.total_paid) - parseFloat(expenses.total_expenses) - parseFloat(totalTax.toFixed(2)) + parseFloat(cancelledTax.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get financial details for specific card
app.get('/api/user/financial-details/:type', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;
    const { month, year } = req.query;
    
    console.log('Financial details request:', { type, month, year, userId });
    
    let dateFilter = '';
    const params = [userId];
    let paramCount = 1;
    
    if (month && year) {
      paramCount++;
      dateFilter = ` AND EXTRACT(MONTH FROM b.booking_date) = $${paramCount}::int`;
      params.push(parseInt(month));
      paramCount++;
      dateFilter += ` AND EXTRACT(YEAR FROM b.booking_date) = $${paramCount}::int`;
      params.push(parseInt(year));
    }
    
    let queryStr = '';
    let total = 0;
    let data = [];
    
    switch (type) {
      case 'revenue':
        // Total revenue from all bookings (except cancelled + unpaid)
        queryStr = `
          SELECT 
            b.id,
            c.name as client_name,
            b.total_price as amount,
            b.booking_date,
            b.status,
            COALESCE(p.amount_paid, 0) as amount_paid,
            CASE 
              WHEN b.notes IS NOT NULL AND b.notes != '' THEN 
                b.notes::json->>'services'
              ELSE '[]'
            END as services_json
          FROM bookings b
          LEFT JOIN clients c ON b.client_id = c.id
          LEFT JOIN (
            SELECT booking_id, SUM(amount) as amount_paid
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter} AND NOT (b.status = 'cancelled' AND COALESCE(p.amount_paid, 0) = 0)
          ORDER BY b.booking_date DESC
        `;
        
        const revenueResult = await query(queryStr, params);
        
        data = revenueResult.rows.map(row => {
          let serviceNames = 'Layanan';
          try {
            if (row.services_json && row.services_json !== '[]' && row.services_json !== 'null') {
              const services = JSON.parse(row.services_json);
              if (Array.isArray(services) && services.length > 0) {
                serviceNames = services.map(s => s.service_name || s.name || 'Layanan').join(', ');
              }
            }
          } catch (e) {
            console.log('Error parsing services JSON for revenue:', e.message, 'Data:', row.services_json);
            serviceNames = 'Layanan';
          }
          
          return {
            client_name: row.client_name || 'Client',
            service_names: serviceNames,
            amount: parseFloat(row.amount),
            booking_date: row.booking_date,
            status: row.status
          };
        });
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'paid':
        // Amount already paid
        queryStr = `
          SELECT 
            b.id,
            c.name as client_name,
            p.amount as amount,
            p.payment_date,
            CASE 
              WHEN b.notes IS NOT NULL AND b.notes != '' THEN 
                b.notes::json->>'services'
              ELSE '[]'
            END as services_json
          FROM payments p
          INNER JOIN bookings b ON p.booking_id = b.id
          LEFT JOIN clients c ON b.client_id = c.id
          WHERE b.user_id = $1 ${dateFilter}
          ORDER BY p.payment_date DESC
        `;
        
        const paidResult = await query(queryStr, params);
        
        data = paidResult.rows.map(row => {
          let serviceNames = 'Layanan';
          try {
            if (row.services_json && row.services_json !== '[]') {
              const services = JSON.parse(row.services_json);
              if (Array.isArray(services) && services.length > 0) {
                serviceNames = services.map(s => s.service_name || s.name || 'Layanan').join(', ');
              }
            }
          } catch (e) {
            serviceNames = 'Layanan';
          }
          
          return {
            client_name: row.client_name || 'Client',
            service_names: serviceNames,
            amount: parseFloat(row.amount),
            payment_date: row.payment_date
          };
        });
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'unpaid':
        // Amount still unpaid
        queryStr = `
          SELECT 
            b.id,
            c.name as client_name,
            (b.total_price - COALESCE(p.amount_paid, 0)) as amount,
            b.booking_date,
            b.status,
            CASE 
              WHEN b.notes IS NOT NULL AND b.notes != '' THEN 
                b.notes::json->>'services'
              ELSE '[]'
            END as services_json
          FROM bookings b
          LEFT JOIN clients c ON b.client_id = c.id
          LEFT JOIN (
            SELECT booking_id, SUM(amount) as amount_paid
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter} AND b.status != 'cancelled' AND (b.total_price - COALESCE(p.amount_paid, 0)) > 0
          ORDER BY b.booking_date DESC
        `;
        
        const unpaidResult = await query(queryStr, params);
        
        data = unpaidResult.rows.map(row => {
          let serviceNames = 'Layanan';
          try {
            if (row.services_json && row.services_json !== '[]') {
              const services = JSON.parse(row.services_json);
              if (Array.isArray(services) && services.length > 0) {
                serviceNames = services.map(s => s.service_name || s.name || 'Layanan').join(', ');
              }
            }
          } catch (e) {
            serviceNames = 'Layanan';
          }
          
          return {
            client_name: row.client_name || 'Client',
            service_names: serviceNames,
            amount: parseFloat(row.amount),
            booking_date: row.booking_date,
            status: row.status
          };
        });
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'expenses':
        // All expenses
        let expenseParams = [userId];
        let expenseDateFilter = '';
        
        if (month && year) {
          expenseDateFilter = ' AND EXTRACT(MONTH FROM e.expense_date) = $2::int AND EXTRACT(YEAR FROM e.expense_date) = $3::int';
          expenseParams = [userId, parseInt(month), parseInt(year)];
        }
        
        queryStr = `
          SELECT 
            e.id,
            e.description,
            e.amount,
            e.expense_date,
            c.name as category_name,
            c.icon,
            c.color
          FROM expenses e
          LEFT JOIN expense_categories c ON e.category_id = c.id
          WHERE e.user_id = $1 ${expenseDateFilter}
          ORDER BY e.expense_date DESC
        `;
        
        const expensesResult = await query(queryStr, expenseParams);
        
        data = expensesResult.rows.map(row => ({
          description: row.description || 'Pengeluaran',
          category_name: row.category_name || 'Kategori',
          amount: parseFloat(row.amount),
          date: row.expense_date
        }));
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'tax':
        // Tax from paid bookings (excluding cancelled)
        queryStr = `
          SELECT b.id, b.total_price, b.notes, c.name as client_name, b.booking_date,
            CASE 
              WHEN b.notes IS NOT NULL AND b.notes != '' THEN 
                b.notes::json->>'services'
              ELSE '[]'
            END as services_json
          FROM bookings b
          LEFT JOIN clients c ON b.client_id = c.id
          LEFT JOIN (
            SELECT booking_id, 
                   SUM(amount) as amount_paid,
                   MAX(payment_status) as payment_status
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter} AND COALESCE(p.payment_status, 'unpaid') = 'paid' AND b.status != 'cancelled'
          ORDER BY b.booking_date DESC
        `;
        
        const taxResult = await query(queryStr, params);
        
        data = [];
        for (const booking of taxResult.rows) {
          try {
            if (booking.notes && booking.notes.trim().startsWith('{')) {
              const bookingDetails = JSON.parse(booking.notes);
              
              if (bookingDetails.services && bookingDetails.tax_percentage) {
                let subtotal = 0;
                if (Array.isArray(bookingDetails.services)) {
                  subtotal = bookingDetails.services.reduce((sum, service) => {
                    return sum + (parseFloat(service.custom_price || 0) * parseInt(service.quantity || 1));
                  }, 0);
                }
                
                const bookingDays = parseInt(bookingDetails.booking_days) || 1;
                subtotal = subtotal * bookingDays;
                
                if (bookingDetails.discount) {
                  if (bookingDetails.discount_type === 'persen') {
                    subtotal = subtotal * (1 - parseFloat(bookingDetails.discount) / 100);
                  } else {
                    subtotal = Math.max(0, subtotal - parseFloat(bookingDetails.discount));
                  }
                }
                
                const taxPercentage = parseFloat(bookingDetails.tax_percentage) || 0;
                const taxAmount = subtotal * (taxPercentage / 100);
                
                if (taxAmount > 0) {
                  let serviceNames = 'Layanan';
                  try {
                    if (booking.services_json && booking.services_json !== '[]') {
                      const services = JSON.parse(booking.services_json);
                      if (Array.isArray(services) && services.length > 0) {
                        serviceNames = services.map(s => s.service_name || s.name || 'Layanan').join(', ');
                      }
                    }
                  } catch (e) {
                    serviceNames = 'Layanan';
                  }
                  
                  data.push({
                    client_name: booking.client_name || 'Client',
                    service_names: serviceNames,
                    amount: taxAmount,
                    booking_date: booking.booking_date,
                    tax_percentage: taxPercentage
                  });
                }
              }
            }
          } catch (error) {
            console.log('Error parsing booking notes for tax detail:', error.message);
          }
        }
        
        total = data.reduce((sum, item) => sum + item.amount, 0);
        break;
        
      case 'net-income':
        // Net income breakdown (revenue - expenses - tax + cancelled tax)
        // This will show all components that make up net income
        const components = [];
        
        // Get total revenue
        const revenueQuery = await query(`
          SELECT COALESCE(
            SUM(
              CASE 
                WHEN b.status = 'cancelled' AND COALESCE(p.amount_paid, 0) = 0 THEN 0
                ELSE CAST(b.total_price AS DECIMAL)
              END
            ), 0
          ) as total_revenue
          FROM bookings b
          LEFT JOIN (
            SELECT booking_id, SUM(amount) as amount_paid
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter} AND NOT (b.status = 'cancelled' AND COALESCE(p.amount_paid, 0) = 0)
        `, params);
        
        // Get total paid
        const paidQuery = await query(`
          SELECT COALESCE(SUM(CAST(COALESCE(p.amount_paid, 0) AS DECIMAL)), 0) as total_paid
          FROM bookings b
          LEFT JOIN (
            SELECT booking_id, SUM(amount) as amount_paid
            FROM payments
            GROUP BY booking_id
          ) p ON b.id = p.booking_id
          WHERE b.user_id = $1 ${dateFilter}
        `, params);
        
        // Get total expenses
        let expenseQueryParams = [userId];
        let expenseQueryDateFilter = '';
        
        if (month && year) {
          expenseQueryDateFilter = ' AND EXTRACT(MONTH FROM expense_date) = $2::int AND EXTRACT(YEAR FROM expense_date) = $3::int';
          expenseQueryParams = [userId, parseInt(month), parseInt(year)];
        }
        
        const expenseQuery = await query(
          `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE user_id = $1 ${expenseQueryDateFilter}`,
          expenseQueryParams
        );
        
        const revenueAmount = parseFloat(revenueQuery.rows[0].total_revenue);
        const paidAmount = parseFloat(paidQuery.rows[0].total_paid);
        const expenseAmount = parseFloat(expenseQuery.rows[0].total_expenses);
        
        // For net income, we show the components
        data = [
          {
            description: 'Total Pendapatan',
            type: 'Pendapatan',
            amount: revenueAmount,
            date: new Date().toISOString().split('T')[0]
          },
          {
            description: 'Total Pengeluaran',
            type: 'Pengeluaran',
            amount: -expenseAmount,
            date: new Date().toISOString().split('T')[0]
          },
          {
            description: 'Total Diterima',
            type: 'Penerimaan',
            amount: paidAmount,
            date: new Date().toISOString().split('T')[0]
          }
        ];
        
        // Calculate net income
        total = paidAmount - expenseAmount;
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid detail type' });
    }
    
    res.json({
      success: true,
      data: data,
      total: total
    });
  } catch (error) {
    console.error('Error fetching financial details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============= BACKUP & RESTORE ENDPOINTS =============

// Get data statistics
app.get('/api/backup/stats', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts for all data
    const bookingsCount = await query(
      'SELECT COUNT(*) as count FROM bookings WHERE user_id = $1',
      [userId]
    );
    
    const paymentsCount = await query(
      `SELECT COUNT(*) as count FROM payments p 
       INNER JOIN bookings b ON p.booking_id = b.id 
       WHERE b.user_id = $1`,
      [userId]
    );
    
    const expensesCount = await query(
      'SELECT COUNT(*) as count FROM expenses WHERE user_id = $1',
      [userId]
    );
    
    const clientsCount = await query(
      'SELECT COUNT(*) as count FROM clients WHERE user_id = $1',
      [userId]
    );
    
    const servicesCount = await query(
      'SELECT COUNT(*) as count FROM services WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalBookings: parseInt(bookingsCount.rows[0].count),
        totalPayments: parseInt(paymentsCount.rows[0].count),
        totalExpenses: parseInt(expensesCount.rows[0].count),
        totalClients: parseInt(clientsCount.rows[0].count),
        totalServices: parseInt(servicesCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching data stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data statistics'
    });
  }
});

// ============= DATA FETCH ENDPOINTS FOR SELECTIVE EXPORT =============

// Get all clients
app.get('/api/clients', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const clients = await query(
      'SELECT id, name, email, phone, address, created_at FROM clients WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    res.json(clients.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
});

// Get all services
app.get('/api/services', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const services = await query(
      'SELECT id, name, description, price, duration, created_at FROM services WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    res.json(services.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// Get all bookings with client and service names
app.get('/api/bookings', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await query(
      `SELECT b.id, b.client_id, b.service_id, b.booking_date, b.booking_time, b.status, 
              b.total_price, b.notes, b.created_at,
              c.name as client_name, s.name as service_name,
              p.payment_status, p.amount as amount_paid
       FROM bookings b
       LEFT JOIN clients c ON b.client_id = c.id
       LEFT JOIN services s ON b.service_id = s.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [userId]
    );
    res.json(bookings.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get all payments with client names
app.get('/api/payments', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await query(
      `SELECT p.id, p.booking_id, p.amount, p.payment_method, p.payment_date, p.notes, p.created_at,
              c.name as client_name
       FROM payments p
       INNER JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN clients c ON b.client_id = c.id
       WHERE b.user_id = $1
       ORDER BY p.payment_date DESC`,
      [userId]
    );
    res.json(payments.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Get all expenses with category names
app.get('/api/expenses', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await query(
      `SELECT e.id, e.category_id, e.amount, e.description, e.expense_date, e.notes, e.created_at,
              ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.user_id = $1
       ORDER BY e.expense_date DESC`,
      [userId]
    );
    res.json(expenses.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// Get all expense categories
app.get('/api/expense-categories', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await query(
      'SELECT id, name, created_at, is_default, user_id FROM expense_categories WHERE user_id = $1 OR user_id IS NULL ORDER BY is_default DESC, name',
      [userId]
    );
    console.log(`📊 Fetched ${categories.rows.length} expense categories for user ${userId} (including defaults)`);
    res.json(categories.rows);
  } catch (error) {
    console.error('❌ Error fetching expense categories:', error);
    res.status(500).json({ message: 'Failed to fetch expense categories' });
  }
});

// Export to Excel
app.get('/api/backup/export/:format', authenticate, enforceTenancy, async (req, res) => {
  try {
    console.log('🔄 Starting XLSX export process...');
    const userId = req.user.id;
    const { format } = req.params; // 'xlsx' only

    // Validate format
    if (format !== 'xlsx') {
      return res.status(400).json({ message: 'Invalid format. Only xlsx is supported.' });
    }

    console.log('📊 User ID:', userId, 'Format:', format);

    // Import required libraries
    const ExcelJS = require('exceljs');

    // Get selection from query params (default all true)
    const selection = {
      companySettings: req.query.companySettings !== 'false',
      clients: req.query.clients !== 'false',
      services: req.query.services !== 'false',
      responsibleParties: req.query.responsibleParties !== 'false',
      serviceResponsibleParties: req.query.serviceResponsibleParties !== 'false',
      bookings: req.query.bookings !== 'false',
      payments: req.query.payments !== 'false',
      expenses: req.query.expenses !== 'false',
      expenseCategories: req.query.expenseCategories !== 'false'
    };

    // Get selected IDs from query params with better error handling
    const selectedIds = {};
    const idFields = ['clients', 'services', 'responsibleParties', 'serviceResponsibleParties', 'bookings', 'payments', 'expenses', 'expenseCategories'];
    
    idFields.forEach(field => {
      const paramName = `${field}Ids`;
      const paramValue = req.query[paramName];
      
      if (paramValue && paramValue.trim()) {
        try {
          // URL decode first, then parse JSON
          const decodedValue = decodeURIComponent(paramValue);
          selectedIds[field] = JSON.parse(decodedValue);
          
          // Validate that it's an array
          if (!Array.isArray(selectedIds[field])) {
            console.warn(`⚠️ ${paramName} is not an array, converting to array`);
            selectedIds[field] = [selectedIds[field]];
          }
        } catch (error) {
          console.error(`❌ Error parsing ${paramName}:`, error.message, 'Value:', paramValue);
          selectedIds[field] = null;
        }
      } else {
        selectedIds[field] = null;
      }
    });

    console.log('📊 Excel/CSV Export selection:', selection);
    console.log('🔍 Selected IDs:', selectedIds);

    // Helper function to format currency
    const formatCurrency = (amount) => {
      if (!amount && amount !== 0) return 'Rp 0';
      try {
        return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
      } catch (error) {
        return `Rp ${amount}`;
      }
    };

    // Helper function to format date
    const formatDate = (date) => {
      if (!date) return '';
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
      } catch (error) {
        return date;
      }
    };

    // Helper function to parse notes
    const parseNotes = (notes) => {
      if (!notes) return '';
      try {
        const parsed = typeof notes === 'string' ? JSON.parse(notes) : notes;
        return parsed.text || parsed.notes || '';
      } catch (e) {
        return notes;
      }
    };

    // Helper function to style worksheet with borders and header
    const styleWorksheet = (worksheet) => {
      // Style header row (first row)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      
      // Define numeric columns that should be center-aligned
      const numericColumns = ['id', 'service_quantity', 'booking_days', 'tax_percentage', 'total_price', 'amount_paid', 'remaining_amount', 'discount'];
      
      // Apply borders to all cells
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          
          // Data rows alignment
          if (rowNumber > 1) {
            // Check if this column contains numeric data
            const columnKey = worksheet.columns[colNumber - 1]?.key;
            if (numericColumns.includes(columnKey)) {
              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            } else {
              cell.alignment = { vertical: 'top', wrapText: true };
            }
          }
        });
      });
    };

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CatatJasamu';
    workbook.created = new Date();

    // Fetch and add Bookings sheet if selected
    if (selection.bookings) {
      console.log('📊 Starting bookings export...');
      let bookingsQuery = `SELECT 
        b.id, b.booking_date, b.booking_time,
        c.name as client_name, c.phone as client_phone, c.address as client_address,
        b.location_name,
        b.total_price, b.status, b.notes,
        COALESCE(p.amount_paid, 0) as amount_paid,
        CASE 
          WHEN COALESCE(p.amount_paid, 0) = 0 THEN 'Belum Bayar'
          WHEN COALESCE(p.amount_paid, 0) >= b.total_price THEN 'Lunas'
          ELSE 'Bayar Sebagian'
        END as payment_status,
        (b.total_price - COALESCE(p.amount_paid, 0)) as remaining_amount
       FROM bookings b 
       LEFT JOIN clients c ON b.client_id = c.id 
       LEFT JOIN (
         SELECT booking_id, SUM(amount) as amount_paid
         FROM payments
         GROUP BY booking_id
       ) p ON b.id = p.booking_id
       WHERE b.user_id = $1`;
      const params = [userId];
      
      if (selectedIds.bookings && selectedIds.bookings.length > 0) {
        bookingsQuery += ' AND b.id = ANY($2::int[])';
        params.push(selectedIds.bookings);
      }
      
      bookingsQuery += ' ORDER BY b.booking_date DESC, b.booking_time DESC';
      const bookings = await query(bookingsQuery, params);
      
      if (bookings.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Booking');
        
        // Define columns
        worksheet.columns = [
          { header: 'ID Booking', key: 'id', width: 12 },
          { header: 'Tanggal Mulai', key: 'booking_date', width: 20 },
          { header: 'Tanggal Selesai', key: 'booking_date_end', width: 20 },
          { header: 'Waktu Mulai', key: 'booking_time', width: 15 },
          { header: 'Waktu Selesai', key: 'booking_time_end', width: 15 },
          { header: 'Nama Klien', key: 'client_name', width: 28 },
          { header: 'Telepon Klien', key: 'client_phone', width: 18 },
          { header: 'Alamat Klien', key: 'client_address', width: 40 },
          { header: 'Nama Lokasi', key: 'location_name', width: 30 },
          { header: 'Penanggung Jawab', key: 'responsible_parties', width: 35 },
          { header: 'Layanan Dipesan', key: 'services_ordered', width: 50 },
          { header: 'Jumlah Layanan', key: 'service_quantity', width: 15 },
          { header: 'Durasi (Hari)', key: 'booking_days', width: 15 },
          { header: 'Biaya Tambahan', key: 'additional_fees', width: 30 },
          { header: 'Diskon', key: 'discount', width: 15 },
          { header: 'Pajak (%)', key: 'tax_percentage', width: 12 },
          { header: 'Total Harga', key: 'total_price', width: 18 },
          { header: 'Status Booking', key: 'status', width: 15 },
          { header: 'Status Pembayaran', key: 'payment_status', width: 18 },
          { header: 'Jumlah Dibayar', key: 'amount_paid', width: 18 },
          { header: 'Sisa Pembayaran', key: 'remaining_amount', width: 18 },
          { header: 'Catatan Booking', key: 'notes', width: 45 }
        ];
        
        // Add rows
        bookings.rows.forEach(row => {
          // Parse booking details from notes JSON
          let bookingDetails = {
            booking_date_end: '',
            booking_time_end: '',
            booking_days: 1,
            responsible_parties: '',
            services_ordered: '',
            service_quantity: 1,
            additional_fees: '',
            discount: 0,
            tax_percentage: 0,
            user_notes: ''
          };

          try {
            if (row.notes && typeof row.notes === 'string' && row.notes.trim().startsWith('{')) {
              const notesObj = JSON.parse(row.notes);

              // Extract booking dates and times
              bookingDetails.booking_date_end = notesObj.booking_date_end || '';
              bookingDetails.booking_time_end = notesObj.booking_time_end || '';

              // Calculate booking days
              if (notesObj.booking_days) {
                bookingDetails.booking_days = notesObj.booking_days;
              } else if (notesObj.booking_date && notesObj.booking_date_end) {
                const startDate = new Date(notesObj.booking_date);
                const endDate = new Date(notesObj.booking_date_end);
                const diffTime = Math.abs(endDate - startDate);
                bookingDetails.booking_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              }

              // Extract responsible parties
              if (notesObj.responsible_parties && Array.isArray(notesObj.responsible_parties)) {
                bookingDetails.responsible_parties = notesObj.responsible_parties
                  .map(rp => rp && rp.name ? rp.name : 'Unknown')
                  .filter(name => name !== 'Unknown') // Remove unknown entries
                  .join(', ');
              }

              // Extract services ordered with prices
              if (notesObj.services && Array.isArray(notesObj.services)) {
                bookingDetails.service_quantity = notesObj.services.reduce((sum, service) => {
                  const quantity = service && service.quantity ? parseInt(service.quantity) || 1 : 1;
                  return sum + quantity;
                }, 0);
                bookingDetails.services_ordered = notesObj.services
                  .map(service => {
                    if (!service) return 'Unknown';
                    const serviceName = service.service_name || 'Unknown';
                    const quantity = service.quantity ? parseInt(service.quantity) || 1 : 1;
                    const customPrice = service.custom_price ? parseFloat(service.custom_price) || 0 : 0;
                    return `${serviceName} (${quantity}x) - Rp ${customPrice.toLocaleString('id-ID')}`;
                  })
                  .join('\n');
              }

              // Extract additional fees
              if (notesObj.additional_fees && Array.isArray(notesObj.additional_fees)) {
                bookingDetails.additional_fees = notesObj.additional_fees
                  .map(fee => {
                    if (!fee) return '';
                    const description = fee.description || 'Biaya tambahan';
                    const amount = fee.amount ? parseFloat(fee.amount) || 0 : 0;
                    return `${description}: Rp ${amount.toLocaleString('id-ID')}`;
                  })
                  .filter(fee => fee) // Remove empty entries
                  .join('\n');
              }

              // Extract discount and tax
              bookingDetails.discount = notesObj.discount ? parseFloat(notesObj.discount) || 0 : 0;
              bookingDetails.discount_type = notesObj.discount_type || 'rupiah';
              bookingDetails.tax_percentage = notesObj.tax_percentage ? parseFloat(notesObj.tax_percentage) || 0 : 0;

              // Extract user notes
              bookingDetails.user_notes = notesObj.user_notes || '';
            }
          } catch (e) {
            // Ignore parsing errors, use defaults
            console.log('Error parsing booking notes:', e.message);
          }

          worksheet.addRow({
            id: row.id,
            booking_date: formatDate(row.booking_date),
            booking_date_end: bookingDetails.booking_date_end ? formatDate(bookingDetails.booking_date_end) : '',
            booking_time: row.booking_time || '',
            booking_time_end: bookingDetails.booking_time_end || '',
            client_name: row.client_name || '',
            client_phone: row.client_phone || '',
            client_address: row.client_address || '',
            location_name: row.location_name || '',
            responsible_parties: bookingDetails.responsible_parties,
            services_ordered: bookingDetails.services_ordered,
            service_quantity: bookingDetails.service_quantity,
            booking_days: bookingDetails.booking_days,
            additional_fees: bookingDetails.additional_fees,
            discount: bookingDetails.discount || 0,
            tax_percentage: bookingDetails.tax_percentage || 0,
            total_price: row.total_price || 0,
            status: row.status || '',
            payment_status: row.payment_status || 'Belum Bayar',
            amount_paid: row.amount_paid || 0,
            remaining_amount: row.remaining_amount || 0,
            notes: bookingDetails.user_notes
          });
        });
        
        // Apply styling
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${bookings.rows.length} bookings`);
      }
    }

    // Fetch and add Expenses sheet if selected
    if (selection.expenses) {
      let expensesQuery = `SELECT 
        e.id, e.expense_date,
        ec.name as category_name, ec.icon as category_icon, ec.color as category_color,
        e.amount, e.description, e.notes,
        e.created_at, e.updated_at
       FROM expenses e 
       LEFT JOIN expense_categories ec ON e.category_id = ec.id 
       WHERE e.user_id = $1`;
      const params = [userId];
      
      if (selectedIds.expenses && selectedIds.expenses.length > 0) {
        expensesQuery += ' AND e.id = ANY($2::int[])';
        params.push(selectedIds.expenses);
      }
      
      expensesQuery += ' ORDER BY e.expense_date DESC';
      const expenses = await query(expensesQuery, params);
      
      if (expenses.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Pengeluaran');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Tanggal Pengeluaran', key: 'expense_date', width: 22 },
          { header: 'Kategori Pengeluaran', key: 'category_name', width: 28 },
          { header: 'Jumlah', key: 'amount', width: 18 },
          { header: 'Deskripsi', key: 'description', width: 40 },
          { header: 'Catatan', key: 'notes', width: 40 }
        ];
        
        expenses.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            expense_date: formatDate(row.expense_date),
            category_name: row.category_name || '',
            amount: row.amount ? formatCurrency(row.amount) : 'Rp 0',
            description: row.description || '',
            notes: row.notes || ''
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${expenses.rows.length} expenses`);
      }
    }

    // Fetch and add Expense Categories sheet if selected
    if (selection.expenseCategories) {
      let categoriesQuery = `SELECT 
        id, name, icon, color,
        created_at, updated_at
       FROM expense_categories 
       WHERE user_id = $1`;
      const params = [userId];
      
      if (selectedIds.expenseCategories && selectedIds.expenseCategories.length > 0) {
        categoriesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.expenseCategories);
      }
      
      categoriesQuery += ' ORDER BY name';
      const expenseCategories = await query(categoriesQuery, params);
      
      if (expenseCategories.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Kategori Pengeluaran');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama Kategori', key: 'name', width: 32 },
          { header: 'Icon', key: 'icon', width: 14 },
          { header: 'Warna', key: 'color', width: 18 }
        ];
        
        expenseCategories.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            icon: row.icon || '',
            color: row.color || ''
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${expenseCategories.rows.length} expense categories`);
      }
    }

    // Fetch and add Clients sheet if selected
    if (selection.clients) {
      let clientsQuery = `SELECT 
        id, name, phone, address
       FROM clients 
       WHERE user_id = $1`;
      const params = [userId];
      
      if (selectedIds.clients && selectedIds.clients.length > 0) {
        clientsQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.clients);
      }
      
      clientsQuery += ' ORDER BY name';
      const clients = await query(clientsQuery, params);
      
      if (clients.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Klien');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama Klien', key: 'name', width: 32 },
          { header: 'Telepon', key: 'phone', width: 18 },
          { header: 'Alamat', key: 'address', width: 45 }
        ];
        
        clients.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            phone: row.phone || '',
            address: row.address || ''
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${clients.rows.length} clients`);
      }
    }

    // Fetch and add Services sheet if selected
    if (selection.services) {
      let servicesQuery = `SELECT 
        id, name, price, duration
       FROM services 
       WHERE user_id = $1`;
      const params = [userId];
      
      if (selectedIds.services && selectedIds.services.length > 0) {
        servicesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.services);
      }
      
      servicesQuery += ' ORDER BY name';
      const services = await query(servicesQuery, params);
      
      if (services.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Layanan');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama Layanan', key: 'name', width: 32 },
          { header: 'Harga', key: 'price', width: 18 },
          { header: 'Durasi (menit)', key: 'duration', width: 18 }
        ];
        
        services.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            price: row.price ? formatCurrency(row.price) : 'Rp 0',
            duration: row.duration || ''
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${services.rows.length} services`);
      }
    }

    // Fetch and add Responsible Parties sheet if selected
    if (selection.responsibleParties) {
      let responsiblePartiesQuery = `SELECT 
        id, name, phone, address,
        created_at, updated_at
       FROM responsible_parties 
       WHERE user_id = $1`;
      const params = [userId];
      
      if (selectedIds.responsibleParties && selectedIds.responsibleParties.length > 0) {
        responsiblePartiesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.responsibleParties);
      }
      
      responsiblePartiesQuery += ' ORDER BY name';
      const responsibleParties = await query(responsiblePartiesQuery, params);
      
      if (responsibleParties.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Penanggung Jawab');
        
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama', key: 'name', width: 32 },
          { header: 'Telepon', key: 'phone', width: 18 },
          { header: 'Alamat', key: 'address', width: 40 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];
        
        responsibleParties.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            phone: row.phone || '',
            address: row.address || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${responsibleParties.rows.length} responsible parties`);
      }
    }

    // Fetch and add Service Responsible Parties sheet if selected
    if (selection.serviceResponsibleParties) {
      let serviceResponsiblePartiesQuery = `SELECT
        id, name, phone, address, service_id,
        created_at, updated_at
       FROM service_responsible_parties
       WHERE user_id = $1`;
      const params = [userId];

      if (selectedIds.serviceResponsibleParties && selectedIds.serviceResponsibleParties.length > 0) {
        serviceResponsiblePartiesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.serviceResponsibleParties);
      }

      serviceResponsiblePartiesQuery += ' ORDER BY name';
      const serviceResponsibleParties = await query(serviceResponsiblePartiesQuery, params);

      if (serviceResponsibleParties.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Data Penanggung Jawab Layanan');

        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nama', key: 'name', width: 32 },
          { header: 'Telepon', key: 'phone', width: 18 },
          { header: 'Alamat', key: 'address', width: 40 },
          { header: 'ID Layanan', key: 'service_id', width: 12 },
          { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
          { header: 'Tanggal Diupdate', key: 'updated_at', width: 20 }
        ];

        serviceResponsibleParties.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name || '',
            phone: row.phone || '',
            address: row.address || '',
            service_id: row.service_id || '',
            created_at: formatDate(row.created_at),
            updated_at: formatDate(row.updated_at)
          });
        });

        styleWorksheet(worksheet);
        console.log(`  ✅ Exported ${serviceResponsibleParties.rows.length} service responsible parties`);
      }
    }

    // Add company settings sheet (if selected and exists)
    if (selection.companySettings) {
      const companySettings = await query(
        `SELECT 
          company_name, company_address, company_phone, company_email,
          bank_name, account_number, account_holder_name,
          bank_name_alt, account_number_alt, account_holder_name_alt
         FROM company_settings 
         WHERE user_id = $1`,
        [userId]
      );
      
      if (companySettings.rows.length > 0) {
        const worksheet = workbook.addWorksheet('Pengaturan Perusahaan');
        
        worksheet.columns = [
          { header: 'Nama Perusahaan', key: 'company_name', width: 32 },
          { header: 'Alamat', key: 'company_address', width: 48 },
          { header: 'Telepon', key: 'company_phone', width: 18 },
          { header: 'Email', key: 'company_email', width: 30 },
          { header: 'Informasi Rekening', key: 'bank_accounts', width: 50 }
        ];
        
        companySettings.rows.forEach(row => {
          // Build bank accounts info
          let bankAccounts = '';
          if (row.bank_name && row.account_number) {
            bankAccounts += `${row.bank_name}: ${row.account_number}`;
            if (row.account_holder_name) {
              bankAccounts += ` (${row.account_holder_name})`;
            }
            bankAccounts += '\n';
          }
          
          if (row.bank_name_alt && row.account_number_alt) {
            bankAccounts += `${row.bank_name_alt}: ${row.account_number_alt}`;
            if (row.account_holder_name_alt) {
              bankAccounts += ` (${row.account_holder_name_alt})`;
            }
          }
          
          worksheet.addRow({
            company_name: row.company_name || '',
            company_address: row.company_address || '',
            company_phone: row.company_phone || '',
            company_email: row.company_email || '',
            bank_accounts: bankAccounts.trim()
          });
        });
        
        styleWorksheet(worksheet);
        console.log(`  ✅ Exported company settings`);
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=backup_data_${new Date().toISOString().split('T')[0]}.xlsx`);

    console.log(`✅ Export XLSX completed successfully`);
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error exporting to Excel/CSV:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export data: ' + error.message
    });
  }
});

// Export full backup (JSON) - NEW ENDPOINT to avoid browser cache
app.get('/api/backup/download-json', authenticate, enforceTenancy, async (req, res) => {

    // Get selection from query params (default all true)
    const selection = {
      companySettings: req.query.companySettings !== 'false',
      clients: req.query.clients !== 'false',
      services: req.query.services !== 'false',
      responsibleParties: req.query.responsibleParties !== 'false',
      serviceResponsibleParties: req.query.serviceResponsibleParties !== 'false',
      bookings: req.query.bookings !== 'false',
      payments: req.query.payments !== 'false',
      expenses: req.query.expenses !== 'false',
      expenseCategories: req.query.expenseCategories !== 'false'
    };

    // Get selected IDs from query params with better error handling
    const selectedIds = {};
    const idFields = ['clients', 'services', 'responsibleParties', 'serviceResponsibleParties', 'bookings', 'payments', 'expenses', 'expenseCategories'];
    
    idFields.forEach(field => {
      const paramName = `${field}Ids`;
      const paramValue = req.query[paramName];
      
      if (paramValue && paramValue.trim()) {
        try {
          // URL decode first, then parse JSON
          const decodedValue = decodeURIComponent(paramValue);
          selectedIds[field] = JSON.parse(decodedValue);
          
          // Validate that it's an array
          if (!Array.isArray(selectedIds[field])) {
            console.warn(`⚠️ ${paramName} is not an array, converting to array`);
            selectedIds[field] = [selectedIds[field]];
          }
        } catch (error) {
          console.error(`❌ Error parsing ${paramName}:`, error.message, 'Value:', paramValue);
          selectedIds[field] = null;
        }
      } else {
        selectedIds[field] = null;
      }
    });

    console.log('📦 Export selection:', selection);
    console.log('🔍 Selected IDs:', selectedIds);

    const backup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      userId: userId,
      selection: selection, // Include selection info in backup
      data: {}
    };

    // Fetch clients if selected
    if (selection.clients) {
      let clientsQuery = 'SELECT * FROM clients WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.clients && selectedIds.clients.length > 0) {
        clientsQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.clients);
      }
      
      clientsQuery += ' ORDER BY created_at';
      const clients = await query(clientsQuery, params);
      backup.data.clients = clients.rows;
      console.log(`  ✅ Exported ${clients.rows.length} clients`);
    } else {
      backup.data.clients = [];
      console.log(`  ⏭️  Skipped clients`);
    }

    // Fetch services if selected
    if (selection.services) {
      let servicesQuery = 'SELECT * FROM services WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.services && selectedIds.services.length > 0) {
        servicesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.services);
      }
      
      servicesQuery += ' ORDER BY created_at';
      const services = await query(servicesQuery, params);
      backup.data.services = services.rows;
      console.log(`  ✅ Exported ${services.rows.length} services`);
    } else {
      backup.data.services = [];
      console.log(`  ⏭️  Skipped services`);
    }

    // Fetch responsible parties if selected
    if (selection.responsibleParties) {
      let responsiblePartiesQuery = 'SELECT * FROM responsible_parties WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.responsibleParties && selectedIds.responsibleParties.length > 0) {
        responsiblePartiesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.responsibleParties);
      }
      
      responsiblePartiesQuery += ' ORDER BY created_at';
      const responsibleParties = await query(responsiblePartiesQuery, params);
      backup.data.responsibleParties = responsibleParties.rows;
      console.log(`  ✅ Exported ${responsibleParties.rows.length} responsible parties`);
    } else {
      backup.data.responsibleParties = [];
      console.log(`  ⏭️  Skipped responsible parties`);
    }

    // Fetch service responsible parties if selected
    if (selection.serviceResponsibleParties) {
      let serviceResponsiblePartiesQuery = 'SELECT * FROM service_responsible_parties WHERE user_id = $1';
      const params = [userId];
      
      if (selectedIds.serviceResponsibleParties && selectedIds.serviceResponsibleParties.length > 0) {
        serviceResponsiblePartiesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.serviceResponsibleParties);
      }
      
      serviceResponsiblePartiesQuery += ' ORDER BY created_at';
      const serviceResponsibleParties = await query(serviceResponsiblePartiesQuery, params);
      backup.data.serviceResponsibleParties = serviceResponsibleParties.rows;
      console.log(`  ✅ Exported ${serviceResponsibleParties.rows.length} service responsible parties`);
    } else {
      backup.data.serviceResponsibleParties = [];
      console.log(`  ⏭️  Skipped service responsible parties`);
    }

    // Fetch bookings if selected (with client and service names for duplicate detection)
    if (selection.bookings) {
      let bookingsQuery = `
        SELECT b.*,
               c.name as client_name,
               s.name as service_name
        FROM bookings b
        LEFT JOIN clients c ON b.client_id = c.id
        LEFT JOIN services s ON b.service_id = s.id
        WHERE b.user_id = $1
      `;
      const params = [userId];
      
      if (selectedIds.bookings && selectedIds.bookings.length > 0) {
        bookingsQuery += ' AND b.id = ANY($2::int[])';
        params.push(selectedIds.bookings);
      }
      
      bookingsQuery += ' ORDER BY b.created_at';
      const bookings = await query(bookingsQuery, params);
      backup.data.bookings = bookings.rows;
      console.log(`  ✅ Exported ${bookings.rows.length} bookings (with client & service names)`);
    } else {
      backup.data.bookings = [];
      console.log(`  ⏭️  Skipped bookings`);
    }

    // Fetch payments if selected
    if (selection.payments) {
      let paymentsQuery = `SELECT p.* FROM payments p 
                           INNER JOIN bookings b ON p.booking_id = b.id 
                           WHERE b.user_id = $1`;
      const params = [userId];
      
      if (selectedIds.payments && selectedIds.payments.length > 0) {
        paymentsQuery += ' AND p.id = ANY($2::int[])';
        params.push(selectedIds.payments);
      }
      
      paymentsQuery += ' ORDER BY p.created_at';
      const payments = await query(paymentsQuery, params);
      backup.data.payments = payments.rows;
      console.log(`  ✅ Exported ${payments.rows.length} payments`);
    } else {
      backup.data.payments = [];
      console.log(`  ⏭️  Skipped payments`);
    }

    // Fetch expense categories if selected (including default/system categories)
    if (selection.expenseCategories) {
      let categoriesQuery = 'SELECT * FROM expense_categories WHERE (user_id = $1 OR user_id IS NULL)';
      const params = [userId];
      
      if (selectedIds.expenseCategories && selectedIds.expenseCategories.length > 0) {
        categoriesQuery += ' AND id = ANY($2::int[])';
        params.push(selectedIds.expenseCategories);
      }
      
      categoriesQuery += ' ORDER BY is_default DESC, created_at';
      const expenseCategories = await query(categoriesQuery, params);
      backup.data.expenseCategories = expenseCategories.rows;
      console.log(`  ✅ Exported ${expenseCategories.rows.length} expense categories (including defaults)`);
    } else {
      backup.data.expenseCategories = [];
      console.log(`  ⏭️  Skipped expense categories`);
    }

    // Fetch expenses if selected (with category name for duplicate detection)
    if (selection.expenses) {
      let expensesQuery = `
        SELECT e.*,
               ec.name as category_name
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        WHERE e.user_id = $1
      `;
      const params = [userId];
      
      if (selectedIds.expenses && selectedIds.expenses.length > 0) {
        expensesQuery += ' AND e.id = ANY($2::int[])';
        params.push(selectedIds.expenses);
      }
      
      expensesQuery += ' ORDER BY e.created_at';
      const expenses = await query(expensesQuery, params);
      backup.data.expenses = expenses.rows;
      console.log(`  ✅ Exported ${expenses.rows.length} expenses (with category names)`);
    } else {
      backup.data.expenses = [];
      console.log(`  ⏭️  Skipped expenses`);
    }

    // Fetch company settings if selected (including bank info)
    if (selection.companySettings) {
      const companySettings = await query(
        'SELECT * FROM company_settings WHERE user_id = $1',
        [userId]
      );
      backup.data.companySettings = companySettings.rows[0] || null;
      if (companySettings.rows[0]) {
        const hasBank = !!(companySettings.rows[0].bank_name || companySettings.rows[0].account_number);
        console.log(`  ✅ Exported company settings ${hasBank ? '(with bank info)' : '(no bank info)'}`);
      } else {
        console.log(`  ✅ Exported company settings (empty)`);
      }
    } else {
      backup.data.companySettings = null;
      console.log(`  ⏭️  Skipped company settings`);
    }

    console.log('✅ Export completed successfully');

    // Set headers and send as download
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=backup_full_data_${new Date().toISOString().split('T')[0]}.json`);
    // Prevent browser caching to ensure fresh JSON export
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

