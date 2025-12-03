import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Please check your email for verification!');
            router.replace('/(auth)/login');
        }
        setLoading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-background justify-center px-6">
            <View className="items-center mb-8">
                <Trophy size={48} color="#16a34a" />
                <Text className="text-3xl font-bold text-foreground mt-4">TennisMate</Text>
                <Text className="text-muted-foreground mt-2">Create an account</Text>
            </View>

            <View className="gap-4">
                <View>
                    <Text className="text-sm font-medium mb-1 text-foreground">Full Name</Text>
                    <TextInput
                        className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground"
                        placeholder="Enter your name"
                        placeholderTextColor="#9ca3af"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View>
                    <Text className="text-sm font-medium mb-1 text-foreground">Email</Text>
                    <TextInput
                        className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground"
                        placeholder="Enter your email"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </View>

                <View>
                    <Text className="text-sm font-medium mb-1 text-foreground">Password</Text>
                    <TextInput
                        className="w-full h-12 px-4 rounded-lg border border-input bg-background text-foreground"
                        placeholder="Create a password"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    className="w-full h-12 bg-primary rounded-lg items-center justify-center mt-2"
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text className="text-primary-foreground font-bold text-lg">
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-muted-foreground">Already have an account? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text className="text-primary font-bold">Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
