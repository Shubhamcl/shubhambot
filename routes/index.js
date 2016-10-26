var express = require('express');
var request = require('request');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// GET for webhook, messenger uses this to see if the app is alive/ok
router.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'shubham_verifies') {
      res.send(req.query['hub.challenge']);
    } else {
      res.send('Error, wrong validation token');
    }
  });

// POST for grabbing messages from chat
router.post('/webhook', function (req, res) {
  var data = req.body;
  console.log(req.body);
  // Make sure this is a page subscription
  if (data.object == 'page') {
    console.log("Length of the data.entry",data.entry.length);
    console.log(data.entry[0].messaging);
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          //receivedAuthentication(messagingEvent);
          console.log('case receivedAuthentication');
        } else if (messagingEvent.message) {
          console.log('case receivedMessage');
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          console.log(' case receivedDeliveryConfirmation');
          // receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          console.log(' case receivedPostback');
          // receivedPostback(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

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
var token_for_access = "EAAOUs5y1lbIBAIHin1B5UMI2MIlRiUAi4PplbFrLgkvkAfE8TlIAW6tiwp11LBigNQFx4mwOiAZChmh5OPLHQ1ZBYr0KSCF2tkXeWwj4uqfbwhL3wkbcx9UBYRPhElkxDZAPn7nZAGipqTZAZAsbXzCUhrMxkovvGnIcU5uwCqLwZDZD";
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token_for_access },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}


module.exports = router;
