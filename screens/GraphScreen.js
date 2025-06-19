// ✨ Enhanced GraphScreen.js with proper hangout request logic

import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
} from 'd3-force';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Line,
  G as RNSVG_G,
  Text as SvgText,
} from 'react-native-svg';

import { auth } from '../firebase';
import {
  buildConnectionGraph,
  cancelHangoutRequest,
  sendHangoutRequest
} from '../firestore';

const AnimatedG = Animated.createAnimatedComponent(RNSVG_G);

function Node({ node, offset, uid, onPress }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withTiming(1, { duration: 400 });
  }, []);
  
  const animatedProps = useAnimatedProps(() => ({
    transform: [{ scale: scale.value }],
  }));

  const { x, y } = node.position || {};
  let color = '#2196F3'; // Default blue for 2nd degree
  
  if (node.id === uid) {
    color = '#FF5722'; // Orange for current user
  } else if (node.degree === 1) {
    color = '#4CAF50'; // Green for 1st degree
  }
  
  if (x === undefined || y === undefined) return null;

  return (
    <AnimatedG
      key={node.id}
      animatedProps={animatedProps}
      originX={x + offset.x}
      originY={y + offset.y}
      onPressIn={onPress}
    >
      <Circle cx={x + offset.x} cy={y + offset.y} r={28} fill={color} />
      <SvgText
        x={x + offset.x}
        y={y + offset.y + 4}
        fill="white"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
      >
        {node.name?.length > 8 ? node.name.slice(0, 7) + '…' : node.name}
      </SvgText>
    </AnimatedG>
  );
}

export default function GraphScreen() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [positions, setPositions] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // Enhanced hangout form state
  const [hangoutIdea, setHangoutIdea] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventPlace, setEventPlace] = useState('');

  const pan = useRef({ x: 0, y: 0 });
  const uid = auth.currentUser?.uid;

  const eventTypes = ['Walk', 'Movie', 'Food', 'Jam Session', 'Study', 'Gaming', 'Sports', 'Other'];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        setOffset({
          x: pan.current.x + gestureState.dx,
          y: pan.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.current = {
          x: pan.current.x + gestureState.dx,
          y: pan.current.y + gestureState.dy,
        };
      },
    })
  ).current;

  useEffect(() => {
    async function setup() {
      const graph = await buildConnectionGraph(uid);
      const width = 800;
      const height = 800;

      const simNodes = graph.nodes.map(n => ({ ...n }));
      const simLinks = graph.edges.map(e => ({ source: e.source, target: e.target }));

      setNodes(simNodes);
      setEdges(simLinks);

      forceSimulation(simNodes)
        .force('charge', forceManyBody().strength(-300))
        .force('center', forceCenter(width / 2, height / 2))
        .force('link', forceLink(simLinks).id(d => d.id).distance(130).strength(0.8))
        .alpha(1)
        .alphaDecay(0.03)
        .velocityDecay(0.4)
        .on('tick', () => {
          const pos = {};
          simNodes.forEach(n => {
            pos[n.id] = { x: n.x, y: n.y, name: n.name, bio: n.bio, requestStatus: n.requestStatus, degree: n.degree };
          });
          setPositions({ ...pos });
        })
        .on('end', () => {
          setLoading(false);
        });
    }
    setup();
  }, [uid]);

  const clearForm = () => {
    setHangoutIdea('');
    setEventType('');
    setEventTime('');
    setEventPlace('');
  };

  const handleSendHangout = async () => {
    if (!hangoutIdea.trim()) {
      Alert.alert('Error', 'Please enter a hangout idea');
      return;
    }

    try {
      const hangoutData = {
        idea: hangoutIdea.trim(),
        eventType: eventType,
        time: eventTime,
        place: eventPlace,
      };

      const result = await sendHangoutRequest(uid, selected.id, hangoutData);
      
      if (result.requiresApproval) {
        Alert.alert('✅ Approval Requested', 'Your hangout request has been sent to a mutual friend for approval!');
      } else {
        Alert.alert('✅ Request Sent', 'Your hangout request has been sent directly!');
      }
      
      clearForm();
      setSelected(null);
      
      // Refresh the graph to update status
      const graph = await buildConnectionGraph(uid);
      setNodes(graph.nodes);
      
    } catch (error) {
      console.error('Error sending hangout request:', error);
      Alert.alert('Error', error.message || 'Failed to send hangout request');
    }
  };

  const handleCancelRequest = async () => {
    try {
      await cancelHangoutRequest(uid, selected.id);
      Alert.alert('🚫 Request Cancelled', 'Your hangout request has been cancelled');
      setSelected(null);
      
      // Refresh the graph
      const graph = await buildConnectionGraph(uid);
      setNodes(graph.nodes);
    } catch (error) {
      console.error('Error cancelling request:', error);
      Alert.alert('Error', 'Failed to cancel request');
    }
  };

  const width = 1000;
  const height = 1000;

  if (loading || !Object.keys(positions).length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading graph...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Text style={styles.title}>🕸️ Your Orbit</Text>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF5722' }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>1st Degree</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>2nd Degree</Text>
        </View>
      </View>
      
      <Svg width={width} height={height}>
        {edges.map((e, i) => {
          const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
          const targetId = typeof e.target === 'object' ? e.target.id : e.target;
          const from = positions[sourceId];
          const to = positions[targetId];
          if (!from || !to) return null;
          return (
            <Line
              key={`edge-${i}`}
              x1={from.x + offset.x}
              y1={from.y + offset.y}
              x2={to.x + offset.x}
              y2={to.y + offset.y}
              stroke="#bbb"
              strokeWidth="1.5"
            />
          );
        })}

        {nodes.map((node) => (
          <Node
            key={node.id}
            node={{ ...node, position: positions[node.id] }}
            offset={offset}
            uid={uid}
            onPress={() => {
              if (node.id !== uid) {
                const nodeWithStatus = { ...node, ...positions[node.id] };
                setSelected(nodeWithStatus);
              }
            }}
          />
        ))}
      </Svg>

      {selected && (
        <ScrollView style={styles.profileCardCentered} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setSelected(null);
              clearForm();
            }}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <View style={styles.profileHeader}>
            <Image
              source={{ uri: `https://i.pravatar.cc/150?u=${selected.id}` }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{selected.name}</Text>
              <Text style={styles.profileBio}>{selected.bio || 'No bio set'}</Text>
              <Text style={styles.degreeText}>
                {selected.degree === 1 ? '1st Degree Friend' : '2nd Degree Connection'}
              </Text>
            </View>
          </View>

          {/* Enhanced Hangout Form */}
          {(selected.requestStatus === 'none' || selected.requestStatus === 'connected') && (
            <View style={styles.hangoutForm}>
              <Text style={styles.formTitle}>Plan a Hangout</Text>
              
              <TextInput
                placeholder="What's your hangout idea?"
                value={hangoutIdea}
                onChangeText={setHangoutIdea}
                style={styles.inputBox}
                multiline
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
                  styles.requestButton,
                  hangoutIdea.trim() === '' && { backgroundColor: '#ccc' }
                ]}
                disabled={hangoutIdea.trim() === ''}
                onPress={handleSendHangout}
              >
                <Text style={styles.requestText}>
                  {selected.degree === 2 ? 'Request Approval & Send' : 'Send Hangout Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status-based buttons */}
          {selected.requestStatus === 'pending' && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Request Pending ⏳</Text>
              <TouchableOpacity
                style={[styles.requestButton, { backgroundColor: '#e63946' }]}
                onPress={handleCancelRequest}
              >
                <Text style={styles.requestText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          )}

          {selected.requestStatus === 'approved' && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Request Approved ✅</Text>
            </View>
          )}

          {selected.requestStatus === 'pendingApproval' && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Waiting for Mutual Friend Approval 🤝</Text>
              <Text style={styles.statusSubtext}>
                Your request needs approval from a mutual friend since this is a 2nd degree connection.
              </Text>
            </View>
          )}

          {selected.requestStatus === 'declined' && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Request Declined ❌</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileCardCentered: {
    position: 'absolute',
    top: '15%',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    maxHeight: '70%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 6,
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileBio: {
    fontSize: 13,
    color: '#666',
  },
  degreeText: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
  },
  hangoutForm: {
    marginTop: 10,
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  inputBox: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  labelText: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  eventTypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#eee',
    borderRadius: 20,
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
  requestButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  requestText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  statusSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});