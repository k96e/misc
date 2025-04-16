import { Angle } from './angle.js';

/**
 * Defines standard map scale properties.
 * Using a plain object frozen for immutability, mimicking an Enum.
 */
export const Scale = Object.freeze({
    LEVEL_1M:   { code: "A", lon_diff: new Angle(6),        lat_diff: new Angle(4),         nums: 1 },  // 1:1,000,000
    LEVEL_500K: { code: "B", lon_diff: new Angle(3),        lat_diff: new Angle(2),         nums: 2 },  // 1:500,000
    LEVEL_250K: { code: "C", lon_diff: new Angle(1, 30),    lat_diff: new Angle(1),         nums: 4 },  // 1:250,000
    LEVEL_100K: { code: "D", lon_diff: new Angle(0, 30),    lat_diff: new Angle(0, 20),     nums: 12 }, // 1:100,000
    LEVEL_50K:  { code: "E", lon_diff: new Angle(0, 15),    lat_diff: new Angle(0, 10),     nums: 2 },  // 1:50,000
    LEVEL_25K:  { code: "F", lon_diff: new Angle(0, 7, 30), lat_diff: new Angle(0, 5),      nums: 2 },  // 1:25,000
    LEVEL_10K:  { code: "G", lon_diff: new Angle(0, 3, 45), lat_diff: new Angle(0, 2, 30),  nums: 8 },  // 1:10,000
    LEVEL_5K:   { code: "H", lon_diff: new Angle(0, 1, 52.5),lat_diff: new Angle(0, 1, 15), nums: 2 },  // 1:5,000
    // New standard specific scales (nums not relevant for old standard)
    LEVEL_2K:   { code: "I", lon_diff: new Angle(0, 0, 37.5), lat_diff: new Angle(0, 0, 25), nums: 0 }, // 1:2,000
    LEVEL_1K:   { code: "J", lon_diff: new Angle(0, 0, 18.75),lat_diff: new Angle(0, 0, 12.5), nums: 0 }, // 1:1,000
    LEVEL_500:  { code: "K", lon_diff: new Angle(0, 0, 9.375),lat_diff: new Angle(0, 0, 6.25), nums: 0 }  // 1:500
});

/**
 * Utility functions for Scale.
 */
export class ScaleUtil {
    /**
     * Get Scale definition from its code character.
     * @param {string} code - The scale code (e.g., 'A', 'B'). Case-insensitive.
     * @returns {object} The scale definition object (e.g., Scale.LEVEL_1M).
     * @throws {Error} If the code is invalid.
     */
    static fromCode(code) {
        const upperCode = code.toUpperCase();
        for (const key in Scale) {
            if (Scale[key].code === upperCode) {
                return Scale[key];
            }
        }
        throw new Error(`Invalid scale code: ${code}`);
    }
}