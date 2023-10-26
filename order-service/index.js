const express = require('express');
const mongoose = require('mongoose');

const isAuthenticated = require('../isAuthenticated')


const amqp = require('amqplib');

const Order = require('./Order');

const app = express()
const PORT = process.env.PRODUCT_SERVICE_PORT || 9090;

var channel, connection

mongoose.connect('mongodb://localhost:27017/order-service', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log(`auth service DB connected`))

app.use(express.json());

async function connect() {
    const amqServer = "amqp://guest:guest@localhost:55005/";
    connection = await amqp.connect(amqServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER")
}

const createOrder = async (products, userEmail) => {
    let total = 0;
    for (let t = 0; t < products.length; t++) {
        total += products[t].price;
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        totalPrice: total
    })
    await newOrder.save()
    return newOrder;
}

connect().then(() => {
    channel.consume("ORDER", async data => {
        const { products, userEmail } = JSON.parse(data.content);
        const newOrder = await createOrder(products, userEmail)
        channel.ack(data);
        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ newOrder })))
    })
})


app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT}`);
})