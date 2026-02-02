const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(__dirname, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Default data structure
const defaultData = {
    budget: {
        blocked: 934,
        job: 538,
        expenses: { rent: 400, food: 200, transport: 50, entertainment: 50, other: 30 }
    },
    ledger: { entries: [] },
    tasks: [],
    events: [],
    food: [
        { id: 1, name: 'Vegetables & Fruits', cost: 40 },
        { id: 2, name: 'Rice & Staples', cost: 15 },
        { id: 3, name: 'Meat/Protein', cost: 30 },
        { id: 4, name: 'Snacks & Drinks', cost: 15 }
    ],
    goals: [],
    schedule: [
        { id: 1, name: 'Studies', emoji: '📚', targetHours: 25, loggedHours: 0, color: 'blue' },
        { id: 2, name: 'Student Job', emoji: '💼', targetHours: 17, loggedHours: 0, color: 'emerald' },
        { id: 3, name: 'Freelancing', emoji: '💻', targetHours: 6, loggedHours: 0, color: 'purple' },
        { id: 4, name: 'Travel/Rest', emoji: '✈️', targetHours: 10, loggedHours: 0, color: 'amber' },
        { id: 5, name: 'Exercise', emoji: '🏋️', targetHours: 4, loggedHours: 0, color: 'rose' },
        { id: 6, name: 'Leisure', emoji: '🎮', targetHours: 8, loggedHours: 0, color: 'indigo' }
    ],
    settings: { currency: '€', theme: 'light' }
};

// Helpers
function getUsers() {
    if (fs.existsSync(USERS_FILE)) {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
    return [];
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUserDataFile(username) {
    return path.join(DATA_DIR, `${username}.json`);
}

function loadData(username) {
    if (!username) return { ...defaultData };
    const filePath = getUserDataFile(username);
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (err) {
        console.error(`Error loading data for ${username}:`, err);
    }
    return { ...defaultData };
}

function saveData(username, data) {
    if (!username) return false;
    const filePath = getUserDataFile(username);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`Error saving data for ${username}:`, err);
        return false;
    }
}

// API Routes

// Auth Routes
app.post('/api/auth/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    users.push({ username, password });
    saveUsers(users);

    // Init data for new user
    saveData(username, defaultData);

    res.json({ success: true, message: 'Account created' });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({ success: true, username: user.username });
});

// Middleware for protected routes
function requireAuth(req, res, next) {
    const username = req.headers['username'];
    if (!username) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.username = username;
    next();
}

app.get('/api/data', requireAuth, (req, res) => {
    const data = loadData(req.username);
    res.json(data);
});

app.post('/api/save', requireAuth, (req, res) => {
    const data = req.body;
    if (saveData(req.username, data)) {
        res.json({ success: true, message: 'Data saved successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Paderborn Navigator running at http://localhost:${PORT}`);
});
