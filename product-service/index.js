const express = require('express');
const mongoose = require('mongoose');

const isAuthenticated = require('../isAuthenticated')


const amqp = require('amqplib');

const Product = require('./Product');

const app = express()
const PORT = process.env.PRODUCT_SERVICE_PORT || 8080;

var channel, connection

var order;

mongoose.connect('mongodb://localhost:27017/product-service', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log(`product service DB connected`))

app.use(express.json());

async function connect() {
    const amqServer = "amqp://guest:guest@localhost:55005/";
    connection = await amqp.connect(amqServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT")
}

connect()

// create a new Product
// buy a Product
app.post('/product/create', isAuthenticated, async (req, res) => {
    //req.user.email
    const { name, description, price } = req.body;
    const newProduct = new Product({
        name, description, price
    })
    await newProduct.save();
    return res.json(newProduct)
})

// user sends a list of products Ids to buy

// create an order with those products and total value


app.post('/product/buy', isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });
    channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
        products,
        userEmail: req.user.email
    })))
    channel.consume("PRODUCT", data => {
        console.log(JSON.parse(data.content));
        order = JSON.parse(data.content);
        channel.ack(data);
    })
    return res.json(order);
})

app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT}`);
})