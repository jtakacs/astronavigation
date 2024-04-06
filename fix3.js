const { PI, sqrt } = Math;
const radian = PI / 180;
const sin = (angle) => Math.sin(angle * radian);
const cos = (angle) => Math.cos(angle * radian);
const atan2 = (y, x) => Math.atan2(y, x) / radian;
const scaleVector = (s, { x, y, z }) => ({ x: s * x, y: s * y, z: s * z });
const crossProduct = ({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }) => ({
    x: y1 * z2 - z1 * y2,
    y: z1 * x2 - x1 * z2,
    z: x1 * y2 - y1 * x2
});
const toGeographical = ({ x, y, z }) => ({
    lat: atan2(z, sqrt(x * x + y * y)),
    lon: atan2(y, x)
});
const toCartesian = ({ lat, lon }) => ({
    x: cos(lat) * cos(lon),
    y: cos(lat) * sin(lon),
    z: sin(lat)
});

function three_star_fix(star1, star2, star3) {
    /* star = { lat: decimal_degree, lon: decimal_degree, angle: decimal_degree } */
    const gp1 = toCartesian(star1);
    const gp2 = toCartesian(star2);
    const gp3 = toCartesian(star3);
    const A = sin(star1.angle);
    const B = sin(star2.angle);
    const C = sin(star3.angle);
    const n1 = {
        x: B * gp1.x - A * gp2.x,
        y: B * gp1.y - A * gp2.y,
        z: B * gp1.z - A * gp2.z,
    };
    const n2 = {
        x: C * gp2.x - B * gp3.x,
        y: C * gp2.y - B * gp3.y,
        z: C * gp2.z - B * gp3.z,
    };
    const fix1 = crossProduct(n1, n2);
    const fix2 = scaleVector(-1, fix1);
    return [
        toGeographical(fix1),
        toGeographical(fix2),
    ];
}

export { three_star_fix };
