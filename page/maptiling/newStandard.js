import { Angle } from './angle.js';
import { Scale, ScaleUtil } from './scale.js';

/**
 * Handles calculations for the National Standard Topographic Map New Numbering System.
 */
export class NewStandard {
    scale;

    /**
     * Creates an instance, optionally for a specific scale (required for latlon_to_newstandard).
     * @param {object | null} [scale=null] - A scale definition object from Scale (e.g., Scale.LEVEL_100K).
     */
    constructor(scale = null) {
        this.scale = scale;
    }

    /**
     * Converts geographic coordinates to the New Standard map number string.
     * Requires the scale to be set in the constructor.
     * @param {Angle|number} lon - Longitude (Angle object or decimal degrees).
     * @param {Angle|number} lat - Latitude (Angle object or decimal degrees).
     * @returns {string} The New Standard map number.
     * @throws {Error} If the scale was not set during construction.
     */
    latlon_to_newstandard(lon, lat) {
        if (!this.scale) {
            throw new Error("Scale must be set for latlon_to_newstandard");
        }
         // Ensure lon/lat are Angle objects
        if (!(lon instanceof Angle)) lon = Angle.fromDecimal(lon);
        if (!(lat instanceof Angle)) lat = Angle.fromDecimal(lat);

        const M1_LAT_DIFF = Scale.LEVEL_1M.lat_diff;
        const M1_LON_DIFF = Scale.LEVEL_1M.lon_diff;

        // Row Letter (A-V)
        const a = Math.floor(lat.divideByAngle(M1_LAT_DIFF)) + 1;
        const a_char = String.fromCharCode(a + 64); // 65='A'

        // Column Number (based on 6 deg zones, starting 31 at 0 deg E)
        const b = Math.floor(lon.divideByAngle(M1_LON_DIFF)) + 31;

        // If scale is 1M, we are done
        if (this.scale === Scale.LEVEL_1M) {
             return `${a_char}${b.toString().padStart(2, '0')}`;
        }

        // Row index within 1M sheet (c)
        // Decreases from North (top) to South (bottom)
        const lat_rem_dec = lat.modulo(M1_LAT_DIFF).toDecimal();
        const scale_lat_dec = this.scale.lat_diff.toDecimal();
        const M1_lat_dec = M1_LAT_DIFF.toDecimal();
        // Handle edge case: lat exactly on northern boundary should belong to the sheet below
        let safe_lat_rem_dec = lat_rem_dec;
        if (Math.abs(lat_rem_dec - M1_lat_dec) < Angle.epsilon) {
            safe_lat_rem_dec = 0;
        }
        const rows_in_1M = Math.round(M1_LAT_DIFF.divideByAngle(this.scale.lat_diff));
        const row_index_from_bottom = Math.floor(safe_lat_rem_dec / scale_lat_dec);
        const c = rows_in_1M - row_index_from_bottom;


        // Column index within 1M sheet (d)
        // Increases from West (left) to East (right), 1-based
        const lon_rem_dec = lon.modulo(M1_LON_DIFF).toDecimal();
        const scale_lon_dec = this.scale.lon_diff.toDecimal();
        const M1_lon_dec = M1_LON_DIFF.toDecimal();
         // Handle edge case: lon exactly on eastern boundary should belong to the sheet to the left
        let safe_lon_rem_dec = lon_rem_dec;
         if (Math.abs(lon_rem_dec - M1_lon_dec) < Angle.epsilon) {
            safe_lon_rem_dec = M1_lon_dec - Angle.epsilon; // Move slightly left
         }
        // Original python logic: floor((lon%M1_LON_DIFF)/scale.lon_diff) + 1
        const d = Math.floor(safe_lon_rem_dec / scale_lon_dec) + 1;

        // Format based on scale
        const needs_4_digits = [Scale.LEVEL_1K, Scale.LEVEL_500, Scale.LEVEL_2K, Scale.LEVEL_1K, Scale.LEVEL_500].includes(this.scale);
        const c_str = String(c).padStart(needs_4_digits ? 4 : 3, '0');
        const d_str = String(d).padStart(needs_4_digits ? 4 : 3, '0');

        return `${a_char}${String(b).padStart(2, '0')}${this.scale.code}${c_str}${d_str}`;
    }

    /**
     * Converts a New Standard map number string to its geographic bounds.
     * Scale is determined from the code itself.
     * @param {string} new_standard_number - The New Standard map number string.
     * @returns {Array<Array<Angle>>} [[sw_lon, sw_lat], [ne_lon, ne_lat]]
     * @throws {Error} If the code format is invalid.
     */
    newstandard_to_latlon(new_standard_number) {
        if (!new_standard_number || new_standard_number.length < 3) {
            throw new Error(`Invalid new standard code format: ${new_standard_number}`);
        }

        const a_char = new_standard_number[0];
        const b_str = new_standard_number.substring(1, 3);
        const a = a_char.charCodeAt(0) - 64; // 65='A'
        const b = parseInt(b_str);

         if (isNaN(a) || a < 1 || a > 22 || isNaN(b) || b < 31) { // Check basic 1M part
            throw new Error(`Invalid 1M part in new standard code: ${new_standard_number}`);
        }

         // Handle 1M case
        if (new_standard_number.length === 3) {
            const scale = Scale.LEVEL_1M;
            const base_lon = scale.lon_diff.multiply(b - 31);
            const base_lat = scale.lat_diff.multiply(a - 1);
            const ne_lon = base_lon.add(scale.lon_diff);
            const ne_lat = base_lat.add(scale.lat_diff);
             return [[base_lon, base_lat], [ne_lon, ne_lat]];
        }

        // Handle other scales
        if (new_standard_number.length < 10) { // A00 B 000 000 -> 1 + 2 + 1 + 3 + 3 = 10 minimum for non-1M
             throw new Error(`Invalid new standard code length: ${new_standard_number}`);
        }

        const scale_code = new_standard_number[3];
        let scale;
        try {
             scale = ScaleUtil.fromCode(scale_code);
        } catch (e) {
             throw new Error(`Invalid scale code '${scale_code}' in new standard number: ${new_standard_number}`);
        }

        // Determine padding based on identified scale
        const needs_4_digits = [Scale.LEVEL_2K, Scale.LEVEL_1K, Scale.LEVEL_500].includes(scale);
        const c_len = needs_4_digits ? 4 : 3;
        const d_len = needs_4_digits ? 4 : 3;
        const expected_len = 1 + 2 + 1 + c_len + d_len; // A00 + B + ccc + ddd

        if (new_standard_number.length !== expected_len) {
            throw new Error(`Code length mismatch for scale ${scale.code}. Expected ${expected_len}, got ${new_standard_number.length}`);
        }

        const c_str = new_standard_number.substring(4, 4 + c_len);
        const d_str = new_standard_number.substring(4 + c_len, 4 + c_len + d_len);
        const c = parseInt(c_str);
        const d = parseInt(d_str);

        if (isNaN(c) || isNaN(d) || c < 1 || d < 1) {
             throw new Error(`Invalid c/d part in new standard code: ${new_standard_number}`);
        }

        const M1_LAT_DIFF = Scale.LEVEL_1M.lat_diff;
        const M1_LON_DIFF = Scale.LEVEL_1M.lon_diff;

        // Calculate SW corner
        const base_lon_1M = M1_LON_DIFF.multiply(b - 31);
        const base_lat_1M = M1_LAT_DIFF.multiply(a - 1);

        const lon_offset = scale.lon_diff.multiply(d - 1);

        const rows_in_1M = Math.round(M1_LAT_DIFF.divideByAngle(scale.lat_diff));
        const row_index_from_bottom = rows_in_1M - c;
        const lat_offset = scale.lat_diff.multiply(row_index_from_bottom);


        const sw_lon = base_lon_1M.add(lon_offset);
        const sw_lat = base_lat_1M.add(lat_offset);

        // Calculate NE corner
        const ne_lon = sw_lon.add(scale.lon_diff);
        const ne_lat = sw_lat.add(scale.lat_diff);

        return [[sw_lon, sw_lat], [ne_lon, ne_lat]];
    }
}