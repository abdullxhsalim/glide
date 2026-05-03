const decodePolyline = require('../utils/polyline');

describe('Polyline Decoder', () => {
  describe('decodePolyline', () => {
    test('should decode a simple polyline string', () => {
      // A simple encoded polyline string representing two points
      const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
      const result = decodePolyline(encoded);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(expect.arrayContaining([expect.any(Number), expect.any(Number)]));
    });

    test('should return an array with latitude and longitude coordinates', () => {
      const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
      const result = decodePolyline(encoded);
      
      result.forEach((coord) => {
        expect(Array.isArray(coord)).toBe(true);
        expect(coord).toHaveLength(2);
        expect(typeof coord[0]).toBe('number');
        expect(typeof coord[1]).toBe('number');
      });
    });

    test('should handle empty string', () => {
      const encoded = '';
      const result = decodePolyline(encoded);
      
      expect(result).toEqual([]);
    });

    test('should use default precision of 5', () => {
      // This test verifies that the default precision is applied
      const encoded = '_p~iF~ps|U';
      const resultDefault = decodePolyline(encoded);
      const resultExplicit = decodePolyline(encoded, 5);
      
      expect(resultDefault).toEqual(resultExplicit);
    });

    test('should handle different precision levels', () => {
      // Testing with precision 6 (10x more accurate)
      const encoded = '_p~iF~ps|U';
      const precision5 = decodePolyline(encoded, 5);
      const precision6 = decodePolyline(encoded, 6);
      
      // Results should be different due to different precision
      expect(precision5).toBeDefined();
      expect(precision6).toBeDefined();
      // Precision 6 coordinates should be larger (more accurate) than precision 5
      expect(precision6[0][0]).not.toEqual(precision5[0][0]);
    });

    test('should produce GeoJSON format with [lng, lat]', () => {
      // Verifying that coordinates follow GeoJSON format [longitude, latitude]
      const encoded = '_p~iF~ps|U';
      const result = decodePolyline(encoded);
      
      result.forEach((coord) => {
        // Longitude should typically be between -180 and 180
        expect(coord[0]).toBeGreaterThanOrEqual(-180);
        expect(coord[0]).toBeLessThanOrEqual(180);
        // Latitude should be between -90 and 90
        expect(coord[1]).toBeGreaterThanOrEqual(-90);
        expect(coord[1]).toBeLessThanOrEqual(90);
      });
    });

    test('should decode realistic Google Maps encoded polyline', () => {
      // A realistic example from a route between two locations
      const encoded = 'yvxeFvysoU@IHm@hAkBnAyBxBaEt@}ANwBr@wEpBcOnCgOlBcIz@gEhAmG';
      const result = decodePolyline(encoded);
      
      expect(result.length).toBeGreaterThan(0);
      // Check all points are valid geographic coordinates
      result.forEach((coord) => {
        expect(coord[0]).toBeGreaterThanOrEqual(-180);
        expect(coord[0]).toBeLessThanOrEqual(180);
        expect(coord[1]).toBeGreaterThanOrEqual(-90);
        expect(coord[1]).toBeLessThanOrEqual(90);
      });
    });

    test('should handle single point polyline', () => {
      // Even a single encoded point should decode properly
      const encoded = '_p~iF~ps|U';
      const result = decodePolyline(encoded);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveLength(2);
    });

    test('should maintain coordinate order', () => {
      const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
      const result = decodePolyline(encoded);
      
      // Coordinates should be in order
      expect(result).toHaveLength(3);
      // Verify it's not just returning the same coordinate multiple times
      const firstCoord = result[0];
      const hasVariation = result.some(coord => 
        coord[0] !== firstCoord[0] || coord[1] !== firstCoord[1]
      );
      expect(hasVariation).toBe(true);
    });

    test('should handle high precision polylines correctly', () => {
      // Precision 8 would be used for very detailed routes
      const encoded = '_p~iF~ps|U';
      const result = decodePolyline(encoded, 8);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      result.forEach((coord) => {
        expect(typeof coord[0]).toBe('number');
        expect(typeof coord[1]).toBe('number');
      });
    });

    test('should be consistent across multiple calls', () => {
      const encoded = '_p~iF~ps|U_ulLnnqC';
      const result1 = decodePolyline(encoded);
      const result2 = decodePolyline(encoded);
      
      expect(result1).toEqual(result2);
    });
  });
});
