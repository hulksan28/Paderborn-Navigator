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
                { id: 1, name: 'Bread (Wholemeal 500g)', cost: 1.89, emoji: '🍞' },
                { id: 2, name: 'Milk (1L)', cost: 1.25, emoji: '🥛' },
                { id: 3, name: 'Eggs (10 pack)', cost: 2.89, emoji: '🥚' },
                { id: 4, name: 'Butter (250g)', cost: 2.49, emoji: '🧈' },
                { id: 5, name: 'Cheese Gouda (150g)', cost: 1.89, emoji: '🧀' },
                { id: 6, name: 'Chicken Breast (1kg)', cost: 7.32, emoji: '🍗' },
                { id: 7, name: 'Ground Beef (500g)', cost: 4.99, emoji: '🥩' },
                { id: 8, name: 'Pasta (1kg)', cost: 2.78, emoji: '🍝' },
                { id: 9, name: 'Rice Basmati (1kg)', cost: 2.99, emoji: '🍚' },
                { id: 10, name: 'Potatoes (1kg)', cost: 0.97, emoji: '🥔' },
                { id: 11, name: 'Apples (1kg)', cost: 2.20, emoji: '🍎' },
                { id: 12, name: 'Bananas (1kg)', cost: 1.49, emoji: '🍌' },
                { id: 13, name: 'Tomatoes (500g)', cost: 1.79, emoji: '🍅' },
                { id: 14, name: 'Onions (1kg)', cost: 1.29, emoji: '🧅' },
                { id: 15, name: 'Cucumber', cost: 0.80, emoji: '🥒' },
                { id: 16, name: 'Sunflower Oil (1L)', cost: 2.69, emoji: '🫒' },
                { id: 17, name: 'Coffee (200g)', cost: 4.99, emoji: '☕' },
                { id: 18, name: 'Orange Juice (1L)', cost: 1.99, emoji: '🍊' },
                { id: 19, name: 'Yogurt (500g)', cost: 1.49, emoji: '🥄' },
                { id: 20, name: 'Oat Flakes (1kg)', cost: 1.98, emoji: '🥣' }
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

// ============ AI ROUTES (Groq) ============
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// AI Chat Assistant
app.post('/api/ai/chat', async (req, res) => {
    try {
        const username = req.headers['username'];
        if (!username) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { message } = req.body;
        const userData = user.data;

        // Build context from user's data
        const totalExpenses = Object.values(userData.budget?.expenses || {}).reduce((a, b) => a + b, 0);
        const totalIncome = (userData.budget?.blocked || 0) + (userData.budget?.job || 0);
        const ledgerEntries = userData.ledger?.entries || [];
        const recentTransactions = ledgerEntries.slice(-10);
        const pendingTasks = (userData.tasks || []).filter(t => !t.done).length;
        const schedule = userData.schedule || [];
        const goals = userData.goals || [];

        const systemPrompt = `You are a helpful AI assistant for a student finance and productivity app called "Paderborn Navigator". 
You help users manage their budget, track expenses, plan their study schedule, and achieve their goals.

USER'S CURRENT DATA:
- Monthly Income: €${totalIncome} (Blocked funds: €${userData.budget?.blocked || 0}, Job income: €${userData.budget?.job || 0})
- Monthly Expenses Budget: €${totalExpenses} (Rent: €${userData.budget?.expenses?.rent || 0}, Food: €${userData.budget?.expenses?.food || 0}, Transport: €${userData.budget?.expenses?.transport || 0}, Entertainment: €${userData.budget?.expenses?.entertainment || 0}, Other: €${userData.budget?.expenses?.other || 0})
- Available Balance: €${totalIncome - totalExpenses}
- Recent Transactions: ${JSON.stringify(recentTransactions)}
- Pending Tasks: ${pendingTasks}
- Weekly Schedule: ${schedule.map(s => `${s.name}: ${s.loggedHours}/${s.targetHours} hrs`).join(', ')}
- Savings Goals: ${goals.map(g => `${g.name}: €${g.current}/€${g.target}`).join(', ') || 'None set'}

Be concise, friendly, and give actionable advice. Use emojis occasionally. Keep responses under 150 words.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 300
        });

        res.json({ response: completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.' });
    } catch (err) {
        console.error('AI Chat error:', err);
        res.status(500).json({ error: 'AI service error' });
    }
});

// AI Spending Insights
app.post('/api/ai/insights', async (req, res) => {
    try {
        const username = req.headers['username'];
        if (!username) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userData = user.data;
        const ledgerEntries = userData.ledger?.entries || [];
        const totalExpenses = Object.values(userData.budget?.expenses || {}).reduce((a, b) => a + b, 0);
        const totalIncome = (userData.budget?.blocked || 0) + (userData.budget?.job || 0);
        const goals = userData.goals || [];

        const prompt = `Analyze this student's financial data and provide 3-4 specific, actionable insights:

BUDGET:
- Monthly Income: €${totalIncome}
- Monthly Expenses: €${totalExpenses}
- Breakdown: Rent €${userData.budget?.expenses?.rent}, Food €${userData.budget?.expenses?.food}, Transport €${userData.budget?.expenses?.transport}, Entertainment €${userData.budget?.expenses?.entertainment}, Other €${userData.budget?.expenses?.other}

RECENT TRANSACTIONS (last 15):
${JSON.stringify(ledgerEntries.slice(-15))}

SAVINGS GOALS:
${goals.map(g => `${g.name}: €${g.current} saved of €${g.target} target`).join('\n') || 'No goals set'}

Provide insights in this JSON format:
{
  "insights": [
    { "emoji": "💡", "title": "Short Title", "description": "Actionable advice in 1-2 sentences" }
  ],
  "savingsRate": "X%",
  "healthScore": "Good/Fair/Needs Attention"
}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 500
        });

        let response = completion.choices[0]?.message?.content || '{}';
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            res.json({ insights: [{ emoji: '📊', title: 'Analysis', description: response }], savingsRate: 'N/A', healthScore: 'N/A' });
        }
    } catch (err) {
        console.error('AI Insights error:', err);
        res.status(500).json({ error: 'AI service error' });
    }
});

// AI Schedule Optimizer
app.post('/api/ai/optimize-schedule', async (req, res) => {
    try {
        const username = req.headers['username'];
        if (!username) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userData = user.data;
        const schedule = userData.schedule || [];
        const tasks = userData.tasks || [];
        const events = userData.events || [];

        const prompt = `You are a productivity coach. Analyze this student's weekly schedule and provide optimization suggestions:

CURRENT WEEKLY TIME ALLOCATION:
${schedule.map(s => `- ${s.emoji} ${s.name}: Target ${s.targetHours}hrs, Logged ${s.loggedHours}hrs (${Math.round((s.loggedHours / s.targetHours) * 100) || 0}% complete)`).join('\n')}

PENDING TASKS:
${tasks.filter(t => !t.done).map(t => `- ${t.text} (Priority: ${t.priority || 'medium'})`).join('\n') || 'No pending tasks'}

UPCOMING EVENTS:
${events.slice(0, 5).map(e => `- ${e.title} on ${e.date}`).join('\n') || 'No upcoming events'}

Provide optimization suggestions in this JSON format:
{
  "suggestions": [
    { "emoji": "⏰", "title": "Short Title", "action": "Specific actionable suggestion" }
  ],
  "focusArea": "Which area needs most attention",
  "balanceScore": "Good/Fair/Needs Work"
}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 500
        });

        let response = completion.choices[0]?.message?.content || '{}';
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            res.json({ suggestions: [{ emoji: '📅', title: 'Advice', action: response }], focusArea: 'N/A', balanceScore: 'N/A' });
        }
    } catch (err) {
        console.error('AI Schedule error:', err);
        res.status(500).json({ error: 'AI service error' });
    }
});

// AI Food Price Refresh
app.post('/api/ai/refresh-prices', async (req, res) => {
    try {
        const username = req.headers['username'];
        if (!username) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const currentFood = user.data?.food || [];
        const foodNames = currentFood.map(f => f.name).join(', ');

        const prompt = `You are a German grocery price expert. Provide current estimated prices for common grocery items available at German supermarkets (Aldi, Lidl, REWE) in 2024/2025.

Current items to price: ${foodNames}

Also suggest 5-10 additional common German grocery items that students frequently buy.

Return a JSON array of food items with this exact format:
{
  "items": [
    { "name": "Item Name (quantity)", "cost": 1.99, "emoji": "🥕" }
  ],
  "lastUpdated": "date string"
}

Be realistic with German Euro prices. Include items like: bread, milk, eggs, cheese, meat, pasta, rice, fruits, vegetables, cooking oil, coffee, etc.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 1000
        });

        let response = completion.choices[0]?.message?.content || '{}';
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const newFood = (parsed.items || []).map((item, idx) => ({
                id: idx + 1,
                name: item.name,
                cost: parseFloat(item.cost) || 0,
                emoji: item.emoji || '🛒'
            }));

            // Update user's food list
            await User.findOneAndUpdate(
                { username },
                { 'data.food': newFood }
            );

            res.json({ success: true, food: newFood, lastUpdated: parsed.lastUpdated || new Date().toISOString() });
        } else {
            res.status(500).json({ error: 'Could not parse AI response' });
        }
    } catch (err) {
        console.error('AI Price Refresh error:', err);
        res.status(500).json({ error: 'AI service error' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
