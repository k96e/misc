/**
 * Represents an angle in Degrees, Minutes, Seconds (DMS).
 */
export class Angle {
    degrees;
    minutes;
    seconds;
    // Small epsilon for floating point comparisons
    static epsilon = 1e-10;

    /**
     * Creates an Angle instance.
     * @param {number} [d=0] - Degrees.
     * @param {number} [m=0] - Minutes.
     * @param {number} [s=0] - Seconds.
     */
    constructor(d = 0, m = 0, s = 0) {
        this.degrees = d;
        this.minutes = m;
        this.seconds = s;
        this._normalize();
    }

    /**
     * Creates an Angle instance from decimal degrees.
     * @param {number} decimalDegrees - The angle in decimal degrees.
     * @returns {Angle} A new Angle instance.
     */
    static fromDecimal(decimalDegrees) {
        const degrees = Math.trunc(decimalDegrees);
        const decimalMinutes = (decimalDegrees - degrees) * 60;
        const minutes = Math.trunc(decimalMinutes);
        const seconds = (decimalMinutes - minutes) * 60;
        // Use a small tolerance when checking if seconds are effectively 60
        if (Math.abs(seconds - 60) < Angle.epsilon) {
             return new Angle(degrees, minutes + 1, 0);
        }
        return new Angle(degrees, minutes, seconds);
    }

    /**
     * Normalizes the angle components (handles carry-overs).
     * @private
     */
    _normalize() {
        // Handle seconds rounding up to 60 due to precision
        if (Math.abs(this.seconds - 60) < Angle.epsilon) {
            this.seconds = 0;
            this.minutes += 1;
        } else if (this.seconds >= 60) {
            this.minutes += Math.floor(this.seconds / 60);
            this.seconds %= 60;
        } else if (this.seconds < 0) {
             // Handle negative seconds if necessary, though usually avoided by fromDecimal logic
             const borrowMins = Math.ceil(Math.abs(this.seconds) / 60);
             this.minutes -= borrowMins;
             this.seconds += borrowMins * 60;
        }


        // Handle minutes rounding up to 60
        if (Math.abs(this.minutes - 60) < Angle.epsilon) {
             this.minutes = 0;
             this.degrees += 1;
        } else if (this.minutes >= 60) {
            this.degrees += Math.floor(this.minutes / 60);
            this.minutes %= 60;
        } else if (this.minutes < 0) {
            // Handle negative minutes
            const borrowDegs = Math.ceil(Math.abs(this.minutes) / 60);
            this.degrees -= borrowDegs;
            this.minutes += borrowDegs * 60;
        }

        // Ensure degrees are within [0, 360) for simplicity in some contexts,
        // though longitude might exceed this temporarily in calculations.
        // Let's skip degree normalization for now to match python's behavior
        // which implicitly allows degrees > 360 or < 0 during calculations.
        // this.degrees = ((this.degrees % 360) + 360) % 360; // Optional: Normalize degrees [0, 360)

        // Ensure integer minutes and degrees after calculations
        this.minutes = Math.trunc(this.minutes);
        this.degrees = Math.trunc(this.degrees);

         // Final check for seconds precision potentially causing issues
        if (Math.abs(this.seconds) < Angle.epsilon) {
            this.seconds = 0;
        }
    }

    /**
     * Converts the angle to decimal degrees.
     * @returns {number} The angle in decimal degrees.
     */
    toDecimal() {
        return this.degrees + this.minutes / 60 + this.seconds / 3600;
    }

    /**
     * Adds another angle or a decimal value to this angle.
     * @param {Angle|number} other - The angle or decimal degrees to add.
     * @returns {Angle} A new Angle instance representing the sum.
     */
    add(other) {
        const otherDecimal = (other instanceof Angle) ? other.toDecimal() : other;
        return Angle.fromDecimal(this.toDecimal() + otherDecimal);
    }

    /**
     * Calculates the modulo of this angle with respect to another angle or decimal value.
     * @param {Angle|number} other - The divisor angle or decimal degrees.
     * @returns {Angle} A new Angle instance representing the remainder.
     */
    modulo(other) {
        const otherDecimal = (other instanceof Angle) ? other.toDecimal() : other;
        if (otherDecimal === 0) throw new Error("Modulo by zero");
        return Angle.fromDecimal(this.toDecimal() % otherDecimal);
    }

    /**
     * Multiplies this angle by a scalar number.
     * @param {number} scalar - The number to multiply by.
     * @returns {Angle} A new Angle instance representing the product.
     */
    multiply(scalar) {
        return Angle.fromDecimal(this.toDecimal() * scalar);
    }

    /**
     * Divides this angle by a scalar number.
     * @param {number} scalar - The number to divide by.
     * @returns {Angle} A new Angle instance representing the quotient.
     */
    divide(scalar) {
        if (scalar === 0) throw new Error("Division by zero");
        return Angle.fromDecimal(this.toDecimal() / scalar);
    }

    /**
     * Divides this angle by another angle (returns a scalar ratio).
     * @param {Angle} other - The divisor angle.
     * @returns {number} The ratio of the two angles in decimal degrees.
     */
    divideByAngle(other) {
        if (other.toDecimal() === 0) throw new Error("Division by zero angle");
        return this.toDecimal() / other.toDecimal();
    }


    /**
     * Returns a string representation of the angle.
     * @returns {string} Formatted string (e.g., "120° 30' 15.000\"").
     */
    toString() {
        // Handle potential negative zero formatting
        const secStr = (Math.abs(this.seconds) < Angle.epsilon && this.seconds < 0)
                       ? "0.000"
                       : this.seconds.toFixed(3);
        return `${this.degrees}° ${this.minutes}' ${secStr}"`;
    }

    /**
     * Returns a more detailed string representation for debugging.
     * @returns {string}
     */
    repr() {
        return `Angle(${this.degrees}° ${this.minutes}' ${this.seconds.toFixed(3)}")`;
    }
}