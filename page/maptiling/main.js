import { Angle } from './angle.js';
import { Scale, ScaleUtil } from './scale.js';
import { OldStandard } from './oldStandard.js';
import { NewStandard } from './newStandard.js';

// --- Angle Example ---
const angle1 = new Angle(116, 30, 0);
const angle2 = Angle.fromDecimal(40.5);
console.log("Angle 1:", angle1.toString(), "Decimal:", angle1.toDecimal());
console.log("Angle 2:", angle2.toString(), "Decimal:", angle2.toDecimal());
console.log("Sum:", angle1.add(angle2).toString());
console.log("--------------------");


// --- Old Standard Example ---
// Coordinates for Beijing (approx)
const lonBeijing = new Angle(116, 28, 15); // 116.4 E
const latBeijing = new Angle(39, 54, 30);  // 39.9 N

console.log("Old Standard Calculations:");

try {
    const old100kConverter = new OldStandard(Scale.LEVEL_100K);
    const oldMapNumber100k = old100kConverter.latlon_to_oldstandard(lonBeijing, latBeijing);
    console.log(`Beijing (Lon: ${lonBeijing}, Lat: ${latBeijing})`);
    console.log(`Old 1:100k Map Number: ${oldMapNumber100k}`); // Expected like J-50-??

    const [[sw_lon, sw_lat], [ne_lon, ne_lat]] = old100kConverter.oldstandard_to_latlon(oldMapNumber100k);
    console.log(`Bounds for ${oldMapNumber100k}:`);
    console.log(` SW: ${sw_lon}, ${sw_lat}`);
    console.log(` NE: ${ne_lon}, ${ne_lat}`);

    // Test another scale
    const old50kConverter = new OldStandard(Scale.LEVEL_50K);
    const oldMapNumber50k = old50kConverter.latlon_to_oldstandard(lonBeijing, latBeijing);
    console.log(`Old 1:50k Map Number: ${oldMapNumber50k}`); // Expected like J-50-??-?
    const bounds50k = old50kConverter.oldstandard_to_latlon(oldMapNumber50k);
    console.log(`Bounds for ${oldMapNumber50k}: SW: ${bounds50k[0][0]}, ${bounds50k[0][1]}`);

} catch (error) {
    console.error("Old Standard Error:", error.message);
}
console.log("--------------------");

// --- New Standard Example ---
console.log("New Standard Calculations:");

try {
    const new100kConverter = new NewStandard(Scale.LEVEL_100K);
    const newMapNumber100k = new100kConverter.latlon_to_newstandard(lonBeijing, latBeijing);
    console.log(`Beijing (Lon: ${lonBeijing}, Lat: ${latBeijing})`);
    console.log(`New 1:100k Map Number: ${newMapNumber100k}`); // Expected like J50D??????

    // Reverse calculation (scale is determined from the number itself)
    const newConverterReverse = new NewStandard(); // No scale needed for reverse
    const [[sw_lon_new, sw_lat_new], [ne_lon_new, ne_lat_new]] = newConverterReverse.newstandard_to_latlon(newMapNumber100k);
    console.log(`Bounds for ${newMapNumber100k}:`);
    console.log(` SW: ${sw_lon_new}, ${sw_lat_new}`);
    console.log(` NE: ${ne_lon_new}, ${ne_lat_new}`);

    // Test another scale
    const new50kConverter = new NewStandard(Scale.LEVEL_50K);
    const newMapNumber50k = new50kConverter.latlon_to_newstandard(lonBeijing, latBeijing);
    console.log(`New 1:50k Map Number: ${newMapNumber50k}`); // Expected like J50E??????
    const boundsNew50k = newConverterReverse.newstandard_to_latlon(newMapNumber50k);
     console.log(`Bounds for ${newMapNumber50k}: SW: ${boundsNew50k[0][0]}, ${boundsNew50k[0][1]}`);

    // Test 1M reverse
     const bounds1M = newConverterReverse.newstandard_to_latlon("J50");
     console.log(`Bounds for J50: SW: ${bounds1M[0][0]}, ${bounds1M[0][1]}`);


} catch (error) {
    console.error("New Standard Error:", error.message);
}
console.log("--------------------");