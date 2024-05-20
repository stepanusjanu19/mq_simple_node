const express = require("express");
const config = require("../config/config");
const amqp = require("amqplib");

const routes = express.Router();

async function sendQueue(queue, msg){
    var json;
    try{
        const connection = await amqp.connect(config.rabbitmqurl);
        const channel = await connection.createChannel();

        if(typeof msg === "string" && msg.trim() !== "")
        {
            json = msg;
        }
        if((typeof msg === "object" || typeof msg === "array") && JSON.stringify(msg) !== "")
        {
            json = JSON.stringify(msg);
        }
        else{
            console.log("............");
            console.log(`Invalid message ${msg}`);
            console.log("............");
        }

        await channel.assertQueue(queue, { durable: false, persistent: false });
        await channel.sendToQueue(queue, Buffer.from(json));
        console.log(`Send message to : ${json}`);

        await channel.close();
        await connection.close();
    }
    catch (e) {
        console.error(`Error message while not sending message : ${e}`);
    }
}




// async function consumeQueue(queue)
// {
//     try{
//         const connection = await amqp.connect(config.rabbitmqurl);
//         const channel = await connection.createChannel()
//
//         await channel.assertQueue(queue, { durable: false, persistent: false });
//         console.log(`Waiting for message to ${queue}. To exit press ctrl + c`);
//
//         return new Promise(async (resolve, reject) => {
//             await channel.consume(queue, ( msgs ) =>{
//                 if(msgs !== null)
//                 {
//                     console.log(`Received messages : ${msgs.content.toString()}`);
//                     resolve(msgs.content.toString());
//                 }else{
//                     reject(new Error('No messages received'));
//                 }
//                 channel.ack(msgs);
//             }, { noAck: false });
//         });
//
//     }
//     catch (e) {
//         console.error(`Error message while not received message : ${e}`);
//         throw e;
//     }
//
// }

routes.post("/service_antrian", async (req, res) => {
    console.log(req.body);
    var queue = "post_a";

    await sendQueue(queue, req.body);
    res.send(`Send Antrian : ${JSON.stringify(req.body)}`);
});


routes.post("/service_kunjungan", async (req, res) => {
    console.log(req.body);
    var queue = "post_b";

    await sendQueue(queue, req.body);
    res.send(`Send Kunjungan : ${JSON.stringify(req.body)}`);
});


module.exports = routes;