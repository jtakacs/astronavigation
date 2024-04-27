import * as vector from './vector.js';
import { inverse_haversine } from './haver.js';

function move_and_change_altitude(data, worksheet) {
    const times = worksheet.map(form => form.timestamp).sort();
    const end_time = times[times.length - 1];
    for (let i = 0; i < worksheet.length; i++) {
        const form = worksheet[i];
        const delta_t_seconds = (end_time - form.timestamp) / 1000;
        const delta_Ho = data.speed_knots * delta_t_seconds * vector.cos((form.Zn - data.heading)) / 3600;
        form.original = {
            angle: form.angle,
            lat: form.lat,
            lon: form.lon,
        };
        form.angle += delta_Ho;
    }
}

function move_and_change_GP(data, worksheet) {
    const times = worksheet.map(form => form.timestamp).sort();
    const start_time = times[0];
    const end_time = times[times.length - 1];
    const delta_t_seconds = (end_time - start_time) / 1000;
    const distance = data.speed_knots * 0.5144444444 * delta_t_seconds;
    const p = inverse_haversine(data.dr.lat, data.dr.lon, distance, data.heading);
    for (let i = 0; i < worksheet.length; i++) {
        const form = worksheet[i];
        const sign = (180 <= form.Zn && form.Zn <= 360) ? 1 : -1;
        const sinlat = vector.sin(p.lat);
        const coslat = vector.cos(p.lat);
        const sinHc = vector.sin(form.Hc);
        const sind = sinlat * sinHc + coslat * vector.cos(form.Hc) * vector.cos(form.Zn);
        const cosd = vector.sqrt(1 - sind * sind);
        const x = vector.atan2(sind, cosd);
        const GHA = - p.lon + sign * vector.acos((sinHc - sinlat * sind) / (coslat * cosd));
        const DECL = x < 0 ? 360 + x : x;
        form.original = {
            angle: form.angle,
            lat: form.lat,
            lon: form.lon,
        };
        form.lat = DECL;
        form.lon = -GHA;
    }
}

export {
    move_and_change_altitude,
    move_and_change_GP,
};
