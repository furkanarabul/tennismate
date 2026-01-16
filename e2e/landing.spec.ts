/**
 * E2E Tests - Landing Page
 * 
 * E2E (End-to-End) tests run in a real browser.
 * They simulate the actual user experience.
 * 
 * Command: npx playwright test
 */
import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to home page before each test
        await page.goto('/')
    })

    test('should have TennisMate in page title', async ({ page }) => {
        // Check the page title
        await expect(page).toHaveTitle(/TennisMate/i)
    })

    test('should display hero section', async ({ page }) => {
        // Is hero text visible?
        const heroText = page.locator('text=Tennis').first()
        await expect(heroText).toBeVisible()
    })

    test('should load page content', async ({ page }) => {
        // Body should have content
        const body = page.locator('body')
        await expect(body).not.toBeEmpty()
    })

    test('should load correctly on mobile viewport', async ({ page }) => {
        // Switch to mobile viewport
        await page.setViewportSize({ width: 375, height: 667 })
        await page.reload()

        // Page should be loaded
        await expect(page.locator('body')).toBeVisible()
    })
})

test.describe('Navigation', () => {

    test('should access login page', async ({ page }) => {
        await page.goto('/login')

        // Page loaded
        await expect(page).toHaveURL(/login/)
        await expect(page.locator('body')).toBeVisible()
    })

    test('should access register page', async ({ page }) => {
        await page.goto('/register')

        // Page loaded
        await expect(page).toHaveURL(/register/)
        await expect(page.locator('body')).toBeVisible()
    })
})

test.describe('Login Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
    })

    test('should display email input', async ({ page }) => {
        // Placeholder: you@example.com
        const emailInput = page.getByPlaceholder(/example\.com/i)
        await expect(emailInput).toBeVisible()
    })

    test('should display password input', async ({ page }) => {
        // Placeholder: ••••••••
        const passwordInput = page.locator('input[type="password"]').first()
        await expect(passwordInput).toBeVisible()
    })

    test('should display submit button', async ({ page }) => {
        const submitButton = page.locator('button[type="submit"]')
        await expect(submitButton).toBeVisible()
    })

    test('should not submit empty form', async ({ page }) => {
        const submitButton = page.locator('button[type="submit"]')

        // Submit with empty form
        await submitButton.click()

        // Should still be on login page (no redirect)
        await expect(page).toHaveURL(/login/)
    })
})

test.describe('Register Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/register')
    })

    test('should display name input', async ({ page }) => {
        // Placeholder: John Doe
        const nameInput = page.getByPlaceholder(/john|doe/i)
        await expect(nameInput).toBeVisible()
    })

    test('should display email input', async ({ page }) => {
        // Placeholder: you@example.com
        const emailInput = page.getByPlaceholder(/example\.com/i)
        await expect(emailInput).toBeVisible()
    })

    test('should display password input', async ({ page }) => {
        // Placeholder: ••••••••
        const passwordInput = page.locator('input[type="password"]').first()
        await expect(passwordInput).toBeVisible()
    })
})

test.describe('Responsive Design', () => {

    const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 },
    ]

    for (const viewport of viewports) {
        test(`should load correctly on ${viewport.name} viewport`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height })
            await page.goto('/')

            // Page loaded?
            await expect(page.locator('body')).toBeVisible()

            // No critical errors?
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))

            // Wait a bit
            await page.waitForTimeout(1000)

            // Should have no serious JavaScript errors
            expect(errors.filter(e => e.includes('Error'))).toHaveLength(0)
        })
    }
})
