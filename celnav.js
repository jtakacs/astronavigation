import * as vector from './vector.js';
import { haversine } from './haver.js';
import { two_star_fix } from './fix2.js';
import { three_star_fix } from './fix3.js';

const crooked_hat_center = (d) => vector.to_geographical(d.map(vector.to_cartesian).reduce(vector.add, { x: 0, y: 0, z: 0 }));
const MOON = 'Moon';

function intersection_points(worksheet, dedreckoning) {
  let points = [];
  for (let u = 0; u < worksheet.length - 1; u++) {
    for (let v = u + 1; v < worksheet.length; v++) {
      const intersections = two_star_fix(worksheet[u], worksheet[v]);
      const d1 = haversine(dedreckoning, intersections[0]);
      const d2 = haversine(dedreckoning, intersections[1]);
      points.push(intersections[d1 < d2 ? 0 : 1]);
    }
  }
  return points;
}
function dip_correction(observer_height_meter) {
  return vector.acos(1.0 / (1.0 + observer_height_meter / (1.2 * vector.earth_radius_in_meters)));
}
function refraction_factor(pressure_mbar, temperature_celsius) {
  return (pressure_mbar * 283.15 / (1010 * (273.15 + temperature_celsius)));
}
function refraction_correction(altitude, f = 1) {
  return f / (vector.tan(altitude + 7.31 / (altitude + 4.4)) * 60);
}
const get_almanac_page = (function () {
  let yy = -9999;
  let mm = 0;
  let dd = 0;
  let page = null;
  return function (almanac, { y, m, d }) {
    if (y != yy || m != mm || d != dd) {
      yy = y;
      mm = m;
      dd = d;
      page = almanac.almanac_page(y, m, d);
    }
    return page;
  };
})();

function prepare(data, almanac, star_names, planet_names) {
  let max_gha = 0;
  let max_time = 0;
  const f = refraction_factor(data.pressure_mbar, data.temperature_celsius);
  const worksheet = [];
  for (let i = 0; i < data.stars.length; i++) {
    const body = data.stars[i];
    const form = {};
    form.name = body.name;
    form.type = 'Sun';
    let ref = 'Sun';
    form.limb = false;
    if (star_names.includes(form.name)) {
      form.type = 'star';
      ref = 'Aries';
    } else if (planet_names.includes(form.name)) {
      form.type = 'planet';
      ref = form.name;
    } else {
      const n = form.name.split(' ');
      if (MOON == n[0]) {
        form.type = MOON;
        ref = MOON;
      }
      form.limb = n[1];
    }
    form.timezone = data.timezone;
    form.watch_time = almanac.utc_date(data.date, body.time, 0);
    const corrected_watch_time = { h: body.time.h, m: body.time.m, s: body.time.s + data.watch_error };
    const date = almanac.utc_date(data.date, corrected_watch_time, data.timezone);
    const page = get_almanac_page(almanac, date.date);
    form.datetime_utc = date;
    form.timestamp = Date.UTC(date.date.y, date.date.m - 1, date.date.d, date.time.h, date.time.m, date.time.s, 0);
    form.sextant_altitude = body.alt;
    let apparent_altitude = form.sextant_altitude;
    form.dip_correction = 0;
    if ('theodolite' == data.method) {
      apparent_altitude = 90 - form.sextant_altitude;
    } else if ('bubble sextant' == data.method) {
      apparent_altitude = (form.sextant_altitude + data.index_error) / 2;
    } else if ('sextant' == data.method) {
      form.dip_correction = dip_correction(data.observer_height_meter);
      apparent_altitude = form.sextant_altitude + data.index_error - form.dip_correction;
    }
    form.refraction_factor = f;
    form.refraction_correction = refraction_correction(apparent_altitude, f);
    form.angle = apparent_altitude - form.refraction_correction;
    const daily_page = page[ref];
    form.gha_integral = daily_page.GHA[date.time.h];
    form.declination = daily_page.DEC[date.time.h];
    form.semidiameter = daily_page.SD;
    form.hp = daily_page.HP;
    form.v_factor = daily_page.v;
    form.d_factor = daily_page.d;
    if (MOON == ref) {
      form.hp = form.hp[date.time.h];
      form.v_factor = form.v_factor[date.time.h];
      form.d_factor = form.d_factor[date.time.h];
    }
    const sign = 'LL' == form.limb ? 1 : -1;
    form.angle += sign * form.semidiameter / 60;
    form.parallax = form.hp * vector.cos(form.angle);
    form.angle += form.parallax / 60;
    form.gha_increment = almanac.gha_increment(ref, date.time.m, date.time.s);
    form.v_correction = almanac.vd_corr(date.time.m, form.v_factor);
    form.d_correction = almanac.vd_corr(date.time.m, form.d_factor);
    form.star_sha = 0;
    if ('Aries' == ref) {
      const ra_dec = daily_page.stars[form.name];
      form.star_sha = ra_dec.SHA;
      form.declination = ra_dec.DEC;
      if (max_time < form.timestamp) { max_time = form.timestamp; max_gha = form.gha_integral + form.gha_increment; }
    }
    form.gha = form.gha_integral + form.gha_increment + form.star_sha + form.v_correction / 60;
    form.lat = form.declination + form.d_correction / 60;
    form.lon = -form.gha;
    worksheet.push(form);
  }
  return { max_gha, worksheet };
}
function celestial_fix(app_state) {
  const almanac = app_state.almanac;
  const star_names = almanac.stars();
  const planet_names = almanac.planets();
  const { max_gha, worksheet } = prepare(app_state.data, almanac, star_names, planet_names);
  let fix;
  const count_GP = app_state.data.stars.length;
  if (count_GP < 2) {
    throw new Error('Not enough observations!');
  } else if (count_GP == 2) {

    if (!app_state.data.has_dr) throw new Error('Ded reckoning is needed for the fix!');
    const intersections = two_star_fix(worksheet[0], worksheet[1]);
    const d1 = haversine(app_state.data.dr, intersections[0]);
    const d2 = haversine(app_state.data.dr, intersections[1]);
    fix = intersections[d1 < d2 ? 0 : 1];
  } else if (count_GP == 3) {
    fix = three_star_fix(worksheet[0], worksheet[1], worksheet[2]);
  } else {
    fix = crooked_hat_center(closest3(intersection_points(worksheet), worksheet));
  }
  let distance_error = 2 * vector.earth_radius_in_meters * vector.PI;
  if (app_state.data.compare_location) {
    distance_error = haversine(app_state.data.actual_location, fix);
    fix.distance_error = distance_error;
  }
  fix.gha = max_gha;
  return { fix, worksheet };
}

export {
  celestial_fix,
};
