const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// 1. Mock Data (The "Map" data)
let slots = [
  { slot_id: 1, code: 'A1', status: 'AVAILABLE', price_per_hour: 5 },
  { slot_id: 2, code: 'A2', status: 'OCCUPIED', price_per_hour: 5 },
  { slot_id: 3, code: 'A3', status: 'AVAILABLE', price_per_hour: 5 },
  { slot_id: 4, code: 'B1', status: 'RESERVED', price_per_hour: 8 },
  { slot_id: 5, code: 'B2', status: 'AVAILABLE', price_per_hour: 8 },
  { slot_id: 6, code: 'B3', status: 'AVAILABLE', price_per_hour: 8 },
];

let users = [
  { id: 1, email: 'user@example.com', password: 'password', role: 'USER' },
  { id: 2, email: 'admin@example.com', password: 'adminpass', role: 'ADMIN' },
];

// 2. Health Check
app.get('/', (req, res) => {
  res.send('Backend is LIVE on port 5001');
});

// 3. Login Route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: 'mock-token-123', user: { id: user.id, email: user.email, role: user.role } });
});

// 4. GET SLOTS (This fixes your 404 error!)
app.get('/api/slots', (req, res) => {
  res.json(slots);
});

// 5. POST BOOKING
app.post('/api/bookings', (req, res) => {
  const { slot_id } = req.body;
  const slot = slots.find(s => s.slot_id === slot_id);
  if (slot) slot.status = 'RESERVED'; // Update status in memory
  res.json({ success: true, message: 'Slot reserved' });
});

// 6. POST PAYMENT
app.post('/api/payments', (req, res) => {
  res.json({ success: true });
});
// 7. ADMIN: Add New Parking Lot
app.post('/api/lots', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: 'Lot name is required' });
  }

  console.log(`🏗️ Admin Action: New Parking Lot added -> ${name}`);
  
  // In a real app, you would do: db.query('INSERT INTO lots...')
  // For this mock, we just return success
  res.json({ 
    success: true, 
    message: `Lot ${name} added successfully` 
  });
});
app.listen(PORT, () => {
  console.log(`\n🚀 SUCCESS: Mock backend running on http://localhost:${PORT}`);
});
