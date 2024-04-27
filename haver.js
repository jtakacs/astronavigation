import * as vector from './vector.js';

function inverse_haversine(lat, lon, distance, direction) {
    const ang_dist = distance / vector.earth_radius_in_meters;
    const sin_d = Math.sin(ang_dist);
    const cos_d = Math.cos(ang_dist);
    const sin_l = vector.sin(lat);
    const sin_d_cos_l = sin_d * vector.cos(lat);
    const rlat = vector.asin(sin_l * cos_d + sin_d_cos_l * vector.cos(direction));
    const rlon = vector.atan2(sin_d_cos_l * vector.sin(direction), cos_d - sin_l * vector.sin(rlat));
    return { lat: rlat, lon: lon + rlon };
}

function haversine(point1, point2) {
    const a = vector.sin((point2.lat - point1.lat) / 2);
    const b = vector.sin((point2.lon - point1.lon) / 2);
    const c = vector.cos(point1.lat) * vector.cos(point2.lat);
    const d = a * a + c * b * b;
    return 2 * vector.earth_radius_in_meters * Math.atan2(vector.sqrt(d), vector.sqrt(1 - d));
}

function forward_azimuth(point1, point2) {
    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = vector.cos(point1.lat) * vector.sin(point2.lat) - vector.sin(point1.lat) * vector.cos(point2.lat) * vector.cos(point2.lon - point1.lon);
    return (vector.atan2(y, x) + 360) % 360;
}

function reverse_azimuth(point1, point2) {
    const d = forward_azimuth(point2, point1);
    return (d + 180) % 360;
}

export {
    haversine,
    inverse_haversine,
    forward_azimuth,
    reverse_azimuth,
};
