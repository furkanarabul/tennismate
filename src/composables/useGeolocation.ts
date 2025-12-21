import { ref, computed } from 'vue'

export interface GeolocationCoordinates {
    latitude: number
    longitude: number
    accuracy: number
}

export interface LocationError {
    code: number
    message: string
}

export function useGeolocation() {
    const coordinates = ref<GeolocationCoordinates | null>(null)
    const error = ref<LocationError | null>(null)
    const loading = ref(false)

    const isSupported = computed(() => {
        return 'geolocation' in navigator
    })

    const getCurrentPosition = async (retryLevel = 0): Promise<GeolocationCoordinates | null> => {
        // Check for consent first
        const consent = localStorage.getItem('tennis_mate_consent')
        if (consent === 'declined') {
            error.value = {
                code: 4,
                message: 'Location access was declined by user preference'
            }
            return null
        }

        if (!isSupported.value) {
            error.value = {
                code: 0,
                message: 'Geolocation is not supported by your browser'
            }
            return null
        }

        loading.value = true
        error.value = null

        const isRetrying = retryLevel > 0
        // Level 0: Normal (High Accuracy, 10s)
        // Level 1: Retry (High Accuracy, 20s)
        // Level 2: Fallback (Low Accuracy, 20s)

        const useHighAccuracy = retryLevel < 2
        const timeout = retryLevel === 0 ? 10000 : 20000
        const maxAge = retryLevel === 0 ? 60000 : 0

        console.log(`🗺️ Requesting location... (Attempt ${retryLevel + 1}, HighAccuracy: ${useHighAccuracy})`)

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: useHighAccuracy,
                        timeout: timeout,
                        maximumAge: maxAge
                    }
                )
            })

            console.log('✅ Location received:', position.coords)

            coordinates.value = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            }

            return coordinates.value
        } catch (err: any) {
            console.error('❌ Location error details:', {
                code: err.code,
                message: err.message,
                retryLevel
            })

            // Retry logic
            // If Level 0 fails with Timeout(3) or Unavailable(2), try Level 1 (High Accuracy, Longer Timeout)
            if (retryLevel === 0 && (err.code === 2 || err.code === 3)) {
                console.log('🔄 Retrying location with higher timeout...')
                return getCurrentPosition(1)
            }

            // If Level 1 fails, try Level 2 (Low Accuracy / IP based) as last resort
            if (retryLevel === 1 && (err.code === 2 || err.code === 3)) {
                console.log('🔄 Retrying location with low accuracy (IP-based fallback)...')
                return getCurrentPosition(2)
            }

            const geoError: LocationError = {
                code: err.code || 0,
                message: getErrorMessage(err.code)
            }
            error.value = geoError
            return null
        } finally {
            if (retryLevel === 0) loading.value = false
        }
    }

    const getErrorMessage = (code: number): string => {
        switch (code) {
            case 1:
                return 'Location permission denied. Please enable location access in your browser settings.'
            case 2:
                return 'Location unavailable. Try refreshing or checking your device settings (Wi-Fi/GPS).'
            case 3:
                return 'Location request timed out. Please try again.'
            default:
                return 'An error occurred while getting your location.'
        }
    }

    const checkPermission = async (): Promise<PermissionState | null> => {
        if (!('permissions' in navigator)) return null
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' })
            return result.state
        } catch (err) {
            console.error('Error checking permissions:', err)
            return null
        }
    }

    const clearLocation = () => {
        coordinates.value = null
        error.value = null
    }

    return {
        coordinates,
        error,
        loading,
        isSupported,
        getCurrentPosition,
        clearLocation,
        checkPermission
    }
}
