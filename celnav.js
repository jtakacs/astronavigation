const { PI, sqrt, sin, asin, cos, acos, tan, atan2, abs } = Math;
const earth_radius_in_meters = 6378136.6;
const fifteen_degree_per_hour_drift_thanks_Bob = 15.04106687606545037883;
const radian = PI / 180;
const dotProduct = ({ x, y, z }, { x: X, y: Y, z: Z }) => x * X + y * Y + z * Z;
const scaleVector = (s, { x, y, z }) => ({ x: s * x, y: s * y, z: s * z });
const addVector = ({ x, y, z }, { x: X, y: Y, z: Z }) => ({ x: x + X, y: y + Y, z: z + Z });
const subVector = ({ x, y, z }, { x: X, y: Y, z: Z }) => ({ x: x - X, y: y - Y, z: z - Z });
const crossProduct = ({ x, y, z }, { x: X, y: Y, z: Z }) => ({ x: y * Z - z * Y, y: z * X - x * Z, z: x * Y - y * X });
const toGeographical = ({ x, y, z }) => ({ lat: atan2(z, sqrt(x * x + y * y)) / radian, lon: atan2(y, x) / radian });
const toCartesian = ({ lat, lon }) => {
  const rlat = lat * radian;
  const rlon = lon * radian;
  const cos_rlat = cos(rlat);
  return {
    x: cos_rlat * cos(rlon),
    y: cos_rlat * sin(rlon),
    z: sin(rlat)
  };
};
const center = (d) => toGeographical(scaleVector(1 / d.length, d.map(toCartesian).reduce(addVector, { x: 0, y: 0, z: 0 })));
function Fix2CoP(star1, star2) {
  // González, A. (2008). Vector Solution for the Intersection of Two Circles of Equal Altitude. 
  // Journal of Navigation, 61(2), 355-365. doi:10.1017/S0373463307004602
  const GP1 = toCartesian(star1);
  const GP2 = toCartesian(star2);
  const cos_alpha = dotProduct(GP1, GP2);
  const sin_alpha_squared = 1.0 - cos_alpha * cos_alpha;
  const sin_alt1 = sin(star1.angle * radian) / sin_alpha_squared;
  const sin_alt2 = sin(star2.angle * radian) / sin_alpha_squared;
  const center_point = addVector(
    scaleVector(sin_alt1 - sin_alt2 * cos_alpha, GP1),
    scaleVector(sin_alt2 - sin_alt1 * cos_alpha, GP2),
  );
  const cross = crossProduct(GP1, GP2);
  const displacement = scaleVector(sqrt((1.0 - dotProduct(center_point, center_point)) / dotProduct(cross, cross)), cross);
  return [
    toGeographical(addVector(center_point, displacement)),
    toGeographical(subVector(center_point, displacement)),
  ];
}
function inverse_haversine(lat, lon, distance, direction) {
  const lat_r = lat * radian;
  const rdir = direction * radian;
  const ang_dist = distance / earth_radius_in_meters;
  const sin_d = sin(ang_dist);
  const sin_l = sin(lat_r);
  const sin_d_cos_l = sin_d * cos(lat_r);
  const rlat = asin(sin_l * cos(ang_dist) + sin_d_cos_l * cos(rdir));
  const rlon = atan2(sin_d_cos_l * sin(rdir), sin_d - sin_l * sin(rlat));
  return { lat: rlat / radian, lon: lon + rlon / radian };
}
function haversine(point1, point2) {
  const lat1 = point1.lat * radian;
  const lon1 = point1.lon * radian;
  const lat2 = point2.lat * radian;
  const lon2 = point2.lon * radian;
  const a = sin((lat2 - lat1) / 2);
  const b = sin((lon2 - lon1) / 2);
  const d = a * a + cos(lat1) * cos(lat2) * b * b;
  return 2 * earth_radius_in_meters * asin(sqrt(d));
}
function intersection_points(worksheet) {
  let points = [];
  for (let u = 0; u < worksheet.length - 1; u++) {
    for (let v = u + 1; v < worksheet.length; v++) {
      if (('landmark' != worksheet[u].type) && ('landmark' != worksheet[v].type)) {
        points = points.concat(Fix2CoP(worksheet[u], worksheet[v]));
      }
    }
  }
  return points;
}
function closest3(intersections, ws) {
  let points = [];
  const landmarks = ws.filter(w => 'landmark' == w.type);
  if (0 < landmarks.length) {
    for (let u = 0; u < intersections.length; u++) {
      landmarks.forEach(m => {
        const dist = haversine(intersections[u], m);
        if (dist <= m.distance) points.push({ u: u, v: u, d: dist });
      });
    }
  } else {
    for (let u = 0; u < intersections.length - 1; u++) {
      for (let v = u + 1; v < intersections.length; v++) {
        points.push({ u, v, d: haversine(intersections[u], intersections[v]) });
      }
    }
  }
  return points
    .sort((p, q) => p.d - q.d)
    .slice(0, 3)
    .reduce((a, p) => a.concat([p.u, p.v]), [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3)
    .map((u) => intersections[u]);
}
function dip_correction(observer_height_meter) {
  return acos(1.0 / (1.0 + observer_height_meter / (1.2 * earth_radius_in_meters))) / radian;
}
function refraction_factor(pressure_mbar, temperature_celsius) {
  return (pressure_mbar * 283.15 / (1010 * (273.15 + temperature_celsius)));
}
function refraction_correction(altitude, f = 1) {
  return f / (tan((altitude + 7.31 / (altitude + 4.4)) * radian) * 60);
}
function prepare(data, almanac, star_names, planet_names) {
  let max_gha = 0;
  let max_time = 0;
  let y = -9999;
  let m = 0;
  let d = 0;
  let page = null;
  const worksheet = [];
  const f = refraction_factor(data.pressure_mbar, data.temperature_celsius);
  for (let i = 0; i < data.stars.length; i++) {
    let form = {};
    const star = data.stars[i];
    form.name = star.name;
    form.type = 'Sun';
    form.limb = false;
    if (star_names.includes(star.name)) form.type = 'star';
    else if (planet_names.includes(star.name)) form.type = 'planet';
    else {
      let n = star.name.split(' ');
      if ('Moon' == n[0]) form.type = 'Moon';
      form.limb = n[1];
    }
    form.timezone = data.timezone;
    form.watch_time = almanac.utc_date(data.date, star.time, 0);
    const corrected_watch_time = { h: star.time.h, m: star.time.m, s: star.time.s + data.watch_error };
    const date = almanac.utc_date(data.date, corrected_watch_time, data.timezone);
    if (y != date.date.y || m != date.date.m || d != date.date.d) {
      y = date.date.y;
      m = date.date.m;
      d = date.date.d;
      page = almanac.almanac_page(y, m, d);
    }
    form.datetime_utc = date;
    form.sextant_altitude = star.alt;
    let apparent_altitude = star.alt;
    form.dip_correction = 0;
    if ('theodolite' == data.method) {
      apparent_altitude = 90 - star.alt;
    } else if ('bubble sextant' == data.method) {
      apparent_altitude = (star.alt + data.index_error) / 2;
    } else if ('sextant' == data.method) {
      form.dip_correction = dip_correction(data.observer_height_meter);
      apparent_altitude = star.alt + data.index_error - form.dip_correction;
    }
    form.refraction_factor = f;
    form.refraction_correction = refraction_correction(apparent_altitude, f);
    form.angle = apparent_altitude - form.refraction_correction;
    if ('planet' == form.type) {
      const daily_page = page.get(form.name);
      form.gha_integral = daily_page.get('GHA')[date.time.h];
      form.declination = daily_page.get('decl')[date.time.h];
      form.v_factor = daily_page.get('v');
      form.d_factor = daily_page.get('d');
      form.gha_increment = almanac.gha_increment(form.name, date.time.m, date.time.s);
      form.v_correction = almanac.vd_corr(date.time.m, form.v_factor);
      form.d_correction = almanac.vd_corr(date.time.m, form.d_factor);
      form.gha = form.gha_integral + form.gha_increment + form.v_correction / 60;
      form.lat = form.declination + form.d_correction / 60;
      form.lon = -form.gha;
      if ('Mars' == form.name || 'Venus' == form.name) {
        form.hp = daily_page.get('HP');
        form.parallax = form.hp * cos(form.angle * radian) / 60;
        form.angle += form.parallax;
      }
    } else if ('Sun' == form.type) {
      const daily_page = page.get('Sun');
      form.gha_integral = daily_page.get('GHA')[date.time.h];
      form.declination = daily_page.get('decl')[date.time.h];
      form.d_factor = daily_page.get('d');
      form.semidiameter = daily_page.get('SD');
      form.gha_increment = almanac.gha_increment('Sun', date.time.m, date.time.s);
      form.gha = form.gha_integral + form.gha_increment;
      form.lat = form.declination + form.d_correction / 60;
      form.lon = -form.gha;
      const sign = 'LL' == form.limb ? 1 : -1;
      form.angle += sign * form.semidiameter / 60;
      form.hp = daily_page.get('HP');
      form.parallax = form.hp * cos(form.angle * radian) / 60;
      form.angle += form.parallax;
    } else if ('Moon' == form.type) {
      const daily_page = page.get('Moon');
      form.gha_integral = daily_page.get('GHA')[date.time.h];
      form.declination = daily_page.get('decl')[date.time.h];
      form.v_factor = daily_page.get('v')[date.time.h];
      form.d_factor = daily_page.get('d')[date.time.h];
      form.hp = daily_page.get('HP')[date.time.h];
      form.semidiameter = daily_page.get('SD');
      form.gha_increment = almanac.gha_increment('Moon', date.time.m, date.time.s);
      form.v_correction = almanac.vd_corr(date.time.m, form.v_factor);
      form.d_correction = almanac.vd_corr(date.time.m, form.d_factor);
      form.gha = form.gha_integral + form.gha_increment + form.v_correction / 60;
      form.lat = form.declination + form.d_correction / 60;
      form.lon = -form.gha;
      const sign = 'LL' == form.limb ? 1 : -1;
      form.angle += sign * form.semidiameter / 60;
      form.parallax = form.hp * cos(form.angle * radian) / 60;
      form.angle += form.parallax;
    } else {
      form.aries_gha = page.get('aries').get(date.time.h);
      form.gha_increment = almanac.gha_increment('aries', date.time.m, date.time.s);
      const ra_dec = page.get('stars').get(star.name);
      form.star_sha = ra_dec.get('sha');
      form.declination = ra_dec.get('decl');
      form.gha = form.aries_gha + form.gha_increment + form.star_sha;
      form.lat = form.declination;
      form.lon = -form.gha;
      let t = Date.UTC(date.date.y, date.date.m, date.date.d, date.time.h, date.time.m, date.time.s);
      if (max_time < t) { max_time = t; max_gha = form.aries_gha + form.gha_increment; }
    }
    worksheet.push(form);
  }
  for (let i = 0; i < data.landmarks.length; i++) {
    let form = {};
    form.type = 'landmark';
    const landmark = data.landmarks[i];
    form.name = landmark.name;
    form.distance = landmark.distance;
    form.lat = landmark.lat;
    form.lon = landmark.lon;
    form.angle = 90 - landmark.distance / (earth_radius_in_meters * radian);
    worksheet.push(form);
  }
  return { max_gha, worksheet };
}
function celestial_fix(app_state) {
  const almanac = app_state.almanac;
  const star_names = almanac.stars();
  const planet_names = almanac.planets();
  const { max_gha, worksheet } = prepare(app_state.data, almanac, star_names, planet_names);
  const crooked_hat = closest3(intersection_points(worksheet), worksheet);
  const fix = center(crooked_hat);
  let distance_error = 2 * earth_radius_in_meters * PI;
  if (app_state.data.compare_location) {
    distance_error = haversine(app_state.data.actual_location, fix);
    fix.distance_error = distance_error;
  }
  fix.gha = max_gha;
  return { fix, worksheet, crooked_hat };
}

export {
  radian,
  earth_radius_in_meters,
  fifteen_degree_per_hour_drift_thanks_Bob,
  celestial_fix,
  haversine,
  inverse_haversine,
  toCartesian,
  toGeographical,
  scaleVector,
};
