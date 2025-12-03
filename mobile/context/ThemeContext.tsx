import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { setColorScheme } = useNativeWindColorScheme();
    const [theme, setThemeState] = useState<Theme>('system');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    useEffect(() => {
        if (!loaded) return;

        const applyTheme = (newTheme: Theme) => {
            if (newTheme === 'system') {
                const systemTheme = Appearance.getColorScheme();
                setColorScheme(systemTheme || 'light');
            } else {
                setColorScheme(newTheme);
            }
        };

        applyTheme(theme);
        saveTheme(theme);

        // Listener for system changes if theme is 'system'
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (theme === 'system') {
                setColorScheme(colorScheme || 'light');
            }
        });

        return () => subscription.remove();
    }, [theme, loaded]);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user_theme');
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
                setThemeState(savedTheme as Theme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        } finally {
            setLoaded(true);
        }
    };

    const saveTheme = async (newTheme: Theme) => {
        try {
            await AsyncStorage.setItem('user_theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
