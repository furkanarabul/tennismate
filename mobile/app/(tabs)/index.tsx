import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Hero Section */}
        <View className="px-6 py-12 items-center">
          <View className="bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Text className="text-primary font-medium text-sm">Find Your Perfect Tennis Partner</Text>
          </View>

          <Text className="text-4xl font-bold text-center text-foreground mb-4">
            Match. <Text className="text-primary">Play.</Text> Win.
          </Text>

          <Text className="text-center text-muted-foreground text-lg mb-8">
            Connect with local players, schedule matches, and level up your game.
          </Text>

          <TouchableOpacity
            className="bg-primary px-8 py-4 rounded-full flex-row items-center"
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Text className="text-primary-foreground font-bold text-lg mr-2">Start Matching</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Features Preview */}
        <View className="px-6 py-8 bg-secondary/30">
          <Text className="text-2xl font-bold text-foreground mb-6">How it Works</Text>

          <View className="gap-6">
            <View className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <Text className="text-xl font-bold text-foreground mb-2">1. Discover</Text>
              <Text className="text-muted-foreground">Find players in your area based on skill level and availability.</Text>
            </View>

            <View className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <Text className="text-xl font-bold text-foreground mb-2">2. Connect</Text>
              <Text className="text-muted-foreground">Chat, schedule matches, and build your tennis network.</Text>
            </View>

            <View className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <Text className="text-xl font-bold text-foreground mb-2">3. Play</Text>
              <Text className="text-muted-foreground">Meet on the court and enjoy the game you love.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
