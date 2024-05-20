const express = require("express");
const body = require("body-parser");
const ipaddr = require("ip");
const config = require("./config/config");
const routes = require("./routes/routes");

const app = express();

app.use(body.json());

app.use("/", routes);

app.use((err, req, res, next) => {
    if(res._headerSent)
    {
        return next(err);
    }
    res.status(500).send("Internal server err");
});

app.listen(config.port, () => console.log(`Listen publisher running ${ipaddr.address()}:${config.port}`));