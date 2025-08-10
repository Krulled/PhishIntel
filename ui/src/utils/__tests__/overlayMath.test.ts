import { describe, it, expect } from 'vitest'
import { computeOverlayRects, applyOverlayTransform } from '../overlayMath'

describe('overlayMath', () => {
  describe('computeOverlayRects', () => {
    it('calculates correct scaling and offset for centered image', () => {
      const naturalSize = { width: 1280, height: 720 }
      const displaySize = { width: 640, height: 360 }
      const containerSize = { width: 700, height: 400 }
      
      const result = computeOverlayRects(naturalSize, displaySize, containerSize)
      
      expect(result.scaleX).toBe(0.5) // 640/1280
      expect(result.scaleY).toBe(0.5) // 360/720
      expect(result.offsetX).toBe(30) // (700-640)/2
      expect(result.offsetY).toBe(20) // (400-360)/2
    })

    it('handles case where image fills container exactly', () => {
      const naturalSize = { width: 800, height: 600 }
      const displaySize = { width: 400, height: 300 }
      const containerSize = { width: 400, height: 300 }
      
      const result = computeOverlayRects(naturalSize, displaySize, containerSize)
      
      expect(result.scaleX).toBe(0.5)
      expect(result.scaleY).toBe(0.5)
      expect(result.offsetX).toBe(0)
      expect(result.offsetY).toBe(0)
    })

    it('handles edge case with zero dimensions gracefully', () => {
      const naturalSize = { width: 1000, height: 1000 }
      const displaySize = { width: 0, height: 0 }
      const containerSize = { width: 500, height: 500 }
      
      const result = computeOverlayRects(naturalSize, displaySize, containerSize)
      
      expect(result.scaleX).toBe(0)
      expect(result.scaleY).toBe(0)
      expect(result.offsetX).toBe(250)
      expect(result.offsetY).toBe(250)
    })
  })

  describe('applyOverlayTransform', () => {
    it('correctly transforms bounding box coordinates', () => {
      const box = { x: 100, y: 200, w: 150, h: 50 }
      const transform = { scaleX: 0.5, scaleY: 0.5, offsetX: 30, offsetY: 20 }
      
      const result = applyOverlayTransform(box, transform)
      
      expect(result.left).toBe(80) // 30 + (100 * 0.5)
      expect(result.top).toBe(120) // 20 + (200 * 0.5)
      expect(result.width).toBe(75) // 150 * 0.5
      expect(result.height).toBe(25) // 50 * 0.5
    })

    it('handles zero offsets', () => {
      const box = { x: 50, y: 100, w: 200, h: 100 }
      const transform = { scaleX: 2, scaleY: 1.5, offsetX: 0, offsetY: 0 }
      
      const result = applyOverlayTransform(box, transform)
      
      expect(result.left).toBe(100) // 0 + (50 * 2)
      expect(result.top).toBe(150) // 0 + (100 * 1.5)
      expect(result.width).toBe(400) // 200 * 2
      expect(result.height).toBe(150) // 100 * 1.5
    })

    it('handles fractional coordinates correctly', () => {
      const box = { x: 33.3, y: 66.7, w: 99.9, h: 77.5 }
      const transform = { scaleX: 0.75, scaleY: 0.6, offsetX: 12.5, offsetY: 8.2 }
      
      const result = applyOverlayTransform(box, transform)
      
      expect(result.left).toBeCloseTo(37.475) // 12.5 + (33.3 * 0.75)
      expect(result.top).toBeCloseTo(48.22) // 8.2 + (66.7 * 0.6)
      expect(result.width).toBeCloseTo(74.925) // 99.9 * 0.75
      expect(result.height).toBeCloseTo(46.5) // 77.5 * 0.6
    })
  })

  describe('integration test: realistic screenshot overlay scenario', () => {
    it('calculates overlay positions for typical phishing detection boxes', () => {
      // Realistic scenario: 1920x1080 screenshot displayed at 960x540 in a 1000x600 container
      const naturalSize = { width: 1920, height: 1080 }
      const displaySize = { width: 960, height: 540 }
      const containerSize = { width: 1000, height: 600 }
      
      const transform = computeOverlayRects(naturalSize, displaySize, containerSize)
      
      // Login form at top-right
      const loginBox = { x: 1200, y: 150, w: 300, h: 80 }
      const loginPosition = applyOverlayTransform(loginBox, transform)
      
      expect(loginPosition.left).toBe(620) // 20 + (1200 * 0.5)
      expect(loginPosition.top).toBe(105) // 30 + (150 * 0.5) 
      expect(loginPosition.width).toBe(150) // 300 * 0.5
      expect(loginPosition.height).toBe(40) // 80 * 0.5
      
      // Download button at center
      const downloadBox = { x: 810, y: 490, w: 300, h: 100 }
      const downloadPosition = applyOverlayTransform(downloadBox, transform)
      
      expect(downloadPosition.left).toBe(425) // 20 + (810 * 0.5)
      expect(downloadPosition.top).toBe(275) // 30 + (490 * 0.5)
      expect(downloadPosition.width).toBe(150) // 300 * 0.5
      expect(downloadPosition.height).toBe(50) // 100 * 0.5
    })
  })
})
