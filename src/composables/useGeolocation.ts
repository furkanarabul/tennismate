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

    const getCurrentPosition = async (retrying = false): Promise<GeolocationCoordinates | null> => {
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

        console.log(`🗺️ Requesting location... ${retrying ? '(Retry with High Accuracy)' : ''}`)

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        // On retry, force high accuracy which often resolves "Location Unknown" on macOS/iOS
                        enableHighAccuracy: retrying,
                        timeout: retrying ? 15000 : 10000, // Shorter timeout for first attempt
                        maximumAge: retrying ? 0 : 60000 // Force fresh on retry
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
                PERMISSION_DENIED: err.PERMISSION_DENIED,
                POSITION_UNAVAILABLE: err.POSITION_UNAVAILABLE,
                TIMEOUT: err.TIMEOUT
            })

            // Retry logic for Position Unavailable (2) or Timeout (3)
            // This is common on macOS Safari/Chrome when "Low Power Mode" is on or Wi-Fi triangulation fails
            if (!retrying && (err.code === 2 || err.code === 3)) {
                console.log('🔄 Retrying location with high accuracy...')
                return getCurrentPosition(true)
            }

            const geoError: LocationError = {
                code: err.code || 0,
                message: getErrorMessage(err.code)
            }
            error.value = geoError
            return null
        } finally {
            if (!retrying) loading.value = false
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
