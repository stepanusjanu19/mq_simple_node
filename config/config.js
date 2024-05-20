require("dotenv").config();

const config = {
    port: 5000,
    rabbitmqurl : process.env.AMPQ_URL
}

module.exports = config