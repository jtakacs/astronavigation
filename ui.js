import { celestial_fix } from './celnav.js';
import { reset3D } from './earth_3d.js';
import { id, el, getval, attr, create, listen, listen_with_enter, html5_date_string, dms_string, time_string, handler } from './utils.js';
import { worksheet_table, worksheet_csv, format_input_as_text } from './formatter.js';
import { examples } from './examples.js';
import { reset_app } from './app.js';
import { parse, validate } from './freetext.js';
const radian = Math.PI / 180;

function del_event(id) {
  return handler(e => {
    document.getElementById(`row${id}`).remove();
    tbl = window.app_state.data.stars;
    for (let k = 0; k < tbl.length; k++) {
      if (id == tbl[k].id) {
        tbl.splice(k, 1);
        break;
      }
    }
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
  attr('obs-indexerr', 'value', 60 * data.index_error);
  attr('obs-watcherr', 'value', data.watch_error);
  attr('obs-pressure', 'value', data.pressure_mbar);
  attr('obs-temp', 'value', data.temperature_celsius);
  if (data.compare_location) {
    attr('obs-actpos', 'active', true);
    el('obs-actlat').value = data.actual_location.lat;
    el('obs-actlon').value = data.actual_location.lon;
  } else {
    attr('obs-actpos', 'active', false);
    el('obs-actlat').value = 0;
    el('obs-actlon').value = 0;
  }
  if (data.has_dr) {
    attr('obs-hasdr', 'active', true);
    el('obs-drlat').value = data.dr.lat;
    el('obs-drlon').value = data.dr.lon;
  } else {
    attr('obs-hasdr', 'active', false);
    el('obs-drlat').value = 0;
    el('obs-drlon').value = 0;
  }
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
  if (getval('obs-hasdr', 'active')) {
    d.has_dr = true;
    d.dr.lat = el('obs-drlat').value;
    d.dr.lon = el('obs-drlon').value;
  } else d.has_dr = false;
  d.index_error = parseFloat(getval('obs-indexerr')) / 60;
  d.watch_error = parseFloat(getval('obs-watcherr'));
  d.temperature_celsius = parseFloat(getval('obs-temp'));
  d.pressure_mbar = parseFloat(getval('obs-pressure'));
  if (getval('obs-actpos', 'active')) {
    d.compare_location = true;
    d.actual_location.lat = el('obs-actlat').value;
    d.actual_location.lon = el('obs-actlon').value;
  } else d.compare_location = false;
}

function getLocationFix() {
  const { fix, worksheet } = celestial_fix(window.app_state);
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
  const sw_latlongrid = attr('latlongrid', 'active', app_state.latlon_lines_visible);
  const waterslide = attr('waterslide', 'value', app_state.water_opacity);
  const skyrotation = attr('skyrotation', 'value', app_state.sky_rotation);
  const sw_const = attr('constellations', 'active', app_state.constellations_visible);
  const sw_labels = attr('starlabels', 'active', app_state.toggle_labels);
  const star_select = el('star-name');
  const star_table = el('obs-stars');
  const star_alt = el('star-altitude');
  const star_time = el('star-time');
  const sw_act_pos = el('obs-actpos');
  const obs_actlat = el('obs-actlat');
  const obs_actlon = el('obs-actlon');
  const sw_has_dr = el('obs-hasdr');
  const obs_drlat = el('obs-drlat');
  const obs_drlon = el('obs-drlon');

  const free_text_input = attr('freetext', 'value', app_state.default_free_text);
  const grammarerror = el('grammarerror');
  grammarerror.style.visibility = 'hidden';

  const almanac = app_state.almanac;
  const stars = almanac.stars();
  const planets = almanac.planets();
  const sunmoon = almanac.sunmoon();
  function icon(name) {
    if (stars.includes(name)) return 'star';
    if (planets.includes(name)) return 'language';
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
      attr('form6', 'visible', false);
      update_forms(d);
      update_table(star_table, d.stars, star_row);
      free_text_input.value = format_input_as_text(app_state);
      getLocationFix();
    });
  }

  listen_with_enter('calc-fix', 'click', e => {
    attr('form2', 'visible', false);
    get_data_from_forms();
    free_text_input.value = format_input_as_text(app_state);
    getLocationFix();
  });

  listen_with_enter('calc-fix2', 'click', e => {
    grammarerror.style.visibility = 'hidden';
    grammarerror.childNodes.forEach(c => c.nodeType === Node.TEXT_NODE && c.remove());
    setTimeout(() => {
      const text = getval(free_text_input);
      try {
        const result = parse(text);
        const valid = validate(result, stars.concat(planets).concat(sunmoon));
        app_state.data = JSON.parse(JSON.stringify(valid));
        const d = app_state.data;
        d.stars.forEach(v => v.id = id());
        attr('formtext', 'visible', false);
        update_forms(d);
        update_table(star_table, d.stars, star_row);
        getLocationFix();
      } catch (parseError) {
        console.error(parseError);
        grammarerror.append(`${parseError}`);
        grammarerror.style.visibility = 'visible';
      }
    }, 1);
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

  listen_with_enter('save-txt', 'click', e => {
    const d = new Date();
    const text = encodeURI("data:text/plain;charset=utf-8," + format_input_as_text(app_state));
    const link = create('a', [
      'href', text,
      'download', `celestial-navigation-${d.getFullYear()}-${1 + d.getMonth()}-${d.getDate()}_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}.txt`
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

  listen(sw_has_dr, 'active-changed', e => {
    attr(obs_drlat, 'disabled', !sw_has_dr.active);
    attr(obs_drlon, 'disabled', !sw_has_dr.active);
  });

  function rotate_sky(diff) {
    app_state.sky_rotation += diff;
    if (360 <= app_state.sky_rotation) app_state.sky_rotation -= 360;
    else if (app_state.sky_rotation < 0) app_state.sky_rotation += 360;
    app_state.sky_rotation = Math.round(10 * app_state.sky_rotation) / 10;
    app_state.skymap.rotation.y = app_state.sky_rotation * radian;
    app_state.skymap.needsUpdate = true;
  }

  listen(free_text_input, 'keyup', event => event.stopPropagation());
  listen(free_text_input, 'keydown', event => event.stopPropagation());

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
