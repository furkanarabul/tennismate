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

    const getCurrentPosition = async (): Promise<GeolocationCoordinates | null> => {
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

        console.log('🗺️ Requesting location...')

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: false, // Changed to false for faster response
                        timeout: 30000, // Increased to 30 seconds
                        maximumAge: 60000 // Use cached location up to 1 minute old
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
            console.error('❌ Location error:', err)
            const geoError: LocationError = {
                code: err.code || 0,
                message: getErrorMessage(err.code)
            }
            error.value = geoError
            return null
        } finally {
            loading.value = false
        }
    }

    const getErrorMessage = (code: number): string => {
        switch (code) {
            case 1:
                return 'Location permission denied. Please enable location access in your browser settings.'
            case 2:
                return 'Location unavailable. Please check your device settings.'
            case 3:
                return 'Location request timed out. Please try again.'
            default:
                return 'An error occurred while getting your location.'
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
        clearLocation
    }
}
