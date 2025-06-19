import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { db } from '../config';
import { auth } from '../firebase';
import {
  acceptHangoutRequest,
  approveSecondDegreeRequest,
  declineHangoutRequest
} from '../firestore';

export default function IncomingRequests() {
  const currentUid = auth.currentUser?.uid;
  const [hangoutRequests, setHangoutRequests] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processedIds, setProcessedIds] = useState([]);

  useEffect(() => {
    console.log("📥 IncomingRequests mounted, UID:", currentUid);
    if (currentUid) {
      fetchIncomingRequests();
    }
  }, [currentUid]);

  const fetchIncomingRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch direct hangout requests
      const hangoutQuery = query(
        collection(db, 'hangoutRequests'),
        where('to', '==', currentUid),
        where('status', '==', 'pending')
      );
      const hangoutSnap = await getDocs(hangoutQuery);

      const hangoutReqs = await Promise.all(
        hangoutSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const userRef = doc(db, 'users', data.from);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};
          
          return {
            id: docSnap.id,
            type: 'hangout',
            from: data.from,
            to: data.to,
            idea: data.idea,
            eventType: data.eventType,
            time: data.time,
            place: data.place,
            degree: data.degree,
            createdAt: data.createdAt,
            fromUser: {
              name: userData.name || 'Unknown',
              bio: userData.bio || 'No bio set',
            }
          };
        })
      );

      // Fetch approval requests (where current user needs to approve 2nd degree connections)
      const approvalQuery = query(
        collection(db, 'secondDegreeApprovals'),
        where('mutual', '==', currentUid),
        where('status', '==', 'pending')
      );
      const approvalSnap = await getDocs(approvalQuery);

      const approvalReqs = await Promise.all(
        approvalSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Get from user data
          const fromUserRef = doc(db, 'users', data.from);
          const fromUserSnap = await getDoc(fromUserRef);
          const fromUserData = fromUserSnap.exists() ? fromUserSnap.data() : {};
          
          // Get to user data
          const toUserRef = doc(db, 'users', data.to);
          const toUserSnap = await getDoc(toUserRef);
          const toUserData = toUserSnap.exists() ? toUserSnap.data() : {};
          
          return {
            id: docSnap.id,
            type: 'approval',
            from: data.from,
            to: data.to,
            mutual: data.mutual,
            hangoutData: data.hangoutData,
            status: data.status,
            createdAt: data.createdAt,
            fromUser: {
              name: fromUserData.name || 'Unknown',
              bio: fromUserData.bio || 'No bio set',
            },
            toUser: {
              name: toUserData.name || 'Unknown',
              bio: toUserData.bio || 'No bio set',
            }
          };
        })
      );

      setHangoutRequests(hangoutReqs);
      setApprovalRequests(approvalReqs);
      
    } catch (error) {
      console.error("❌ Error fetching incoming requests:", error);
      Alert.alert('Error', 'Failed to load incoming requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptHangout = async (request) => {
    try {
      await acceptHangoutRequest(request.from, request.to);
      setProcessedIds(prev => [...prev, request.id]);
      Alert.alert('✅ Accepted', 'Hangout request accepted!');
      
      // Refresh the list
      fetchIncomingRequests();
    } catch (error) {
      console.error("❌ Error accepting hangout request:", error);
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleDeclineHangout = async (request) => {
    try {
      await declineHangoutRequest(request.from, request.to);
      setProcessedIds(prev => [...prev, request.id]);
      Alert.alert('❌ Declined', 'Hangout request declined');
      
      // Refresh the list
      fetchIncomingRequests();
    } catch (error) {
      console.error("❌ Error declining hangout request:", error);
      Alert.alert('Error', 'Failed to decline request');
    }
  };

  const handleApproveSecondDegree = async (request, approved) => {
    try {
      await approveSecondDegreeRequest(request.id, approved ? 'approved' : 'declined');
      setProcessedIds(prev => [...prev, request.id]);
      
      if (approved) {
        Alert.alert('✅ Approved', 'Second degree connection approved! The hangout request has been sent.');
      } else {
        Alert.alert('❌ Declined', 'Second degree connection request declined');
      }
      
      // Refresh the list
      fetchIncomingRequests();
    } catch (error) {
      console.error("❌ Error processing approval:", error);
      Alert.alert('Error', 'Failed to process approval');
    }
  };

  const renderHangoutRequest = ({ item }) => {
    const isProcessed = processedIds.includes(item.id);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.from}` }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.fromUser.name}</Text>
            <Text style={styles.bio}>{item.fromUser.bio}</Text>
            <Text style={styles.degreeText}>
              {item.degree === 1 ? '1st Degree Friend' : '2nd Degree Connection'}
            </Text>
          </View>
        </View>

        <View style={styles.hangoutDetails}>
          <Text style={styles.hangoutTitle}>💡 Hangout Idea:</Text>
          <Text style={styles.hangoutIdea}>{item.idea}</Text>
          
          {item.eventType && (
            <Text style={styles.hangoutMeta}>📅 Type: {item.eventType}</Text>
          )}
          {item.time && (
            <Text style={styles.hangoutMeta}>⏰ When: {item.time}</Text>
          )}
          {item.place && (
            <Text style={styles.hangoutMeta}>📍 Where: {item.place}</Text>
          )}
        </View>

        {!isProcessed ? (
          <View style={styles.buttonContainer}>
            <Button 
              title="✅ Accept" 
              onPress={() => handleAcceptHangout(item)}
              color="#4CAF50"
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="❌ Decline" 
              onPress={() => handleDeclineHangout(item)}
              color="#e63946"
            />
          </View>
        ) : (
          <Text style={styles.processedText}>Request processed</Text>
        )}
      </View>
    );
  };

  const renderApprovalRequest = ({ item }) => {
    const isProcessed = processedIds.includes(item.id);
    
    return (
      <View style={[styles.card, styles.approvalCard]}>
        <Text style={styles.approvalTitle}>🤝 Approval Request</Text>
        
        <View style={styles.approvalInfo}>
          <Text style={styles.approvalText}>
            <Text style={styles.bold}>{item.fromUser.name}</Text> wants to hang out with{' '}
            <Text style={styles.bold}>{item.toUser.name}</Text>
          </Text>
          <Text style={styles.approvalSubtext}>
            They need your approval since they're 2nd degree connections
          </Text>
        </View>

        {item.hangoutData && (
          <View style={styles.hangoutDetails}>
            <Text style={styles.hangoutTitle}>💡 Hangout Plan:</Text>
            <Text style={styles.hangoutIdea}>{item.hangoutData.idea}</Text>
            
            {item.hangoutData.eventType && (
              <Text style={styles.hangoutMeta}>📅 Type: {item.hangoutData.eventType}</Text>
            )}
            {item.hangoutData.time && (
              <Text style={styles.hangoutMeta}>⏰ When: {item.hangoutData.time}</Text>
            )}
            {item.hangoutData.place && (
              <Text style={styles.hangoutMeta}>📍 Where: {item.hangoutData.place}</Text>
            )}
          </View>
        )}

        {!isProcessed ? (
          <View style={styles.buttonContainer}>
            <Button 
              title="✅ Approve" 
              onPress={() => handleApproveSecondDegree(item, true)}
              color="#4CAF50"
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="❌ Decline" 
              onPress={() => handleApproveSecondDegree(item, false)}
              color="#e63946"
            />
          </View>
        ) : (
          <Text style={styles.processedText}>Request processed</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>🔄 Loading incoming requests...</Text>
      </View>
    );
  }

  const hasRequests = hangoutRequests.length > 0 || approvalRequests.length > 0;

  if (!hasRequests) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>😕 No incoming requests</Text>
        <Text style={styles.emptySubtext}>
          When someone wants to hang out with you, you'll see their request here!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>📥 Incoming Requests</Text>
      
      {approvalRequests.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>🤝 Approval Requests</Text>
          <FlatList
            data={approvalRequests}
            keyExtractor={item => item.id}
            renderItem={renderApprovalRequest}
            scrollEnabled={false}
          />
        </>
      )}

      {hangoutRequests.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>🎉 Hangout Requests</Text>
          <FlatList
            data={hangoutRequests}
            keyExtractor={item => item.id}
            renderItem={renderHangoutRequest}
            scrollEnabled={false}
          />
        </>
      )}
    </ScrollView>
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
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginVertical: 12,
    color: '#555',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  approvalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
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
    fontWeight: 'bold',
    fontSize: 16,
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
  approvalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FF9800',
  },
  approvalInfo: {
    marginBottom: 12,
  },
  approvalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  approvalSubtext: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: 'bold',
  },
  hangoutDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  hangoutTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  hangoutIdea: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  hangoutMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});