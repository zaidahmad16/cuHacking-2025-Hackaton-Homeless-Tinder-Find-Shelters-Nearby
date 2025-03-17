import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import ProfileScreen from './ProfileScreen';

GoogleSignin.configure({
  webClientId: "YOUR_GOOGLE_CLIENT_ID", 
});

const SwipeScreen = () => {
  const [shelters, setShelters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const userId = auth().currentUser?.uid;

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    try {
      const response = await axios.get('http://10.0.0.2:5000/shelters'); 
      setShelters(response.data);
    } catch (error) {
      console.error("Error fetching shelters:", error);
    }
  };

  const handleSwipeRight = async () => {
    if (!userId || !shelters[currentIndex]) return;

    try {
      await axios.post('http://10.0.0.2:5000/swipe-right', {
        userId: userId,
        shelterId: shelters[currentIndex].id
      });
    } catch (error) {
      console.error("Error saving shelter:", error);
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleSwipeLeft = async () => {
    if (!userId || !shelters[currentIndex]) return;

    try {
      await axios.post('http://10.0.0.2:5000/swipe-left', {
        userId: userId,
        shelterId: shelters[currentIndex].id
      });
    } catch (error) {
      console.error("Error skipping shelter:", error);
    }

    setCurrentIndex(prev => prev + 1);
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
      console.log("User signed in!");
    } catch (error) {
      console.error("Google Sign-in failed", error);
    }
  };

  if (currentIndex >= shelters.length) {
    return <Text style={styles.text}>No more shelters available.</Text>;
  }

  const { name, image, location, amenities } = shelters[currentIndex];

  return (
    <View style={styles.container}>
      {!userId ? (
        <TouchableOpacity style={styles.loginButton} onPress={signInWithGoogle}>
          <Text style={styles.buttonText}>🔑 Sign in with Google</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Image source={{ uri: image }} style={styles.image} />
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.location}>{location}</Text>
          <Text style={styles.amenities}>{amenities.join(', ')}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.skip]} onPress={handleSwipeLeft}>
              <Text style={styles.buttonText}> Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.save]} onPress={handleSwipeRight}>
              <Text style={styles.buttonText}> Save</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Swipe" component={SwipeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' },
  image: { width: 300, height: 300, borderRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  location: { fontSize: 18, color: 'gray' },
  amenities: { fontSize: 16, marginTop: 5, textAlign: 'center', paddingHorizontal: 20 },
  buttonContainer: { flexDirection: 'row', marginTop: 20 },
  button: { margin: 10, padding: 10, borderRadius: 5, width: 120, alignItems: 'center' },
  buttonText: { fontSize: 18, fontWeight: 'bold' },
  skip: { backgroundColor: '#ff4d4d' },
  save: { backgroundColor: '#4caf50' },
  text: { fontSize: 22, textAlign: 'center', marginTop: 50 },
  loginButton: { padding: 10, backgroundColor: '#4285F4', borderRadius: 5 },
});
