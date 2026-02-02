require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✓ Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    data: {
        budget: {
            blocked: { type: Number, default: 934 },
            job: { type: Number, default: 538 },
            expenses: {
                rent: { type: Number, default: 400 },
                food: { type: Number, default: 200 },
                transport: { type: Number, default: 50 },
                entertainment: { type: Number, default: 50 },
                other: { type: Number, default: 30 }
            }
        },
        ledger: { entries: { type: Array, default: [] } },
        tasks: { type: Array, default: [] },
        events: { type: Array, default: [] },
        food: {
            type: Array, default: [
                { id: 1, name: 'Vegetables & Fruits', cost: 40 },
                { id: 2, name: 'Rice & Staples', cost: 15 },
                { id: 3, name: 'Meat/Protein', cost: 30 },
                { id: 4, name: 'Snacks & Drinks', cost: 15 }
            ]
        },
        goals: { type: Array, default: [] },
        schedule: {
            type: Array, default: [
                { id: 1, name: 'Studies', emoji: '📚', targetHours: 25, loggedHours: 0, color: 'blue' },
                { id: 2, name: 'Student Job', emoji: '💼', targetHours: 17, loggedHours: 0, color: 'emerald' },
                { id: 3, name: 'Freelancing', emoji: '💻', targetHours: 6, loggedHours: 0, color: 'purple' },
                { id: 4, name: 'Travel/Rest', emoji: '✈️', targetHours: 10, loggedHours: 0, color: 'amber' },
                { id: 5, name: 'Exercise', emoji: '🏋️', targetHours: 4, loggedHours: 0, color: 'rose' },
                { id: 6, name: 'Leisure', emoji: '🎮', targetHours: 8, loggedHours: 0, color: 'indigo' }
            ]
        },
        settings: {
            currency: { type: String, default: '€' },
            theme: { type: String, default: 'light' }
        }
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const newUser = new User({ username, password });
        await newUser.save();
        res.json({ success: true, message: 'Account created' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Data Routes
app.get('/api/data', async (req, res) => {
    try {
        const username = req.headers['username'];
        if (!username) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.data);
    } catch (err) {
        console.error('Get data error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/save', async (req, res) => {
    try {
        const username = req.headers['username'];
        if (!username) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await User.findOneAndUpdate(
            { username },
            { data: req.body },
            { new: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Save error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
