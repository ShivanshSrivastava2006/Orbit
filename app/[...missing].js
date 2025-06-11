import { View, Text } from 'react-native';

export default function CatchAllScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>Invalid route accessed: fallback screen loaded</Text>
    </View>
  );
}
