const earth_radius_in_meters = 6378136.6;
const { PI, sqrt, abs, sign, min, max } = Math;
const radian = PI / 180;
const sin = (angle) => Math.sin(angle * radian);
const cos = (angle) => Math.cos(angle * radian);
const tan = (angle) => Math.tan(angle * radian);
const asin = (x) => Math.asin(x) / radian;
const acos = (x) => Math.acos(x) / radian;
const atan2 = (y, x) => Math.atan2(y, x) / radian;
const scale = (s, { x, y, z }) => ({ x: s * x, y: s * y, z: s * z });
const add = ({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }) => ({ x: x1 + x2, y: y1 + y2, z: z1 + z2 });
const sub = ({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }) => ({ x: x1 - x2, y: y1 - y2, z: z1 - z2 });
const dot = ({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }) => x1 * x2 + y1 * y2 + z1 * z2;
const cross = ({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }) => ({
    x: y1 * z2 - z1 * y2,
    y: z1 * x2 - x1 * z2,
    z: x1 * y2 - y1 * x2,
});
const to_cartesian = ({ lat, lon }) => ({
    x: cos(lat) * cos(lon),
    y: cos(lat) * sin(lon),
    z: sin(lat)
});
const to_geographical = ({ x, y, z }) => ({
    lat: atan2(z, sqrt(x * x + y * y)),
    lon: atan2(y, x)
});
const crooked_hat_center = (d) => to_geographical(d.map(to_cartesian).reduce(add, { x: 0, y: 0, z: 0 }));

export {
    earth_radius_in_meters,
    PI, radian,
    sqrt, abs, sign, min, max,
    sin, cos, tan,
    asin, acos, atan2,
    scale, add, sub,
    dot,
    cross,
    to_cartesian, to_geographical,
    crooked_hat_center,
};
