import * as vector from './vector.js';

function three_star_fix(star1, star2, star3) {
    /* star = { lat: decimal_degree, lon: decimal_degree, angle: decimal_degree } */
    const gp1 = vector.to_cartesian(star1);
    const gp2 = vector.to_cartesian(star2);
    const gp3 = vector.to_cartesian(star3);
    const A = vector.sin(star1.angle);
    const B = vector.sin(star2.angle);
    const C = vector.sin(star3.angle);
    const fix = vector.cross(
        vector.sub(vector.scale(B, gp1), vector.scale(A, gp2)),
        vector.sub(vector.scale(C, gp2), vector.scale(B, gp3))
    );
    const s = vector.dot(fix, vector.add(gp1, vector.add(gp2, gp3)));
    return vector.to_geographical(vector.scale(vector.sign(s), fix));
}

export { three_star_fix };
