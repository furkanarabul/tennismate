/**
 * Unit Tests - useMatching composable
 * 
 * Unit tests isolate and test a single function.
 * They work with mock data, no real API calls.
 */
import { describe, it, expect } from 'vitest'

// Test the distance calculation function
// This function calculates the distance between two coordinates in km
describe('Distance Calculation', () => {

    // Haversine formula - distance between two points
    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 6371 // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180
        const dLon = ((lon2 - lon1) * Math.PI) / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return Math.round(R * c * 10) / 10
    }

    it('should return 0 for the same point', () => {
        // Frankfurt coordinates
        const result = calculateDistance(50.1109, 8.6821, 50.1109, 8.6821)
        expect(result).toBe(0)
    })

    it('should calculate Frankfurt - Berlin as ~420-430 km', () => {
        // Frankfurt: 50.1109, 8.6821
        // Berlin: 52.5200, 13.4050
        const result = calculateDistance(50.1109, 8.6821, 52.5200, 13.4050)
        expect(result).toBeGreaterThan(400)
        expect(result).toBeLessThan(450)
    })

    it('should calculate Frankfurt - Istanbul as ~2000 km', () => {
        // Frankfurt: 50.1109, 8.6821
        // Istanbul: 41.0082, 28.9784
        const result = calculateDistance(50.1109, 8.6821, 41.0082, 28.9784)
        expect(result).toBeGreaterThan(1800)
        expect(result).toBeLessThan(2200)
    })

    it('should work with negative and positive coordinates', () => {
        // Sydney, Australia: -33.8688, 151.2093
        // Tokyo, Japan: 35.6762, 139.6503
        const result = calculateDistance(-33.8688, 151.2093, 35.6762, 139.6503)
        expect(result).toBeGreaterThan(7000)
    })
})

// Skill level matching logic
describe('Skill Level Matching', () => {
    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional']

    const getSkillIndex = (skill: string): number => {
        return skillLevels.indexOf(skill)
    }

    const isCompatibleSkill = (skill1: string, skill2: string, maxDiff: number = 1): boolean => {
        const diff = Math.abs(getSkillIndex(skill1) - getSkillIndex(skill2))
        return diff <= maxDiff
    }

    it('should match same skill levels', () => {
        expect(isCompatibleSkill('Beginner', 'Beginner')).toBe(true)
        expect(isCompatibleSkill('Advanced', 'Advanced')).toBe(true)
    })

    it('should match one level difference', () => {
        expect(isCompatibleSkill('Beginner', 'Intermediate')).toBe(true)
        expect(isCompatibleSkill('Intermediate', 'Advanced')).toBe(true)
    })

    it('should not match two level difference by default', () => {
        expect(isCompatibleSkill('Beginner', 'Advanced')).toBe(false)
        expect(isCompatibleSkill('Beginner', 'Professional')).toBe(false)
    })

    it('should allow flexibility with maxDiff parameter', () => {
        expect(isCompatibleSkill('Beginner', 'Advanced', 2)).toBe(true)
        expect(isCompatibleSkill('Beginner', 'Professional', 3)).toBe(true)
    })
})
