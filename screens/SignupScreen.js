// screens/SignupScreen.js (Modified)
import { useNavigation } from '@react-navigation/native';
// REMOVED: createUserWithEmailAndPassword, doc, setDoc from firebase
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker'; // Keep this for image picking
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Keep for local image handling, though upload moves to next screen

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// REMOVED: auth, db from '../firebase' // No direct Firebase auth/db calls here anymore

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedGender, setSelectedGender] = useState(null);
  const [bio, setBio] = useState('');
  const [bioError, setBioError] = useState(null);
  const [isGenderModalVisible, setGenderModalVisible] = useState(false);
  const [image, setImage] = useState(null); // Local URI for selected image

  const navigation = useNavigation();

  const allGenders = [
    'Female', 'Male', 'Non-binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Bigender',
    'Two-Spirit', 'Demigirl', 'Demiboy', 'Pangender', 'Transgender Woman', 'Transgender Man',
    'Cisgender Woman', 'Cisgender Man', 'Intersex', 'Androgynous', 'Neutrois', 'Polygender',
    'Questioning', 'Aporagender', 'Autigender', 'Cisgender', 'Colorgender', 'Demifluid',
    'Demigender', 'Epicene', 'Femme', 'Graygender', 'Gender Apathetic', 'Gender Outlaw',
    'Gender Variant', 'He/Him', 'Her/She', 'Hir/Zir', 'It/Its', 'Maverique', 'Multigender',
    'Native American', 'Omnigender', 'Oneirogender', 'Perigender', 'Pronoun-Neutral', 'Queer',
    'Spiritgender', 'Third Gender', 'Trigender', 'Transfeminine', 'Transmasculine', 'Unlabeled',
    'Verb-Gender', 'Virgender', 'Xenogender', 'Ze/Zir', 'No Preference', 'Prefer not to disclose',
    'Custom (Please specify in Bio)',
  ];

  const handleSelectGender = (genderValue) => {
    setSelectedGender(genderValue);
    setGenderModalVisible(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleContinue = () => { // Renamed from handleSignup
    // Basic validation before navigating
    if (!name.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!age.trim() || isNaN(age) || parseInt(age) <= 0) {
      alert('Please enter a valid age.');
      return;
    }
    if (!selectedGender) {
      alert('Please select your gender.');
      return;
    }
    if (!bio.trim()) {
      setBioError("Bio is required.");
      return;
    }
    if (bio.length > 200) {
      setBioError("Bio must be under 200 characters.");
      return;
    }
    setBioError(null);

    // Navigate to the next screen, passing the collected data
    navigation.navigate('AuthDetails', { // Navigate to the new screen
      name,
      age,
      selectedGender,
      bio,
      image, // Pass the local image URI
    });
  };

  return (
    <LinearGradient
      colors={['#ffecd2', '#fcb69f']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.promptText}>help us know you better</Text>

        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImageReal} />
          ) : (
            <Text style={styles.profileImage}>👤</Text>
          )}
          <View style={styles.pencilIconContainer}>
            <Text style={styles.pencilIcon}>✏️</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.inputLabel}>enter your name</Text>
        <TextInput
          style={styles.input}
          placeholder="your name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>select your gender</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setGenderModalVisible(true)}
        >
          <Text style={selectedGender ? styles.inputText : styles.placeholderText}>
            {selectedGender || 'Select your gender'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.inputLabel}>enter your age</Text>
        <TextInput
          style={styles.input}
          placeholder="your age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>write a short bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Tell us about yourself in 200 characters..."
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={200}
        />
        {bioError && <Text style={styles.errorText}>{bioError}</Text>}

        <TouchableOpacity style={styles.continueButtonWrapper} onPress={handleContinue}> {/* Changed onPress */}
          <LinearGradient
            colors={['#ff6a00', '#ee0979']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>CONTINUE</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.skipButton}>
          <Text style={{ color: '#000000' }}>
            already a user?{' '}
            <Text style={{ color: '#001ac9' }} onPress={() => navigation.navigate('Login')}>
              skip this
            </Text>
          </Text>
        </View>

        {/* REMOVED: message display from this screen */}
      </View>

      {/* Gender Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isGenderModalVisible}
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setGenderModalVisible(false)}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={true}>
              {allGenders.map((gender, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.genderOption}
                  onPress={() => handleSelectGender(gender)}
                >
                  <Text style={styles.genderOptionText}>{gender}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setGenderModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { width: '90%', alignItems: 'center', paddingVertical: 20 },
  promptText: {
    fontSize: 16, color: '#333', alignSelf: 'flex-start', marginBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#999', borderStyle: 'dotted', paddingBottom: 4
  },
  imageContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    position: 'relative', borderWidth: 2, borderColor: 'lightgray'
  },
  profileImage: { fontSize: 60 },
  profileImageReal: { width: 100, height: 100, borderRadius: 50 },
  pencilIconContainer: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: 'black',
    borderRadius: 20, padding: 6, justifyContent: 'center', alignItems: 'center'
  },
  pencilIcon: { color: 'white', fontSize: 14, fontWeight: 'bold', transform: [{ scaleX: -1 }] },
  inputLabel: { alignSelf: 'flex-start', fontSize: 13, color: '#555', marginTop: 12 },
  input: {
    width: '100%', borderWidth: 0, padding: 10, marginVertical: 5,
    borderRadius: 8, backgroundColor: '#f2f2f2', fontSize: 14, color: '#333', elevation: 2
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  inputText: { fontSize: 14, color: '#333' },
  placeholderText: { color: '#999' },
  continueButtonWrapper: { width: '100%', marginTop: 20, borderRadius: 8, overflow: 'hidden', elevation: 5 },
  buttonGradient: { paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  skipButton: { marginTop: 16 },
  // message: { marginTop: 16, textAlign: 'center', fontSize: 14, color: '#333' }, // Removed
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 10, padding: 20,
    width: '80%', maxHeight: '70%', elevation: 5
  },
  genderOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  genderOptionText: { fontSize: 14, color: '#333' },
  closeButton: {
    marginTop: 15, padding: 10, backgroundColor: '#eee',
    borderRadius: 5, alignItems: 'center'
  },
  closeButtonText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  errorText: { color: 'red', fontSize: 12, marginTop: 4, alignSelf: 'flex-start' },
});
