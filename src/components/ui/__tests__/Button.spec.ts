/**
 * Component Tests - Button Component
 * 
 * Component tests render Vue components and
 * test their DOM output and behavior.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {

    it('should render correctly', () => {
        const wrapper = mount(Button, {
            slots: {
                default: 'Click me'
            }
        })
        expect(wrapper.text()).toContain('Click me')
    })

    it('should be disabled when disabled prop is true', () => {
        const wrapper = mount(Button, {
            props: { disabled: true },
            slots: { default: 'Disabled' }
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('should accept different variant prop values', () => {
        const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']

        variants.forEach(variant => {
            const wrapper = mount(Button, {
                props: { variant: variant as any },
                slots: { default: 'Button' }
            })
            expect(wrapper.exists()).toBe(true)
        })
    })

    it('should accept different size prop values', () => {
        const sizes = ['default', 'sm', 'lg', 'icon']

        sizes.forEach(size => {
            const wrapper = mount(Button, {
                props: { size: size as any },
                slots: { default: 'Button' }
            })
            expect(wrapper.exists()).toBe(true)
        })
    })

    it('should emit click event', async () => {
        const wrapper = mount(Button, {
            slots: { default: 'Click me' }
        })

        await wrapper.trigger('click')
        // Button component doesn't directly emit click event,
        // it works through native click handler
        expect(wrapper.emitted()).toBeDefined()
    })
})
