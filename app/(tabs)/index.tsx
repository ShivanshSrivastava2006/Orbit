import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    router.push('/abc'); // test navigation
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Redirecting to ABC...</Text>
    </View>
  );
}
