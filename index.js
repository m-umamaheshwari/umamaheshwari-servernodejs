const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_test_6ch5NwML1YVuVQ',         // 🔁 Replace with your Razorpay key_id
  key_secret: 'uFjimyg3p8uADNKW5GZzrYmr'     // 🔁 Replace with your Razorpay key_secret
});

// Utilities to read/write order data
const readData = () => {
  if (fs.existsSync('orders.json')) {
    const data = fs.readFileSync('orders.json');
    return JSON.parse(data.toString());
  }
  return [];
};

const writeData = (data) => {
  fs.writeFileSync('orders.json', JSON.stringify(data, null, 2));
};

// Initialize empty orders.json if missing
if (!fs.existsSync('orders.json')) {
  writeData([]);
}

// Home route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API to create Razorpay order
app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'receipt#1', notes = {} } = req.body;

    const options = {
      amount: amount * 100, // convert to paise
      currency,
      receipt,
      notes
    };

    const order = await razorpay.orders.create(options);

    const orders = readData();
    orders.push({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: 'created',
    });

    writeData(orders);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating order');
  }
});

// Route for success page
app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'success.html'));
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
