const admin = require('firebase-admin'); //npm install  firebase-admin

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

async function sendNotification(token, title, message) {
    const payload = {
        notification: {
            title,
            body: message,
        },
    };

    try {
        await admin.messaging().sendToDevice(token, payload);
        console.log('Notification sent successfully');
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

module.exports = sendNotification;
