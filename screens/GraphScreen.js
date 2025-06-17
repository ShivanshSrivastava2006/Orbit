import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
} from 'd3-force';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
  sendConnectionRequest,
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
  const color = node.id === uid ? '#FF5722' : '#2196F3';

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
  const [hangoutIdea, setHangoutIdea] = useState('');

  const pan = useRef({ x: 0, y: 0 });
  const uid = auth.currentUser?.uid;

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
            pos[n.id] = { x: n.x, y: n.y, name: n.name, bio: n.bio };
          });
          setPositions({ ...pos });
        })
        .on('end', () => {
          setLoading(false);
        });
    }
    setup();
  }, [uid]);

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
              if (node.id !== uid) setSelected(node);
            }}
          />
        ))}
      </Svg>

      {selected && (
        <View style={styles.profileCardCentered}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelected(null)}
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
            </View>
          </View>

          <TextInput
            placeholder="Suggest a hangout idea..."
            value={hangoutIdea}
            onChangeText={setHangoutIdea}
            style={styles.inputBox}
          />

          <TouchableOpacity
            style={[styles.requestButton, hangoutIdea.trim() === '' && { backgroundColor: '#ccc' }]}
            disabled={hangoutIdea.trim() === ''}
            onPress={async () => {
              await sendHangoutRequest(uid, selected.id, hangoutIdea.trim());
              alert('✅ Hangout request sent!');
              setHangoutIdea('');
            }}
          >
            <Text style={styles.requestText}>Send Hangout Idea</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.requestButton, selected.requestSent && { backgroundColor: '#ccc' }]}
            disabled={selected.requestSent}
            onPress={async () => {
              await sendConnectionRequest(uid, selected.id);
              alert('✅ Connection request sent!');
              setSelected(null);
            }}
          >
            <Text style={styles.requestText}>
              {selected.requestSent ? 'Requested ✅' : 'Send Request'}
            </Text>
          </TouchableOpacity>
        </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCardCentered: {
    position: 'absolute',
    top: '20%',
    left: 30,
    right: 30,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  profileBio: { fontSize: 13, color: '#666' },
  requestButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  requestText: { color: '#fff', fontWeight: 'bold' },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 6,
  },
  closeText: { fontSize: 20, fontWeight: 'bold', color: '#999' },
  inputBox: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
});