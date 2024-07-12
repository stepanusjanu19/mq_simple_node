const amqp = require("amqplib");
const config = require("./config/config");
const { default: axios } = require("axios");

const queuesName = "queue_antrian/192.168.9.221";
const arrQueue = [];
var announcementState = false;

async function consumeQueues() {
  try {
    const connection = await amqp.connect(config.rabbitmqurl);
    const channel = await connection.createChannel();

    await channel.assertQueue(queuesName, {
      durable: false,
      persistent: false,
    });
    console.log(
      `Waiting for queue from ${queuesName}... Press Ctrl + C to exit.`
    );

    // Consume the queue one by one
    channel.prefetch(1);

    await new Promise(async (resolve, reject) => {
      channel.consume(
        queuesName,
        (msgs) => {
          if (msgs !== null) {
            var queueData = JSON.parse(msgs.content);
            console.log(`Received message: ${queueData.text}`);

            // Put the queue into an array
            arrQueue.push(queueData);

            // Run if queue sound doesn't play
            if (!announcementState) {
              // Pop the queue from Queue Array
              var dataQueue = arrQueue.shift();
              console.log(
                `Message from queues: ${dataQueue.data.queue.DisplayID}`
              );

              // Hit API
              hitAPI(dataQueue).then(() => channel.ack(msgs));
            } else {
              reject(new Error("No queue received"));
            }
          }
        },
        { noAck: false }
      );
    });
  } catch (error) {
    console.log(`Error message while not received message: ${error}`);
  }
}

const configVoiceAPI = function (text) {
  return {
    headers: {
      "Content-Type": "application/json",
    },
    url: "http://127.0.0.1:5000/text-to-speech",
    data: {
      text: text,
    },
    method: "POST",
    onUploadProgress: () => {
      announcementState = true;
      console.log(`Suara sedang keluar: ${announcementState}`);
    },
  };
};

const configSaveDataAPI = function (queue) {
  return {
    headers: {
      "Content-Type": "application/json",
    },
    url: "http://127.0.0.1:8000/api/displayCalledQueue",
    data: {
      data: JSON.stringify(queue),
    },
    method: "POST",
  };
};

const configUpdateQueueAfterCallFinishedAPI = function (queue) {
  return {
    headers: {
      "Content-Type": "application/json",
    },
    url: "http://127.0.0.1:8000/api/updateQueueAfterCallFinished",
    data: {
      data: JSON.stringify(queue),
    },
    method: "POST",
  };
};

async function hitAPI(dataQueue) {
  try {
    return await axios(configSaveDataAPI(dataQueue.data))
      .then(async (responseSaveData) => {
        // Handle response save data API request
        if (responseSaveData.status === 200) {
          console.log("Simpan data berhasil");

          // Pause for about 1 seconds before requesting to voice API
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const responseVoice = await axios(configVoiceAPI(dataQueue.text));
          // Handle response voice API request
          if (responseVoice.status === 200) {
            announcementState = false;
            console.log("Suara telah selesai");

            const responseUpdateQueue = await axios(
              configUpdateQueueAfterCallFinishedAPI(dataQueue.data)
            );
            if (responseUpdateQueue.status === 200) {
              console.log("Update FinishCallTime success");
              console.log(responseUpdateQueue);
            } else if (responseUpdateQueue.status === 500) {
              console.log("Update FinishCallTime error");
              console.log(responseUpdateQueue);
            }
          } else {
            announcementState = false;
            console.log("Suara gagal");
          }
        } else {
          console.log("Simpan data gagal");
        }
      })
      .catch((error) => {
        announcementState = false;
        console.log(`Error request save data API: ${error.message}`);
      })
      .finally(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      });
  } catch (error) {
    announcementState = false;
    console.log(error.message);
  }
}

consumeQueues();
