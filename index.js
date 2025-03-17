require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

//Initialize Firebase
const serviceAccount = require('./hackathon-homelesstinder-firebase.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

//Fetch Shelters from Firestore
app.get('/shelters', async (req, res) => {
  try {
    const snapshot = await db.collection('shelters').get();
    const shelters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(shelters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Save Shelter (Swipe Right)
app.post('/swipe-right', async (req, res) => {
  try {
    const { userId, shelterId } = req.body;
    await db.collection('userSwipes').doc(userId).set(
      { likedShelters: admin.firestore.FieldValue.arrayUnion(shelterId) },
      { merge: true }
    );
    res.json({ message: 'Shelter liked!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Skip Shelter (Swipe Left)
app.post('/swipe-left', async (req, res) => {
  try {
    const { userId, shelterId } = req.body;
    await db.collection('userSwipes').doc(userId).set(
      { skippedShelters: admin.firestore.FieldValue.arrayUnion(shelterId) },
      { merge: true }
    );
    res.json({ message: 'Shelter skipped!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Fetch Saved Shelters
app.get('/saved-shelters', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const userSwipesRef = db.collection('userSwipes').doc(userId);
    const userData = await userSwipesRef.get();
    if (!userData.exists) return res.json([]);

    const savedShelters = userData.data().likedShelters || [];
    if (savedShelters.length === 0) return res.json([]);

    const shelterDocs = await db.collection('shelters').where('__name__', 'in', savedShelters).get();
    const shelters = shelterDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(shelters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
