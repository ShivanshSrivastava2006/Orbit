import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { db } from '../config';
import { auth } from '../firebase';

export default function IncomingConnectionRequests() {
  const currentUid = auth.currentUser?.uid;
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processedIds, setProcessedIds] = useState([]);

  useEffect(() => {
    console.log("📥 IncomingConnectionRequests mounted, UID:", currentUid);
    if (currentUid) {
      fetchIncomingRequests();
    }
  }, [currentUid]);

  const fetchIncomingRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const q = query(
        collection(db, 'requests'),
        where('to', '==', currentUid),
        where('status', '==', 'pending')
      );
      
      const snap = await getDocs(q);
      
      const requests = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const userRef = doc(db, 'users', data.from);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};
          
          return {
            id: docSnap.id,
            from: data.from,
            to: data.to,
            status: data.status,
            createdAt: data.createdAt,
            message: data.message || '', // Optional message from requester
            name: userData.name || 'Unknown User',
            bio: userData.bio || 'No bio available',
            profileImage: userData.profileImage || null,
          };
        })
      );

      // Sort by creation date (most recent first)
      requests.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setIncoming(requests);
      
    } catch (error) {
      console.error("❌ Error fetching incoming connection requests:", error);
      Alert.alert('Error', 'Failed to load connection requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchIncomingRequests(true);
  };

  const acceptRequest = async (request) => {
    try {
      const from = request.from;
      const to = currentUid;
      
      // Create bidirectional connection
      await setDoc(doc(db, 'connections', `${from}_${to}`), {
        users: [from, to],
        createdAt: serverTimestamp(),
        status: 'active'
      });
      
      // Also create reverse connection for easier querying
      await setDoc(doc(db, 'connections', `${to}_${from}`), {
        users: [to, from],
        createdAt: serverTimestamp(),
        status: 'active'
      });
      
      // Delete the original request
      await deleteDoc(doc(db, 'requests', request.id));
      
      // Update UI state
      setProcessedIds(prev => [...prev, request.id]);
      
      Alert.alert(
        '🎉 Connection Accepted!', 
        `You are now connected with ${request.name}`,
        [
          {
            text: 'Great!',
            onPress: () => {
              // Refresh the list after a short delay
              setTimeout(() => {
                fetchIncomingRequests();
              }, 1000);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error("❌ Error accepting connection request:", error);
      Alert.alert('Error', 'Failed to accept connection request');
    }
  };

  const rejectRequest = async (request) => {
    try {
      // Update request status to rejected instead of deleting immediately
      // This allows for potential audit trail
      await deleteDoc(doc(db, 'requests', request.id));
      
      // Update UI state
      setProcessedIds(prev => [...prev, request.id]);
      
      Alert.alert(
        'Request Declined', 
        `Connection request from ${request.name} has been declined`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh the list after a short delay
              setTimeout(() => {
                fetchIncomingRequests();
              }, 1000);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error("❌ Error rejecting connection request:", error);
      Alert.alert('Error', 'Failed to decline connection request');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const renderRequest = ({ item }) => {
    const isProcessed = processedIds.includes(item.id);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image
            source={{ 
              uri: item.profileImage || `https://i.pravatar.cc/150?u=${item.from}` 
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.bio}>{item.bio}</Text>
            <Text style={styles.timeText}>
              📅 Sent {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>💬 Message:</Text>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        )}

        <View style={styles.connectionInfo}>
          <Text style={styles.connectionText}>
            🤝 Wants to connect with you
          </Text>
        </View>

        {isProcessed ? (
          <Text style={styles.processedText}>Request processed</Text>
        ) : (
          <View style={styles.buttonContainer}>
            <Button 
              title="✅ Accept" 
              onPress={() => acceptRequest(item)}
              color="#4CAF50"
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="❌ Decline" 
              onPress={() => rejectRequest(item)}
              color="#e63946"
            />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>🔄 Loading connection requests...</Text>
      </View>
    );
  }

  if (incoming.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.emptyText}>😊 No pending connection requests</Text>
        <Text style={styles.emptySubtext}>
          When someone wants to connect with you, you'll see their request here!
        </Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>🤝 Connection Requests</Text>
      <FlatList
        data={incoming}
        keyExtractor={item => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  listContainer: {
    padding: 16,
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
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
    color: '#333',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  messageContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  messageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  connectionInfo: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonSpacer: {
    width: 12,
  },
  processedText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
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
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});