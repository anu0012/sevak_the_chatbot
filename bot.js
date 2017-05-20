//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const wit = require('node-wit').Wit;
const log = require('node-wit').log;
var Bot = require('./witbot');
const WIT_TOKEN = 'ZGWVWYFJBVBG4IR22M5MDAIIUUFJD7EO';
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<script src=\"https://button.glitch.me/button.js\" data-style=\"glitch\"></script><div class=\"glitchButton\" style=\"position:fixed;top:20px;right:20px;\"></div></body></html>";

// The rest of the code implements the routes for our Express server.
let app = express();
var mobileRechargeJSON={};
var prevCommand = '';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

callMobileRechargesApi();
// wit.ai interaction
const client = new wit({accessToken: WIT_TOKEN});

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'webhooktoken') {
    console.log("Validating webhook");
    
    res.status(200).send(req.query['hub.challenge']);
  } else {

    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  //console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    //console.log(data.entry.changes);
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function getMobileRecharges(body){
  
  mobileRechargeJSON = body;
  //console.log(mobileRechargeJSON);
}

function callMobileRechargesApi(){
  request({
    uri: 'https://private-a8ad69-dairtelbot.apiary-mock.com/getplans',
    proxy: null
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body);
      getMobileRecharges(body);

      console.log("Successfully get recharge plans");
    } else {
      console.error("Unable to retrieve recharges.");
      //console.error(response);
      console.error("error in callMobileRechargesApi is - "+error);
    }
  });  
}

var entityName = '';

function getEntity(param){
  entityName = param;
  //console.log(entityName);
}

function setPrevCommand(param){
  prevCommand = param;
  //console.log(prevCommand);
}

// Incoming events handling
function receivedMessage(event) {
  
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  // console.log("Received message for user %d and page %d at %d with message:", 
  // senderID, recipientID, timeOfMessage);
  // console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;

  // wit.ai
  client.message(messageText, {})
  .then((data) => {
    //console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
    //console.log(data);
    //var jsonData = JSON.parse(data);
    //console.log(data.entities);
    var keys = Object.keys(data.entities);
      //console.log(keys);
      //getEntity(JSON.stringify(keys[0]));
      var messageAttachments = message.attachments;
      entityName = keys[0];
    var jsonData = JSON.parse(mobileRechargeJSON);
      if (entityName) {
    //console.log("yeh jo entity hai"+entityName);
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    
    switch (entityName) {

      case 'mobile_recharge':
        //console.log("i am in mobile recharge");
        setPrevCommand('mobile_recharge');
        var output = 'Choose from the following options: \n';

        for(var i=0; i < jsonData.getplans.length; i++){
          // console.log(jsonData.getplans[i].rechargeType);

            output += i+1 + ". " + (jsonData.getplans[i].rechargeType) + '\n';
        }
        
        sendTextMessage(senderID, output);
        break;

      default:
        //console.log("yeh jo entity hai"+entityName);
        sendTextMessage(senderID, messageText);
    }
  }else if (prevCommand){
    console.log(parseInt(messageText));
      if(prevCommand === 'mobile_recharge'){
          var output = '';
              if(parseInt(messageText) === 1){
                for(var i=0; i < jsonData.getplans[0].choices.length; i++){
             //console.log(jsonData.getplans[0].choices[i].Detail);
            output += "Detail - " + (jsonData.getplans[0].choices[i].Detail) + '\n';
            output += "Amount - " + (jsonData.getplans[0].choices[i].Amount) + '\n';
            output += "Validity - " + (jsonData.getplans[0].choices[i].Validity) + '\n';
            
            sendTextMessage(senderID, output);
            output = '';
              }
            }
            else if(parseInt(messageText) === 2){
                for(var i=0; i < jsonData.getplans[1].choices.length; i++){
             //console.log(jsonData.getplans[0].choices[i].Detail);
            output += "Detail - " + (jsonData.getplans[1].choices[i].Detail) + '\n';
            output += "Amount - " + (jsonData.getplans[1].choices[i].Amount) + '\n';
            output += "Validity - " + (jsonData.getplans[1].choices[i].Validity) + '\n';
            
            sendTextMessage(senderID, output);
            output = '';
              }
            }
            else if(parseInt(messageText) === 3){
                for(var i=0; i < jsonData.getplans[2].choices.length; i++){
             //console.log(jsonData.getplans[0].choices[i].Detail);
            output += "Detail - " + (jsonData.getplans[2].choices[i].Detail) + '\n';
            output += "Amount - " + (jsonData.getplans[2].choices[i].Amount) + '\n';
            output += "Validity - " + (jsonData.getplans[2].choices[i].Validity) + '\n';
            
            sendTextMessage(senderID, output);
            output = '';
              }
            }
            else if(parseInt(messageText) === 4){
                for(var i=0; i < jsonData.getplans[3].choices.length; i++){
             //console.log(jsonData.getplans[0].choices[i].Detail);
            output += "Detail - " + (jsonData.getplans[3].choices[i].Detail) + '\n';
            output += "Amount - " + (jsonData.getplans[3].choices[i].Amount) + '\n';
            output += "Validity - " + (jsonData.getplans[3].choices[i].Validity) + '\n';
            
            sendTextMessage(senderID, output);
            output = '';
              }
            }
            else if(parseInt(messageText) === 5){
                for(var i=0; i < jsonData.getplans[4].choices.length; i++){
             //console.log(jsonData.getplans[0].choices[i].Detail);
            output += "Detail - " + (jsonData.getplans[4].choices[i].Detail) + '\n';
            output += "Amount - " + (jsonData.getplans[4].choices[i].Amount) + '\n';
            output += "Validity - " + (jsonData.getplans[4].choices[i].Validity) + '\n';
            
            sendTextMessage(senderID, output);
            output = '';
              }
            }
            else if(parseInt(messageText) === 6){
                for(var i=0; i < jsonData.getplans[5].choices.length; i++){
             //console.log(jsonData.getplans[0].choices[i].Detail);
            output += "Detail - " + (jsonData.getplans[5].choices[i].Detail) + '\n';
            output += "Amount - " + (jsonData.getplans[5].choices[i].Amount) + '\n';
            output += "Validity - " + (jsonData.getplans[5].choices[i].Validity) + '\n';
            
            sendTextMessage(senderID, output);
            output = '';
              }
            }
            else if(parseInt(messageText) === 7){
                for(var i=0; i < jsonData.getplans[6].choices.length; i++){
             //console.log(jsonData.getplans[0].choices[i].Detail);
            output += "Detail - " + (jsonData.getplans[6].choices[i].Detail) + '\n';
            output += "Amount - " + (jsonData.getplans[6].choices[i].Amount) + '\n';
            output += "Validity - " + (jsonData.getplans[6].choices[i].Validity) + '\n';
            
            sendTextMessage(senderID, output);
            output = '';
              }
            }

      }
      
  }
   else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
    
  })
  .catch(console.error);

  
  //console.log(entityName.length);

}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  // console.log("Received postback for user %d and page %d with payload '%s' " + 
  //   "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}


function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAAGt44ggxyYBAEv667UeUHZCEAdCpgJyQy3PRGjkSSDOZA8bX244iIoMz1Ri8oW45BB1PZCt2TAnm1ESELWHRZAAocPNToVciyJGZAzc8w3wWZCPEe8lAHZBdZALwn8Ic7qTc4FL0LYnGhpsD0X3ZBHu9dUFMZAP1oaKQSL9F3PDnx0AZDZD' },
    method: 'POST',
    proxy: null,
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      //console.error(response);
      console.error("error in callsendApi is - "+error);
    }
  });  
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});