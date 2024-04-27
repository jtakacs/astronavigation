import * as vector from './vector.js';

function two_star_fix(star1, star2) {
    /* star = { lat: decimal_degree, lon: decimal_degree, angle: decimal_degree } */
    // González, A. (2008). Vector Solution for the Intersection of Two Circles of Equal Altitude. 
    // Journal of Navigation, 61(2), 355-365. doi:10.1017/S0373463307004602
    const GP1 = vector.to_cartesian(star1);
    const GP2 = vector.to_cartesian(star2);
    const sin_alt1 = vector.sin(star1.angle);
    const sin_alt2 = vector.sin(star2.angle);
    const cos_alpha = vector.dot(GP1, GP2);
    const k1 = sin_alt1 - sin_alt2 * cos_alpha;
    const k2 = sin_alt2 - sin_alt1 * cos_alpha;
    const center_point = vector.add(
        vector.scale(k1, GP1),
        vector.scale(k2, GP2),
    );
    const scale = vector.sqrt(1.0 - cos_alpha * cos_alpha - k1 * sin_alt1 - k2 * sin_alt2);
    if (Number.isFinite(scale)) {
        const displacement = vector.scale(scale, vector.cross(GP1, GP2));
        return [
            vector.to_geographical(vector.add(center_point, displacement)),
            vector.to_geographical(vector.sub(center_point, displacement)),
        ];
    } else vector.to_geographical(center_point);
}

export { two_star_fix };
