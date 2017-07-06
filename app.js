var restify = require("restify");
var builder = require("botbuilder");
var bot = require("./botFunctions");

//Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log("%s listening to %s", server.name, server.url);
});

//Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "6e2c3b02-a2cb-4921-b496-a718376d7e8b",
    appPassword: "nOBcppsa0PiU4KA3606QUta"
    //appId: process.env.MICROSOFT_APP_ID,
    //appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//Listen for messages from users
server.post("/api/messages", connector.listen());

//Init bot
bot.functions.InitBot(connector);