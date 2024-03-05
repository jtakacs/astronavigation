import { celestial_fix, radian } from './celnav.js';
import { reset3D } from './earth_3d.js';
import { id, el, getval, attr, create, listen, listen_with_enter, html5_date_string, dms_string, time_string, handler } from './utils.js';
import { worksheet_table, worksheet_csv } from './formatter.js';
import { examples } from './examples.js';
import { reset_app } from './app.js';

function del_event(id) {
  return handler(e => {
    document.getElementById(`row${id}`).remove();
    [window.app_state.data.stars, window.app_state.data.landmarks].forEach(tbl => {
      for (let k = 0; k < tbl.length; k++) {
        if (id == tbl[k].id) {
          tbl.splice(k, 1);
          break;
        }
      }
    });
  });
}

function star_row(table, data) {
  const cell_name = create('kor-table-cell', ['grid-cols', '7']);
  const cell_alt = create('kor-table-cell', ['grid-cols', '7']);
  const cell_time = create('kor-table-cell', ['grid-cols', '7']);
  const cell_del = create('kor-table-cell', ['grid-cols', '3']);
  const cell_icon = create('kor-icon', ['icon', 'delete_forever', 'button', '']);
  cell_name.append(data.name);
  cell_alt.append(dms_string(data.alt));
  cell_time.append(time_string(data.time));
  cell_del.append(cell_icon);
  const row = create('kor-table-row');
  attr(row, 'id', `row${data.id}`);
  row.append(cell_name);
  row.append(cell_alt);
  row.append(cell_time);
  row.append(cell_del);
  table.append(row);
  cell_icon.addEventListener('click', del_event(data.id));
}
function land_row(table, data) {
  const cell_name = create('kor-table-cell', ['grid-cols', '5']);
  const cell_lat = create('kor-table-cell', ['grid-cols', '6']);
  const cell_lon = create('kor-table-cell', ['grid-cols', '6']);
  const cell_dist = create('kor-table-cell', ['grid-cols', '4']);
  const cell_del = create('kor-table-cell', ['grid-cols', '3']);
  const cell_icon = create('kor-icon', ['icon', 'delete_forever', 'button', '']);
  cell_name.append(data.name);
  cell_lat.append(dms_string(data.lat));
  cell_lon.append(dms_string(data.lon));
  cell_dist.append(`${(data.distance / 1000).toFixed(3)} km`);
  cell_del.append(cell_icon);
  const row = create('kor-table-row');
  attr(row, 'id', `row${data.id}`);
  row.append(cell_name);
  row.append(cell_lat);
  row.append(cell_lon);
  row.append(cell_dist);
  row.append(cell_del);
  table.append(row);
  cell_icon.addEventListener('click', del_event(data.id));
}

function update_table(table, app_table, row) {
  for (let i = table.children.length - 1; 0 <= i; i--) {
    if ('header' != table.children[i].getAttribute('slot')) {
      table.removeChild(table.children[i]);
    }
  }
  for (let i = 0; i < app_table.length; i++) {
    row(table, app_table[i]);
  }
}

function update_forms(data) {
  attr('obs-date', 'value', html5_date_string(data.date));
  attr('obs-timezone', 'value', data.timezone);
  attr('obs-height', 'value', data.observer_height_meter);
  attr('obs-bearing', 'value', data.heading);
  attr('obs-speed', 'value', data.speed_knots);
  attr('obs-drlat', 'value', data.dr_lat);
  attr('obs-drlon', 'value', data.dr_lon);
  attr('obs-indexerr', 'value', 60 * data.index_error);
  attr('obs-watcherr', 'value', data.watch_error);
  attr('obs-pressure', 'value', data.pressure_mbar);
  attr('obs-temp', 'value', data.temperature_celsius);
}

function get_data_from_forms() {
  const d = window.app_state.data;
  const date = getval('obs-date').split('-');
  d.date = {
    y: parseInt(date[0], 10),
    m: parseInt(date[1], 10),
    d: parseInt(date[2], 10),
  };
  d.timezone = parseInt(getval('obs-timezone'), 10);
  d.method = getval('obs-method', 'value');
  d.observer_height_meter = parseFloat(getval('obs-height'));
  d.heading = getval('obs-bearing');
  d.speed_knots = parseFloat(getval('obs-speed'));
  d.dr_lat = getval('obs-drlat');
  d.dr_lon = getval('obs-drlon');
  d.index_error = parseFloat(getval('obs-indexerr')) / 60;
  d.watch_error = parseFloat(getval('obs-watcherr'));
  d.temperature_celsius = parseFloat(getval('obs-temp'));
  d.pressure_mbar = parseFloat(getval('obs-pressure'));
  if (getval('obs-actpos', 'active')) {
    d.compare_location = true;
    d.actual_location.lat = getval('obs-actlat');
    d.actual_location.lon = getval('obs-actlon');
  } else d.compare_location = false;
}

function getLocationFix() {
  const { fix, worksheet } = celestial_fix(app_state);
  window.app_state.fix = fix;
  window.app_state.worksheet = worksheet;
  console.log(worksheet);
  console.log(`fix: ${fix.lat}, ${fix.lon}`);
  if (!!window.app_state.data.compare_location) {
    const cmp = window.app_state.data.actual_location;
    console.log(`actual location: ${cmp.lat}, ${cmp.lon}`);
    console.log(`distance error: ${(fix.distance_error / 1000).toFixed(3)} km`);
  }
  attr('goto-maps', 'href', `https://maps.google.com/?q=${fix.lat},${fix.lon}`);
  worksheet_table(window.app_state, 'obs-worksheet');
  window.app_state.sky_rotation = -fix.gha;
  window.app_state.draw_fix(fix, worksheet);
}

function createGUI() {
  const app_state = window.app_state;
  const star_select = el('star-name');
  const star_table = el('obs-stars');
  const land_table = el('obs-landmarks');
  const land_name = el('land-name');
  const land_dist = el('land-dist');
  const sw_act_pos = el('obs-actpos');
  const sw_latlongrid = attr('latlongrid', 'active', app_state.latlon_lines_visible);
  const skyrotation = attr('skyrotation', 'value', app_state.sky_rotation);
  const sw_const = attr('constellations', 'active', app_state.constellations_visible);
  const sw_labels = attr('starlabels', 'active', app_state.toggle_labels);
  const waterslide = attr('waterslide', 'value', app_state.water_opacity);
  const star_alt = el('star-altitude');
  const star_time = el('star-time');
  const land_lat = el('land-lat');
  const land_lon = el('land-lon');
  const obs_actlat = el('obs-actlat');
  const obs_actlon = el('obs-actlon');

  const almanac = app_state.almanac;
  const stars = almanac.stars();
  const planets = almanac.planets();
  const sunmoon = almanac.sunmoon();
  function icon(name) {
    if (stars.includes(name)) return 'star';
    if (planets.includes(name)) {
      if ('Venus' == name) return 'language';
      if ('Mars' == name) return 'language';
      if ('Jupiter' == name) return 'language';
      if ('Saturn' == name) return 'language';
    }
    if (name.includes('Moon')) return 'nights_stay';
    return 'wb_sunny';
  }
  stars.concat(planets).concat(sunmoon).forEach((n, i) => {
    star_select.append(create('kor-menu-item', ['label', n, 'icon', icon(n)]));
    if (i == 0) {
      star_select.firstChild.active = true;
      attr(star_select, 'value', n);
    }
  });

  attr('obs-date', 'value', html5_date_string(app_state.data.date));

  listen_with_enter('reset', 'click', e => {
    reset_app();
    attr(sw_latlongrid, 'active', app_state.latlon_lines_visible);
    attr(sw_const, 'active', app_state.constellations_visible);
    attr(skyrotation, 'value', app_state.sky_rotation);
    attr(waterslide, 'value', app_state.water_opacity);
    update_forms(app_state.data);
    update_table(star_table, app_state.data.stars, star_row);
    update_table(land_table, app_state.data.landmarks, land_row);
    reset3D();
  });

  listen('ch-tabs', 'click', event => {
    if (`${event.target.id}`.startsWith('ch-item')) {
      let nr = event.target.id.split('-');
      nr = nr[nr.length - 1];
      document.querySelectorAll('#form6 kor-card').forEach(tab => tab.style.display = 'none');
      el(`ch-tab-${nr}`).style.display = 'block';
      el(`ch-btns-${nr}`).style.display = 'block';
    }
  });

  listen('hlp-tabs', 'click', event => {
    if (`${event.target.id}`.startsWith('hlp-item')) {
      let nr = event.target.id.split('-');
      nr = nr[nr.length - 1];
      document.querySelectorAll('#form7 kor-card').forEach(tab => tab.style.display = 'none');
      const tab = el(`hlp-tab-${nr}`);
      tab.style.display = 'block';
    }
  });

  for (let i = 0; i < 9; i++) {
    listen_with_enter(`getfix-${i}`, 'click', e => {
      app_state.data = JSON.parse(JSON.stringify(examples[i]));
      const d = app_state.data;
      d.stars.forEach(v => v.id = id());
      d.landmarks.forEach(v => v.id = id());
      attr('form6', 'visible', false);
      update_forms(d);
      update_table(star_table, d.stars, star_row);
      update_table(land_table, d.landmarks, land_row);
      getLocationFix();
    });
  }

  listen_with_enter('calc-fix', 'click', e => {
    attr('form2', 'visible', false);
    get_data_from_forms();
    getLocationFix();
  });

  listen_with_enter('add-star', 'click', e => {
    app_state.data.stars.push({
      id: id(),
      name: star_select.value,
      alt: star_alt.value,
      time: star_time.value
    });
    update_table(star_table, app_state.data.stars, star_row);
  });

  listen_with_enter('add-landmark', 'click', e => {
    const n = land_name.value;
    const lat = land_lat.value;
    const lon = land_lon.value;
    const dist = land_dist.value;
    app_state.data.landmarks.push({ id: id(), name: n, lat: lat, lon: lon, distance: dist });
    update_table(land_table, app_state.data.landmarks, land_row);
  });

  listen_with_enter('save-csv', 'click', e => {
    const d = new Date();
    const csv = encodeURI("data:text/csv;charset=utf-8," + worksheet_csv(app_state));
    const link = create('a', [
      'href', csv,
      'download', `worksheet-${d.getFullYear()}-${1 + d.getMonth()}-${d.getDate()}_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}.csv`
    ]);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  listen(waterslide, 'value-changed', e => {
    app_state.water_opacity = waterslide.value;
    app_state.water.opacity = app_state.water_opacity;
    app_state.water.needsUpdate = true;
  });

  listen(skyrotation, 'value-changed', e => {
    app_state.sky_rotation = Math.round(10 * skyrotation.value) / 10;
    app_state.skymap.rotation.y = app_state.sky_rotation * radian;
    app_state.skymap.needsUpdate = true;
  });

  listen(sw_const, 'active-changed', e => {
    app_state.constellations_visible = sw_const.active;
    if (app_state.constellations_visible) {
      app_state.skymap.material.map = app_state.constellations.a;
    } else {
      app_state.skymap.material.map = app_state.constellations.b;
    }
    app_state.skymap.needsUpdate = true;
  });

  listen(sw_latlongrid, 'active-changed', e => {
    app_state.latlon_lines.visible = app_state.latlon_lines_visible = sw_latlongrid.active;
    app_state.latlon_lines.needsUpdate = true;
  });

  listen(sw_labels, 'active-changed', e => {
    app_state.toggle_labels();
  });

  listen(sw_act_pos, 'active-changed', e => {
    attr(obs_actlat, 'disabled', !sw_act_pos.active);
    attr(obs_actlon, 'disabled', !sw_act_pos.active);
  });

  function rotate_sky(diff) {
    app_state.sky_rotation += diff;
    if (360 <= app_state.sky_rotation) app_state.sky_rotation -= 360;
    else if (app_state.sky_rotation < 0) app_state.sky_rotation += 360;
    app_state.sky_rotation = Math.round(10 * app_state.sky_rotation) / 10;
    app_state.skymap.rotation.y = app_state.sky_rotation * radian;
    app_state.skymap.needsUpdate = true;
  }

  listen(document, 'keyup', function (event) {
    switch (event.code) {
      case 'KeyC':
        app_state.constellations_visible = !app_state.constellations_visible;
        sw_const.active = app_state.constellations_visible;
        if (app_state.constellations_visible) {
          app_state.skymap.material.map = app_state.constellations.a;
        } else {
          app_state.skymap.material.map = app_state.constellations.b;
        }
        app_state.skymap.needsUpdate = true;
        break;
      case 'KeyG':
        app_state.latlon_lines_visible = !app_state.latlon_lines_visible;
        app_state.latlon_lines.visible = app_state.latlon_lines_visible;
        sw_latlongrid.active = app_state.latlon_lines_visible;
        break;
      case 'KeyL':
        sw_labels.active = !sw_labels.active;
        //app_state.toggle_labels();
        break;
      default:
    }
  });
  listen(document, 'keydown', function (event) {
    switch (event.code) {
      case 'KeyW':
        let diff = app_state.water_opacity + (event.shiftKey ? -0.01 : 0.01);
        if (diff < 0) diff = 0;
        if (1 < diff) diff = 1;
        app_state.water_opacity = diff;
        waterslide.value = diff;
        app_state.water.opacity = app_state.water_opacity;
        app_state.water.needsUpdate = true;
        break;
      case 'KeyR':
        rotate_sky(event.shiftKey ? -1 : -0.1);
        break;
      case 'KeyT':
        rotate_sky(event.shiftKey ? 1 : 0.1);
        break;
      default:
    }
  });

  /* fixes in kor-webcomponents  */
  el('obs-date').shadowRoot.querySelector('input[type="date"]').style.colorScheme = 'dark';
  const tz_slider = el('obs-timezone');
  tz_slider.shadowRoot.querySelectorAll('.label kor-text').forEach(e => e.style.flex = 'none');
  listen(tz_slider, 'blur', e => {
    const temp = tz_slider.value;
    tz_slider.shadowRoot.querySelector('input[type="number"]').value = temp;
  });

  /* python is loaded, remove spinner overlay, and display UI */
  const loaders = document.getElementsByTagName('py-splashscreen');
  for (let idx = loaders.length; 0 < idx; loaders[--idx].remove());
  el('canvas').style.display = 'block';
  el('page').style.display = 'block';
  el('container').style.display = 'block';
}

export {
  createGUI
};
