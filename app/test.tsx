import { Text, View } from 'react-native';

export default function Test() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
        Test Page - App Works!
      </Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
        Si vous voyez ceci, l'application fonctionne
      </Text>
    </View>
  );
}

