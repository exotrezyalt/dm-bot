const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; 

const MESSAGE = "Hey! Thanks for following — really appreciate the support! 🙌";

// webhook verification
app.get('/webhook', (req, res) => {
  if (
    req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === VERIFY_TOKEN
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// receive webhook events
app.post('/webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  
  const body = req.body;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      console.log('Entry:', JSON.stringify(entry, null, 2));
      
      for (const event of entry.messaging || []) {
        console.log('Event:', JSON.stringify(event, null, 2));

        if (event.postback || event.follow) {
          const senderId = event.sender.id;
          await sendMessage(senderId);
        }

        if (event.message && !event.message.is_echo) {
          const senderId = event.sender.id;
          await sendMessage(senderId);
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

async function sendMessage(recipientId) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text: MESSAGE }
      }
    );
    console.log(`DM sent to ${recipientId}`);
  } catch (err) {
    console.error('Failed to send DM:', err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
