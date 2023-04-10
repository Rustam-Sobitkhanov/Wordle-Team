const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to database');
    })
    .catch((error) => {
        console.log('Error connecting to database:', error.message);
    });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    score: { type: Number, default: 0 }
});

const User = mongoose.model('WordleUser', userSchema);

app.use(express.json());

app.post('/signup/:username/:password', async (req, res) => {
    const { username, password } = req.params;
    console.log(username, password);

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    try {

	
	const user = new User({ username, password: hash });
        console.log(user);
	await user.save();
        res.status(201).send('User created');
    } catch (error) {
        console.log(error);
	res.status(500).send('Error creating user');
    }
});

app.post('/login/:username/:password', async (req, res) => {
    const { username, password } = req.params;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).send('Invalid username or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send('Invalid username or password');
        }

        res.send({ username: user.username, score: user.score });
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, { _id: 0, username: 1, score: 1 });
        const userMap = {};
        users.forEach((user) => {
            userMap[user.username] = user.score;
        });
        res.send(userMap);
    } catch (error) {
        res.status(500).send('Error getting users');
    }
});

app.post('/updateScore/:username/:score', async (req, res) => {
    const { username, score } = req.params;

    if (!username || !score) {
        return res.status(400).send('Username and score are required');
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).send('Invalid username');
        }

        user.score = score;
        await user.save();

        res.send({ username: user.username, score: user.score });
    } catch (error) {
        res.status(500).send('Error updating score');
    }
});

app.listen(80, () => {
    console.log('Server listening on port 80');
});
