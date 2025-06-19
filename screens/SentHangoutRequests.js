// screens/SentHangoutRequests.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { auth } from '../firebase';
import { db } from '../config';

export default function SentRequests() {
  const currentUid = auth.currentUser?.uid;
  const [firstDegreeRequests, setFirstDegreeRequests] = useState([]);
  const [secondDegreeApprovalRequests, setSecondDegreeApprovalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("📤 SentRequests mounted, UID:", currentUid);
    if (currentUid) {
      fetchSentRequests();
    }
  }, [currentUid]);

  const fetchSentRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch 1st degree hangout requests (direct requests to 1st degree friends)
      // AND 2nd degree requests that have been approved and sent directly
      const firstDegreeQuery = query(
        collection(db, 'hangoutRequests'),
        where('from', '==', currentUid)
      );
      const firstDegreeSnap = await getDocs(firstDegreeQuery);

      const firstDegreeReqs = await Promise.all(
        firstDegreeSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const userRef = doc(db, 'users', data.to);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          return {
            id: docSnap.id,
            type: 'hangoutRequest',
            from: data.from,
            to: data.to,
            idea: data.idea,
            eventType: data.eventType,
            time: data.time,
            place: data.place,
            status: data.status,
            degree: data.degree || 1, // Default to 1 if not specified
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
            toUser: {
              name: userData.name || 'Unknown',
              bio: userData.bio || 'No bio set',
            }
          };
        })
      );

      // Sort by createdAt in JavaScript (most recent first)
      firstDegreeReqs.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      // Fetch 2nd degree approval requests (requests for approval from mutual friends)
      const secondDegreeQuery = query(
        collection(db, 'secondDegreeApprovals'),
        where('from', '==', currentUid)
      );
      const secondDegreeSnap = await getDocs(secondDegreeQuery);

      const secondDegreeApprovalReqs = await Promise.all(
        secondDegreeSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Get target user data
          const toUserRef = doc(db, 'users', data.to);
          const toUserSnap = await getDoc(toUserRef);
          const toUserData = toUserSnap.exists() ? toUserSnap.data() : {};
          
          // Get mutual friend data
          const mutualRef = doc(db, 'users', data.mutual);
          const mutualSnap = await getDoc(mutualRef);
          const mutualData = mutualSnap.exists() ? mutualSnap.data() : {};

          return {
            id: docSnap.id,
            type: 'approvalRequest',
            from: data.from,
            to: data.to,
            mutual: data.mutual,
            status: data.status,
            hangoutData: data.hangoutData,
            createdAt: data.createdAt,
            toUser: {
              name: toUserData.name || 'Unknown',
              bio: toUserData.bio || 'No bio set',
            },
            mutualUser: {
              name: mutualData.name || 'Unknown',
              bio: mutualData.bio || 'No bio set',
            }
          };
        })
      );

      // Sort by createdAt in JavaScript (most recent first)
      secondDegreeApprovalReqs.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      // Separate actual 1st degree requests from 2nd degree requests that were sent directly
      const actualFirstDegreeRequests = firstDegreeReqs.filter(req => req.degree === 1);
      const approvedSecondDegreeRequests = firstDegreeReqs.filter(req => req.degree === 2);

      // Combine approved 2nd degree requests with 1st degree for display
      const combinedFirstDegreeRequests = [...actualFirstDegreeRequests, ...approvedSecondDegreeRequests];

      setFirstDegreeRequests(combinedFirstDegreeRequests);
      setSecondDegreeApprovalRequests(secondDegreeApprovalReqs);

    } catch (error) {
      console.error("❌ Error fetching sent requests:", error);
      Alert.alert('Error', 'Failed to load sent requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchSentRequests(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'declined': return '#e63946';
      case 'expired': return '#757575';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#e63946';
      default: return '#666';
    }
  };

  const getStatusText = (item) => {
    if (item.type === 'hangoutRequest') {
      switch (item.status) {
        case 'pending': return '⏳ Pending Response';
        case 'accepted': return '✅ Accepted';
        case 'declined': return '❌ Declined';
        case 'expired': return '⏰ Expired';
        default: return '❓ Unknown';
      }
    } else if (item.type === 'approvalRequest') {
      // Second degree approval request
      switch (item.status) {
        case 'pending': return '⏳ Waiting for Approval';
        case 'approved': return '✅ Approved & Sent';
        case 'declined': return '❌ Approval Declined';
        case 'rejected': return '❌ Approval Rejected';
        default: return '❓ Unknown';
      }
    }
    return '❓ Unknown';
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt.seconds * 1000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getDegreeText = (item) => {
    if (item.type === 'hangoutRequest') {
      return item.degree === 1 ? '1st Degree Friend' : '2nd Degree (Direct Request)';
    }
    return '2nd Degree (Approval Request)';
  };

  const renderHangoutRequest = ({ item }) => {
    const expired = isExpired(item.expiresAt);
    const displayStatus = expired ? 'expired' : item.status;
    const isSecondDegreeDirectRequest = item.type === 'hangoutRequest' && item.degree === 2;

    return (
      <View style={[styles.card, isSecondDegreeDirectRequest && styles.secondDegreeDirectCard]}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.to}` }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.toUser.name}</Text>
            <Text style={styles.bio}>{item.toUser.bio}</Text>
            <Text style={styles.degreeText}>{getDegreeText(item)}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor(displayStatus) }]}>
              {getStatusText({ ...item, status: displayStatus })}
            </Text>
          </View>
        </View>

        <View style={styles.hangoutDetails}>
          <Text style={styles.hangoutTitle}>💡 Your Hangout Idea:</Text>
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

        <View style={styles.requestMeta}>
          <Text style={styles.metaText}>📅 Sent: {formatDate(item.createdAt)}</Text>
          {item.expiresAt && (
            <Text style={styles.metaText}>
              ⏰ {expired ? 'Expired' : 'Expires'}: {formatDate(item.expiresAt)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderApprovalRequest = ({ item }) => {
    return (
      <View style={[styles.card, styles.approvalRequestCard]}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.to}` }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.toUser.name}</Text>
            <Text style={styles.bio}>{item.toUser.bio}</Text>
            <Text style={styles.degreeText}>2nd Degree (Approval Request)</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item)}
            </Text>
          </View>
        </View>

        <View style={styles.mutualInfo}>
          <Text style={styles.mutualText}>
            🤝 Approval needed from: <Text style={styles.bold}>{item.mutualUser.name}</Text>
          </Text>
        </View>

        {item.hangoutData && (
          <View style={styles.hangoutDetails}>
            <Text style={styles.hangoutTitle}>💡 Your Hangout Idea:</Text>
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

        <View style={styles.requestMeta}>
          <Text style={styles.metaText}>📅 Sent: {formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>🔄 Loading sent requests...</Text>
      </View>
    );
  }

  const hasRequests = firstDegreeRequests.length > 0 || secondDegreeApprovalRequests.length > 0;

  if (!hasRequests) {
    return (
      <ScrollView
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.emptyText}>📤 No sent requests</Text>
        <Text style={styles.emptySubtext}>
          When you send hangout requests to friends, you'll see their status here!
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.sectionTitle}>📤 Sent Requests</Text>
      
      {firstDegreeRequests.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>👥 Direct Hangout Requests</Text>
          <Text style={styles.subsectionSubtitle}>
            Requests sent directly to 1st degree friends and approved 2nd degree connections
          </Text>
          <FlatList
            data={firstDegreeRequests}
            keyExtractor={item => item.id}
            renderItem={renderHangoutRequest}
            scrollEnabled={false}
          />
        </>
      )}

      {secondDegreeApprovalRequests.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>🤝 Approval Requests</Text>
          <Text style={styles.subsectionSubtitle}>
            Requests for approval to connect with 2nd degree connections
          </Text>
          <FlatList
            data={secondDegreeApprovalRequests}
            keyExtractor={item => item.id}
            renderItem={renderApprovalRequest}
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
    marginTop: 20,
    marginBottom: 4,
    color: '#555',
  },
  subsectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginHorizontal: 16,
    marginBottom: 12,
    fontStyle: 'italic',
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
  secondDegreeDirectCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50', // Green for approved 2nd degree
  },
  approvalRequestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3', // Blue for approval requests
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  mutualInfo: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  mutualText: {
    fontSize: 13,
    color: '#1976d2',
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
  requestMeta: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
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