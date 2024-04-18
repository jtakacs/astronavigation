const { PI, sqrt, sign } = Math;
const radian = PI / 180;
const sin = (angle) => Math.sin(angle * radian);
const cos = (angle) => Math.cos(angle * radian);
const atan2 = (y, x) => Math.atan2(y, x) / radian;
const scaleVector = (s, { x, y, z }) => ({ x: s * x, y: s * y, z: s * z });
const addVector = ({ x, y, z }, { x: X, y: Y, z: Z }) => ({ x: x + X, y: y + Y, z: z + Z });
const subVector = ({ x, y, z }, { x: X, y: Y, z: Z }) => ({ x: x - X, y: y - Y, z: z - Z });
const dotProduct = ({ x, y, z }, { x: X, y: Y, z: Z }) => x * X + y * Y + z * Z;
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
    const n1 = subVector(scaleVector(B, gp1), scaleVector(A, gp2));
    const n2 = subVector(scaleVector(C, gp2), scaleVector(B, gp3));
    const fix = crossProduct(n1, n2);
    const s = dotProduct(fix, addVector(gp1, addVector(gp2, gp3)));
    return toGeographical(scaleVector(sign(s), fix));
}

export { three_star_fix };
