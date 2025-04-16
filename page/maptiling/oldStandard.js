import { Angle } from './angle.js';
import { Scale } from './scale.js';

/**
 * Handles calculations for the National Standard Topographic Map Old Numbering System.
 */
export class OldStandard {
    scale;

    /**
     * Creates an instance for a specific scale.
     * @param {object} scale - A scale definition object from the Scale enum (e.g., Scale.LEVEL_100K).
     */
    constructor(scale) {
        if (!scale || !scale.code) {
            throw new Error("Invalid scale provided to OldStandard constructor");
        }
        this.scale = scale;
    }

    /**
     * Calculates the 1:1M map sheet row (H) and column (L).
     * @param {Angle} lon - Longitude.
     * @param {Angle} lat - Latitude.
     * @returns {Array<number>} [H, L] (1-based indices).
     */
    calc_1M(lon, lat) {
        // Ensure lon/lat are Angle objects
        if (!(lon instanceof Angle)) lon = Angle.fromDecimal(lon);
        if (!(lat instanceof Angle)) lat = Angle.fromDecimal(lat);

        const H = Math.floor(lat.divideByAngle(Scale.LEVEL_1M.lat_diff)) + 1;
        const L = Math.floor(lon.divideByAngle(Scale.LEVEL_1M.lon_diff)) + 31;
        return [H, L];
    }

    /**
     * Calculates the southwest corner coordinates of a 1:1M map sheet.
     * @param {number} H - Row number (1-based).
     * @param {number} L - Column number (1-based, starting from 31).
     * @returns {Array<Angle>} [longitude, latitude] of the southwest corner.
     */
    calc_1M_reverse(H, L) {
        const lon = Scale.LEVEL_1M.lon_diff.multiply(L - 31);
        const lat = Scale.LEVEL_1M.lat_diff.multiply(H - 1);
        return [lon, lat];
    }

    /**
     * Calculates the sequence number of a map sheet within its parent map sheet.
     * @param {Angle} lon - Longitude.
     * @param {Angle} lat - Latitude.
     * @param {object} scale - The scale definition of the current map sheet.
     * @param {object} last_scale - The scale definition of the parent map sheet.
     * @returns {number} The sequence number (1-based).
     */
    calc_step(lon, lat, scale, last_scale) {
         // Ensure lon/lat are Angle objects
        if (!(lon instanceof Angle)) lon = Angle.fromDecimal(lon);
        if (!(lat instanceof Angle)) lat = Angle.fromDecimal(lat);

        const V = scale.nums * (scale.nums - 1) + 1; // Python logic preserved

        // Use decimal values for modulo and division before floor
        const lat_rem_dec = lat.modulo(last_scale.lat_diff).toDecimal();
        const lon_rem_dec = lon.modulo(last_scale.lon_diff).toDecimal();

        // Handle potential floating point issues near boundaries for modulo
        const epsilon = Angle.epsilon;
        const lat_parent_dec = last_scale.lat_diff.toDecimal();
        const lon_parent_dec = last_scale.lon_diff.toDecimal();

        let safe_lat_rem_dec = lat_rem_dec;
        if (Math.abs(lat_rem_dec - lat_parent_dec) < epsilon) {
             safe_lat_rem_dec = 0; // Treat value very close to upper bound as belonging to lower cell
        }

        let safe_lon_rem_dec = lon_rem_dec;
         if (Math.abs(lon_rem_dec - lon_parent_dec) < epsilon) {
             safe_lon_rem_dec = 0; // Treat value very close to upper bound as belonging to lower cell
        }


        const v_lat = Math.floor(safe_lat_rem_dec / scale.lat_diff.toDecimal());
        const v_lon = Math.floor(safe_lon_rem_dec / scale.lon_diff.toDecimal());

        // Original formula: V - v_lat * scale.nums + v_lon
        // Mapping to grid: Rows decrease from top, Columns increase from left.
        // Example 1:100k (12x12) in 1:1M:
        // v_lat = row index from bottom (0-11), v_lon = col index from left (0-11)
        // Numbering starts 1 at top-left, increases right, then next row down.
        // Row index from top (0-11) = (nums - 1) - v_lat
        // Number = (row_from_top * nums) + v_lon + 1
        const row_from_top = (last_scale.lat_diff.divideByAngle(scale.lat_diff) - 1) - v_lat;
        const number = row_from_top * scale.nums + v_lon + 1;

        // Let's re-verify the original Python formula's intent.
        // V = scale.nums * (scale.nums - 1) + 1  -> Seems complex, likely error-prone or specific convention?
        // Let's test with 1:100K (nums=12). last=1M. lat=4, lon=6. scale lat=20', lon=30'
        // Example: Point at SW corner (lat=0, lon=0 within 1M) -> v_lat=0, v_lon=0. Expected result: 133? (bottom-left)
        // Original: V - 0*12 + 0 = V = 12 * 11 + 1 = 133. Correct.
        // Example: Point near NE corner (lat~4, lon~6) -> v_lat=11, v_lon=11. Expected result: 12? (top-right)
        // Original: V - 11*12 + 11 = 133 - 132 + 11 = 12. Correct.
        // OK, the Python formula V - v_lat * scale.nums + v_lon seems correct for its specific numbering.
        return V - v_lat * scale.nums + v_lon; // Use original Python logic
    }

    /**
     * Calculates the southwest corner of a map sheet based on its parent's corner and its sequence code.
     * @param {Angle} last_lon - Longitude of the parent's southwest corner.
     * @param {Angle} last_lat - Latitude of the parent's southwest corner.
     * @param {object} scale - The scale definition of the current map sheet.
     * @param {number} code - The sequence number (1-based) of the current sheet within the parent.
     * @returns {Array<Angle>} [longitude, latitude] of the southwest corner.
     */
    calc_reverse(last_lon, last_lat, scale, code) {
        // Ensure angles
        if (!(last_lon instanceof Angle)) last_lon = Angle.fromDecimal(last_lon);
        if (!(last_lat instanceof Angle)) last_lat = Angle.fromDecimal(last_lat);

        // Calculate row and column index (0-based) from the code
        // Formula derived from reversing calc_step's V - v_lat*nums + v_lon logic implicitly
        // or more directly: Numbering goes 1..N left-to-right, top-to-bottom.
        const row_from_top = Math.floor((code - 1) / scale.nums);
        const col_from_left = (code - 1) % scale.nums;

        // Calculate offset lat/lon
        // Latitude decreases from top, so we need row index from bottom
        const total_rows = Math.round(Scale.LEVEL_1M.lat_diff.divideByAngle(scale.lat_diff)); // Or parent's diff / scale diff
        // Correction: Need parent scale context if not 1M parent
         const rows_in_parent = Math.round(this._getParentScale(scale).lat_diff.divideByAngle(scale.lat_diff));
         //const row_from_bottom = (scale.nums - 1) - row_from_top; // If nums always related to rows? No, nums is row * col / or just cols?
         const row_from_bottom = (rows_in_parent - 1) - row_from_top;

        const lon = last_lon.add(scale.lon_diff.multiply(col_from_left));
        const lat = last_lat.add(scale.lat_diff.multiply(row_from_bottom)); // Add offset from bottom-left corner

        // Let's re-verify the Python formula's logic which seems simpler:
        // lon = last_lon + scale.lon_diff*((code-1)%scale.nums)
        // lat = last_lat + scale.lat_diff*floor((scale.nums**2-code)/scale.nums)
        // Test with 1:100K (nums=12) in 1:1M. Code=1 (top-left). Parent SW=(0,0). Expected=(0, 4-20')
        // lon = 0 + 30' * ((1-1)%12) = 0. Correct.
        // lat = 0 + 20' * floor((144-1)/12) = 0 + 20' * floor(143/12) = 0 + 20' * floor(11.91) = 0 + 20' * 11. Correct. (SW lat = parent_lat + 11 * height)
        // Test Code=12 (top-right). Expected=(6-30', 4-20')
        // lon = 0 + 30' * ((12-1)%12) = 0 + 30' * 11. Correct.
        // lat = 0 + 20' * floor((144-12)/12) = 0 + 20' * floor(132/12) = 0 + 20' * 11. Correct.
        // Test Code=133 (bottom-left). Expected=(0, 0)
        // lon = 0 + 30' * ((133-1)%12) = 0 + 30' * (132%12) = 0 + 30' * 0. Correct.
        // lat = 0 + 20' * floor((144-133)/12) = 0 + 20' * floor(11/12) = 0 + 20' * 0. Correct.
        // OK, the Python formula floor((scale.nums**2-code)/scale.nums) works.

        const lon_py = last_lon.add(scale.lon_diff.multiply((code - 1) % scale.nums));
        // Use Math.floor directly on numbers for the latitude part
        const num_rows = Math.round(this._getParentScale(scale).lat_diff.divideByAngle(scale.lat_diff));
        // The python nums**2 seems specific to 1M->100k (12x12) or 1M->250k(4x4)? Let's check.
        // 1M -> 500k (2x2), nums=2. code=1..4. nums**2=4. floor((4-code)/2). Ok.
        // 100k -> 50k (2x2), nums=2. code=A..D(1..4). nums**2=4. floor((4-code)/2). Ok.
        // 50k -> 25k (2x2), nums=2. code=1..4. nums**2=4. floor((4-code)/2). Ok.
        // 100k -> 10k (8x8), nums=8. code=1..64. nums**2=64. floor((64-code)/8). Ok.
        // 10k -> 5k (2x2), nums=2. code=a..d(1..4). nums**2=4. floor((4-code)/2). Ok.
        // It seems scale.nums**2 is correct for the number of sub-grids in the parent *for this numbering system*.

        const lat_offset_factor = Math.floor((Math.pow(scale.nums, 2) - code) / scale.nums);
        const lat_py = last_lat.add(scale.lat_diff.multiply(lat_offset_factor));

        return [lon_py, lat_py];
    }

    // Helper to find the immediate parent scale for calc_reverse logic if needed elsewhere
    _getParentScale(currentScale) {
        switch (currentScale) {
            case Scale.LEVEL_500K:
            case Scale.LEVEL_250K:
            case Scale.LEVEL_100K:
                return Scale.LEVEL_1M;
            case Scale.LEVEL_50K:
            case Scale.LEVEL_10K: // Parent for 10k is 100k in old system
                 return Scale.LEVEL_100K;
            case Scale.LEVEL_25K:
                return Scale.LEVEL_50K;
            case Scale.LEVEL_5K:
                return Scale.LEVEL_10K;
            default:
                // This case should ideally not be hit for old standard relevant scales
                return Scale.LEVEL_1M; // Fallback, maybe incorrect
        }
    }


    /**
     * Converts geographic coordinates to the Old Standard map number string.
     * @param {Angle|number} lon - Longitude (Angle object or decimal degrees).
     * @param {Angle|number} lat - Latitude (Angle object or decimal degrees).
     * @returns {string} The Old Standard map number.
     * @throws {Error} If the instance's scale is invalid for the old standard.
     */
    latlon_to_oldstandard(lon, lat) {
        // Ensure lon/lat are Angle objects
        if (!(lon instanceof Angle)) lon = Angle.fromDecimal(lon);
        if (!(lat instanceof Angle)) lat = Angle.fromDecimal(lat);

        const [H, L] = this.calc_1M(lon, lat);
        const H_code = String.fromCharCode(64 + H);

        switch (this.scale) {
            case Scale.LEVEL_1M:
                return `${H_code}-${L}`;
            case Scale.LEVEL_500K: {
                const a = this.calc_step(lon, lat, Scale.LEVEL_500K, Scale.LEVEL_1M);
                const a_code = String.fromCharCode(64 + a);
                return `${H_code}-${L}-${a_code}`;
            }
            case Scale.LEVEL_250K: {
                const a = this.calc_step(lon, lat, Scale.LEVEL_250K, Scale.LEVEL_1M);
                return `${H_code}-${L}-[${a}]`;
            }
            case Scale.LEVEL_100K: {
                const a = this.calc_step(lon, lat, Scale.LEVEL_100K, Scale.LEVEL_1M);
                return `${H_code}-${L}-${a}`;
            }
            case Scale.LEVEL_50K: {
                const a = this.calc_step(lon, lat, Scale.LEVEL_100K, Scale.LEVEL_1M);
                const b = this.calc_step(lon, lat, Scale.LEVEL_50K, Scale.LEVEL_100K);
                const b_code = String.fromCharCode(64 + b);
                return `${H_code}-${L}-${a}-${b_code}`;
            }
            case Scale.LEVEL_25K: {
                const a = this.calc_step(lon, lat, Scale.LEVEL_100K, Scale.LEVEL_1M);
                const b = this.calc_step(lon, lat, Scale.LEVEL_50K, Scale.LEVEL_100K);
                const b_code = String.fromCharCode(64 + b);
                const c = this.calc_step(lon, lat, Scale.LEVEL_25K, Scale.LEVEL_50K);
                return `${H_code}-${L}-${a}-${b_code}-${c}`;
            }
            case Scale.LEVEL_10K: {
                const a = this.calc_step(lon, lat, Scale.LEVEL_100K, Scale.LEVEL_1M);
                const b = this.calc_step(lon, lat, Scale.LEVEL_10K, Scale.LEVEL_100K);
                return `${H_code}-${L}-${a}-(${b})`;
            }
            case Scale.LEVEL_5K: {
                const a = this.calc_step(lon, lat, Scale.LEVEL_100K, Scale.LEVEL_1M);
                const b = this.calc_step(lon, lat, Scale.LEVEL_10K, Scale.LEVEL_100K);
                const c = this.calc_step(lon, lat, Scale.LEVEL_5K, Scale.LEVEL_10K);
                const c_code = String.fromCharCode(96 + c); // Lowercase 'a' starts at 97
                return `${H_code}-${L}-${a}-(${b})-${c_code}`;
            }
            default:
                throw new Error(`Invalid scale for old standard: ${this.scale.code}`);
        }
    }

    /**
     * Converts an Old Standard map number string to its geographic bounds.
     * @param {string} code - The Old Standard map number string.
     * @returns {Array<Array<Angle>>} [[sw_lon, sw_lat], [ne_lon, ne_lat]]
     * @throws {Error} If the instance's scale doesn't match the code format or is invalid.
     */
    oldstandard_to_latlon(code) {
        const parts = code.split('-');
        if (!parts || parts.length < 2) throw new Error(`Invalid old standard code format: ${code}`);

        const H_code = parts[0];
        const L_str = parts[1];
        const H = H_code.charCodeAt(0) - 64;
        const L = parseInt(L_str);
        if (isNaN(H) || H <= 0 || isNaN(L)) throw new Error(`Invalid 1M part in code: ${code}`);

        let sw_lon, sw_lat, current_scale;

        const [base_lon, base_lat] = this.calc_1M_reverse(H, L);

        switch (this.scale) {
            case Scale.LEVEL_1M:
                if (parts.length !== 2) throw new Error(`Code format mismatch for 1:1M scale: ${code}`);
                sw_lon = base_lon;
                sw_lat = base_lat;
                current_scale = Scale.LEVEL_1M;
                break;
            case Scale.LEVEL_500K: {
                 if (parts.length !== 3) throw new Error(`Code format mismatch for 1:500K scale: ${code}`);
                 const a_code = parts[2];
                 const a = a_code.charCodeAt(0) - 64;
                 if (isNaN(a) || a < 1 || a > 4) throw new Error(`Invalid 500K part in code: ${code}`);
                 [sw_lon, sw_lat] = this.calc_reverse(base_lon, base_lat, Scale.LEVEL_500K, a);
                 current_scale = Scale.LEVEL_500K;
                 break;
            }
            case Scale.LEVEL_250K: {
                if (parts.length !== 3 || !parts[2].startsWith('[') || !parts[2].endsWith(']')) throw new Error(`Code format mismatch for 1:250K scale: ${code}`);
                const a = parseInt(parts[2].substring(1, parts[2].length - 1));
                 if (isNaN(a) || a < 1 || a > 16) throw new Error(`Invalid 250K part in code: ${code}`);
                [sw_lon, sw_lat] = this.calc_reverse(base_lon, base_lat, Scale.LEVEL_250K, a);
                current_scale = Scale.LEVEL_250K;
                break;
            }
            case Scale.LEVEL_100K: {
                if (parts.length !== 3) throw new Error(`Code format mismatch for 1:100K scale: ${code}`);
                const a = parseInt(parts[2]);
                if (isNaN(a) || a < 1 || a > 144) throw new Error(`Invalid 100K part in code: ${code}`);
                [sw_lon, sw_lat] = this.calc_reverse(base_lon, base_lat, Scale.LEVEL_100K, a);
                current_scale = Scale.LEVEL_100K;
                break;
            }
             case Scale.LEVEL_50K: {
                if (parts.length !== 4) throw new Error(`Code format mismatch for 1:50K scale: ${code}`);
                const a = parseInt(parts[2]);
                const b_code = parts[3];
                const b = b_code.charCodeAt(0) - 64;
                 if (isNaN(a) || a < 1 || a > 144 || isNaN(b) || b < 1 || b > 4) throw new Error(`Invalid 50K part in code: ${code}`);
                const [lon_a, lat_a] = this.calc_reverse(base_lon, base_lat, Scale.LEVEL_100K, a);
                [sw_lon, sw_lat] = this.calc_reverse(lon_a, lat_a, Scale.LEVEL_50K, b);
                current_scale = Scale.LEVEL_50K;
                break;
            }
            case Scale.LEVEL_25K: {
                if (parts.length !== 5) throw new Error(`Code format mismatch for 1:25K scale: ${code}`);
                const a = parseInt(parts[2]);
                const b_code = parts[3];
                const b = b_code.charCodeAt(0) - 64;
                const c = parseInt(parts[4]);
                 if (isNaN(a) || a < 1 || a > 144 || isNaN(b) || b < 1 || b > 4 || isNaN(c) || c < 1 || c > 4) throw new Error(`Invalid 25K part in code: ${code}`);
                const [lon_a, lat_a] = this.calc_reverse(base_lon, base_lat, Scale.LEVEL_100K, a);
                const [lon_b, lat_b] = this.calc_reverse(lon_a, lat_a, Scale.LEVEL_50K, b);
                [sw_lon, sw_lat] = this.calc_reverse(lon_b, lat_b, Scale.LEVEL_25K, c);
                current_scale = Scale.LEVEL_25K;
                break;
            }
             case Scale.LEVEL_10K: {
                if (parts.length !== 4 || !parts[3].startsWith('(') || !parts[3].endsWith(')')) throw new Error(`Code format mismatch for 1:10K scale: ${code}`);
                const a = parseInt(parts[2]);
                const b = parseInt(parts[3].substring(1, parts[3].length - 1));
                 if (isNaN(a) || a < 1 || a > 144 || isNaN(b) || b < 1 || b > 64) throw new Error(`Invalid 10K part in code: ${code}`);
                const [lon_a, lat_a] = this.calc_reverse(base_lon, base_lat, Scale.LEVEL_100K, a);
                [sw_lon, sw_lat] = this.calc_reverse(lon_a, lat_a, Scale.LEVEL_10K, b);
                current_scale = Scale.LEVEL_10K;
                break;
            }
            case Scale.LEVEL_5K: {
                 if (parts.length !== 5 || !parts[3].startsWith('(') || !parts[3].endsWith(')')) throw new Error(`Code format mismatch for 1:5K scale: ${code}`);
                const a = parseInt(parts[2]);
                const b = parseInt(parts[3].substring(1, parts[3].length - 1));
                const c_code = parts[4];
                const c = c_code.charCodeAt(0) - 96; // Lowercase 'a' is 97
                if (isNaN(a) || a < 1 || a > 144 || isNaN(b) || b < 1 || b > 64 || isNaN(c) || c < 1 || c > 4) throw new Error(`Invalid 5K part in code: ${code}`);
                const [lon_a, lat_a] = this.calc_reverse(base_lon, base_lat, Scale.LEVEL_100K, a);
                const [lon_b, lat_b] = this.calc_reverse(lon_a, lat_a, Scale.LEVEL_10K, b);
                [sw_lon, sw_lat] = this.calc_reverse(lon_b, lat_b, Scale.LEVEL_5K, c);
                current_scale = Scale.LEVEL_5K;
                break;
            }
            default:
                throw new Error(`Invalid scale for old standard reverse calculation: ${this.scale.code}`);
        }

        const ne_lon = sw_lon.add(current_scale.lon_diff);
        const ne_lat = sw_lat.add(current_scale.lat_diff);

        return [[sw_lon, sw_lat], [ne_lon, ne_lat]];
    }
}