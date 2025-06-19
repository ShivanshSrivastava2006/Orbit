import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../firebase';
import {
  buildConnectionGraph,
  cancelHangoutRequest,
  sendHangoutRequest
} from '../firestore';

export default function SendHangoutRequests() {
  const currentUid = auth.currentUser?.uid;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [hangoutIdea, setHangoutIdea] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventPlace, setEventPlace] = useState('');
  const [sending, setSending] = useState(false);

  const eventTypes = ['Walk', 'Movie', 'Food', 'Jam Session', 'Study', 'Gaming', 'Sports', 'Other'];

  useEffect(() => {
    if (currentUid) {
      fetchConnections();
    }
  }, [currentUid]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const graph = await buildConnectionGraph(currentUid);
      
      // Filter out current user and only show users we can send requests to
      const filteredUsers = graph.nodes.filter(user => 
        user.id !== currentUid && 
        (user.requestStatus === 'none' || user.requestStatus === 'connected')
      );
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error("❌ Error fetching connections:", error);
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setHangoutIdea('');
    setEventType('');
    setEventTime('');
    setEventPlace('');
  };

  const handleSendHangoutRequest = async (user) => {
    if (!hangoutIdea.trim()) {
      Alert.alert('Error', 'Please enter a hangout idea');
      return;
    }

    try {
      setSending(true);
      
      const hangoutData = {
        idea: hangoutIdea.trim(),
        eventType: eventType,
        time: eventTime,
        place: eventPlace,
      };

      const result = await sendHangoutRequest(currentUid, user.id, hangoutData);
      
      if (result.requiresApproval) {
        Alert.alert(
          '✅ Approval Requested', 
          'Your hangout request has been sent to a mutual friend for approval!'
        );
      } else {
        Alert.alert('✅ Request Sent', 'Your hangout request has been sent directly!');
      }
      
      clearForm();
      setSelectedUser(null);
      
      // Refresh the user list to update statuses
      await fetchConnections();
      
    } catch (error) {
      console.error('❌ Error sending hangout request:', error);
      Alert.alert('Error', error.message || 'Failed to send hangout request');
    } finally {
      setSending(false);
    }
  };

  const handleCancelRequest = async (user) => {
    try {
      await cancelHangoutRequest(currentUid, user.id);
      Alert.alert('🚫 Request Cancelled', 'Your hangout request has been cancelled');
      
      // Refresh the user list
      await fetchConnections();
    } catch (error) {
      console.error('❌ Error cancelling request:', error);
      Alert.alert('Error', 'Failed to cancel request');
    }
  };

  const renderUserCard = (user) => {
    const isPending = user.requestStatus === 'pending' || user.requestStatus === 'pendingApproval';
    
    return (
      <View key={user.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${user.id}` }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.bio}>{user.bio || 'No bio set'}</Text>
            <Text style={styles.degreeText}>
              {user.degree === 1 ? '1st Degree Friend' : '2nd Degree Connection'}
            </Text>
          </View>
        </View>

        {isPending ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {user.requestStatus === 'pendingApproval' 
                ? 'Waiting for Mutual Friend Approval 🤝' 
                : 'Request Pending ⏳'
              }
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelRequest(user)}
            >
              <Text style={styles.buttonText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton]}
            onPress={() => setSelectedUser(user)}
          >
            <Text style={styles.buttonText}>
              {user.degree === 2 ? 'Request via Mutual Friend' : 'Send Hangout Request'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading connections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.heading}>🎉 Plan a Hangout</Text>
        
        {users.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No connections available</Text>
            <Text style={styles.emptySubtext}>
              Add some friends first to start planning hangouts!
            </Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {users.map(user => renderUserCard(user))}
          </View>
        )}
      </ScrollView>

      {/* Hangout Request Modal */}
      {selectedUser && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setSelectedUser(null);
                  clearForm();
                }}
              >
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <Image
                  source={{ uri: `https://i.pravatar.cc/150?u=${selectedUser.id}` }}
                  style={styles.modalAvatar}
                />
                <View style={styles.modalUserInfo}>
                  <Text style={styles.modalName}>{selectedUser.name}</Text>
                  <Text style={styles.modalDegree}>
                    {selectedUser.degree === 1 ? '1st Degree Friend' : '2nd Degree Connection'}
                  </Text>
                </View>
              </View>

              <View style={styles.hangoutForm}>
                <Text style={styles.formTitle}>Plan Your Hangout</Text>
                
                <TextInput
                  placeholder="What's your hangout idea?"
                  value={hangoutIdea}
                  onChangeText={setHangoutIdea}
                  style={styles.inputBox}
                  multiline
                  maxLength={200}
                />

                <Text style={styles.labelText}>Event Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventTypeContainer}>
                  {eventTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.eventTypeButton,
                        eventType === type && styles.eventTypeButtonSelected
                      ]}
                      onPress={() => setEventType(type)}
                    >
                      <Text style={[
                        styles.eventTypeText,
                        eventType === type && styles.eventTypeTextSelected
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  placeholder="When? (e.g., Tonight 7 PM, Tomorrow afternoon)"
                  value={eventTime}
                  onChangeText={setEventTime}
                  style={styles.inputBox}
                />

                <TextInput
                  placeholder="Where? (e.g., Campus cafe, Library, My place)"
                  value={eventPlace}
                  onChangeText={setEventPlace}
                  style={styles.inputBox}
                />

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (hangoutIdea.trim() === '' || sending) && styles.submitButtonDisabled
                  ]}
                  disabled={hangoutIdea.trim() === '' || sending}
                  onPress={() => handleSendHangoutRequest(selectedUser)}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {selectedUser.degree === 2 ? 'Request Approval & Send' : 'Send Hangout Invite'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  usersList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333',
  },
  bio: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  degreeText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 150,
  },
  sendButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#e63946',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#888',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  modalUserInfo: {
    flex: 1,
  },
  modalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDegree: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  hangoutForm: {
    marginTop: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: '#fdfdfd',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    color: '#444',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  eventTypeButton: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  eventTypeButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  eventTypeText: {
    fontSize: 13,
    color: '#555',
  },
  eventTypeTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});