const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/birthday_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    birthday: Date,
    location: String,
});

const User = mongoose.model('User', userSchema);

// Routes
app.post('/user', async(req, res) => {
    try {
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/user/:id', async(req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/user/:id', async(req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.sendStatus(204);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Schedule birthday messages
cron.schedule('0 9 * * *', async() => {
    const now = new Date();
    const users = await User.find({ birthday: now });

    users.forEach((user) => {
        const localTime = moment(user.birthday).tz(user.location).format('h:mm A');
        const message = `Hey, ${user.firstName} ${user.lastName}, it's your birthday at ${localTime}`;
        sendBirthdayMessage(message);
    });
});

async function sendBirthdayMessage(message) {
    try {
        const hookbinEndpoint = 'https://hookb.in/YOUR_HOOKBIN_ENDPOINT'; // Replace with your Hookbin endpoint
        await axios.post(hookbinEndpoint, { message });
        console.log(`Birthday message sent: ${message}`);
    } catch (error) {
        console.error('Error sending birthday message:', error.message);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});