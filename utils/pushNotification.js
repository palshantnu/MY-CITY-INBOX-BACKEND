const admin = require('../firebase/firebaseAdmin');

const sendPushToMultipleTokens = async (tokens, title, body, image = null) => {
  const messages = tokens.map(token => ({
    notification: {
      title,
      body,
      ...(image && { image }),
    },
    token,
  }));

  const results = await Promise.allSettled(
    messages.map(msg => admin.messaging().send(msg))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ Sent to ${tokens[index]}`);
    } else {
      console.error(`❌ Failed for ${tokens[index]}:`, result.reason.message);
    }
  });
};

module.exports = { sendPushToMultipleTokens };
