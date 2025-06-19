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
  const [secondDegreeRequests, setSecondDegreeRequests] = useState([]);
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

      // Fetch 1st degree hangout requests (direct requests)
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
            type: 'firstDegree',
            from: data.from,
            to: data.to,
            idea: data.idea,
            eventType: data.eventType,
            time: data.time,
            place: data.place,
            status: data.status,
            degree: data.degree,
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

      // Fetch 2nd degree approval requests (where you need approval from mutual friend)
      const secondDegreeQuery = query(
        collection(db, 'secondDegreeApprovals'),
        where('from', '==', currentUid)
      );
      const secondDegreeSnap = await getDocs(secondDegreeQuery);

      const secondDegreeReqs = await Promise.all(
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
            type: 'secondDegree',
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
      secondDegreeReqs.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setFirstDegreeRequests(firstDegreeReqs);
      setSecondDegreeRequests(secondDegreeReqs);

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
    if (item.type === 'firstDegree') {
      switch (item.status) {
        case 'pending': return '⏳ Pending Response';
        case 'accepted': return '✅ Accepted';
        case 'declined': return '❌ Declined';
        case 'expired': return '⏰ Expired';
        default: return '❓ Unknown';
      }
    } else {
      // Second degree
      switch (item.status) {
        case 'pending': return '⏳ Waiting for Approval';
        case 'approved': return '✅ Approved & Sent';
        case 'declined': return '❌ Approval Declined';
        case 'rejected': return '❌ Approval Rejected';
        default: return '❓ Unknown';
      }
    }
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

  const renderFirstDegreeRequest = ({ item }) => {
    const expired = isExpired(item.expiresAt);
    const displayStatus = expired ? 'expired' : item.status;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.to}` }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.toUser.name}</Text>
            <Text style={styles.bio}>{item.toUser.bio}</Text>
            <Text style={styles.degreeText}>1st Degree Friend</Text>
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

  const renderSecondDegreeRequest = ({ item }) => {
    return (
      <View style={[styles.card, styles.secondDegreeCard]}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.to}` }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.toUser.name}</Text>
            <Text style={styles.bio}>{item.toUser.bio}</Text>
            <Text style={styles.degreeText}>2nd Degree Connection</Text>
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

  const hasRequests = firstDegreeRequests.length > 0 || secondDegreeRequests.length > 0;

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
          <Text style={styles.subsectionTitle}>👥 1st Degree Friends</Text>
          <FlatList
            data={firstDegreeRequests}
            keyExtractor={item => item.id}
            renderItem={renderFirstDegreeRequest}
            scrollEnabled={false}
          />
        </>
      )}

      {secondDegreeRequests.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>🤝 2nd Degree Connections</Text>
          <FlatList
            data={secondDegreeRequests}
            keyExtractor={item => item.id}
            renderItem={renderSecondDegreeRequest}
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
  secondDegreeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
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