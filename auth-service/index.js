const express = require('express');
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');

const User = require('./User');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 7070;

mongoose.connect('mongodb://localhost:27017/auth-service', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log(`auth service DB connected`))

app.use(express.json());

//! register
app.post('/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.json({ message: "User already exists" })
    } else {
        const newUser = new User({
            name, password, email
        });
        newUser.save();
        return res.json(newUser)
    }

})

// login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'User doesnt exist ' })

    if (password !== password) {
        return res.json({ message: 'password Incorrect' })
    }

    const payload = {
        email,
        name: user.name
    };
    jwt.sign(payload, 'secret', (err, token) => {
        if (err) console.log(err);
        else {
            return res.json({ token })
        }
    })
})


app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT}`);
})