const amqp = require("amqplib");
const config = require("./config/config");

var queue = "post_a";

async function consumeMessage()
{
    try{
        const connection = await amqp.connect(config.rabbitmqurl);
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, { durable: false, persistent: false });
        console.log(`Waiting for message to ${queue}. To exit press ctrl + c`);

        await new Promise(async (resolve, reject) => {
            await channel.consume(queue, ( msgs ) =>{
                if(msgs !== null)
                {
                    console.log(`Received messages : ${msgs.content.toString()}`);
                    resolve(msgs.content.toString());
                }else{
                    reject(new Error('No messages received'));
                }
                channel.ack(msgs);
            }, { noAck: false });
        });

    }
    catch (e) {
        console.error(`Error message while not received message : ${e}`);
        throw e;
    }
}

consumeMessage();
