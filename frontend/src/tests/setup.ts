/**
 * Vitest setup — runs before every test file.
 *
 * 1. Extends `expect` with @testing-library/jest-dom matchers
 *    (toBeInTheDocument, toHaveValue, …)
 * 2. Stubs browser APIs that are absent in jsdom but required
 *    by Radix UI primitives (Dialog, etc.)
 */
import '@testing-library/jest-dom'

// ── Radix UI / browser API stubs ─────────────────────────────────────────────

// ResizeObserver — used internally by several Radix primitives
class MockResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// matchMedia — used by Radix Dialog for reduced-motion checks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches:             false,
    media:               query,
    onchange:            null,
    addListener:         vi.fn(),
    removeListener:      vi.fn(),
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent:       vi.fn(),
  }),
})

// scrollIntoView — not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Pointer capture — used by Radix focus management
Element.prototype.hasPointerCapture  = vi.fn().mockReturnValue(false) as () => boolean
Element.prototype.setPointerCapture  = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()
