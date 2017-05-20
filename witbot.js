'use strict';

const wit = require('node-wit').Wit;
const WIT_TOKEN = 'ZGWVWYFJBVBG4IR22M5MDAIIUUFJD7EO';
const FB_VERIFY_TOKEN = 'webhooktoken';
const FB_PAGE_TOKEN = 'EAAGt44ggxyYBAEv667UeUHZCEAdCpgJyQy3PRGjkSSDOZA8bX244iIoMz1Ri8oW45BB1PZCt2TAnm1ESELWHRZAAocPNToVciyJGZAzc8w3wWZCPEe8lAHZBdZALwn8Ic7qTc4FL0LYnGhpsD0X3ZBHu9dUFMZAP1oaKQSL9F3PDnx0AZDZD';
// LETS SAVE USER SESSIONS
var sessions = {}


var findOrCreateSession = function (fbid) {
  var sessionId

  // DOES USER SESSION ALREADY EXIST?
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // YUP
      sessionId = k
    }
  })

  // No session so we will create one
  if (!sessionId) {
    sessionId = new Date().toISOString()
    sessions[sessionId] = {
      fbid: fbid,
      context: {
        _fbid_: fbid
      }
    }
  }

  return sessionId
}

var read = function (sender, message, reply) {
	if (message === 'hello') {
		// Let's reply back hello
		message = 'Hello yourself! I am a chat bot. You can say "show me pics of corgis"'
		reply(sender, message)
	} else {
		// Let's find the user
		var sessionId = findOrCreateSession(sender)
		// Let's forward the message to the Wit.ai bot engine
		// This will run all actions until there are no more actions left to do
		wit.runActions(
			sessionId, // the user's current session by id
			message,  // the user's message
			sessions[sessionId].context, // the user's session state
			function (error, context) { // callback
			if (error) {
				console.log('oops!', error)
			} else {
				// Wit.ai ran all the actions
				// Now it needs more messages
				console.log('Waiting for further messages')

				// Based on the session state, you might want to reset the session
				// Example:
				// if (context['done']) {
				// 	delete sessions[sessionId]
				// }

				// Updating the user's current session state
				sessions[sessionId].context = context
			}
		})
	}
}



module.exports = {
	findOrCreateSession: findOrCreateSession,
	read: read,
}