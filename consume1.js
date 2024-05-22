const amqp = require("amqplib");
const config = require("./config/config");
const Bottleneck = require("bottleneck");

const limiter = new Bottleneck({
	maxConcurrent: 1,
	minTime: 3000,
});

var queue = "post_a";

async function consumeMessage() {
	try {
		const connection = await amqp.connect(config.rabbitmqurl);
		const channel = await connection.createChannel();

		await channel.assertQueue(queue, { durable: false, persistent: false });
		console.log(`Waiting for message to ${queue}. To exit press ctrl + c`);

		await new Promise(async (resolve, reject) => {
			await channel.consume(
				queue,
				(msgs) => {
					if (msgs !== null) {
						console.log(
							`Received messages : ${JSON.parse(msgs.content)["text"]}`
						);
						limiter.schedule(() =>
							hitAPI(`${JSON.parse(msgs.content)["text"]}`).then(() =>
								channel.ack(msgs)
							)
						);
						// resolve(msgs.content.toString());
					} else {
						reject(new Error("No messages received"));
					}
					// channel.ack(msgs);
				},
				{ noAck: false }
			);
		});
	} catch (e) {
		console.error(`Error message while not received message : ${e}`);
		throw e;
	}
}

async function hitAPI(msg) {
	await fetch("http://127.0.0.1:8000/api/callEvent", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			id: 2,
			message: msg,
		}),
	});
}

consumeMessage();
