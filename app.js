import '@kor-ui/kor';
import { init3D } from './earth_3d.js';
import { createGUI } from './ui.js';

const app_state = {};

function reset_app() {
  const d = new Date();
  app_state.data = {
    date: { y: d.getFullYear(), m: 1 + d.getMonth(), d: d.getDay() },
    timezone: 0,
    observer_height_meter: 0,
    heading: 0,
    speed_knots: 0,
    dr_lat: 0,
    dr_lon: 0,
    index_error: 0,
    watch_error: 0,
    temperature_celsius: 10,
    pressure_mbar: 1010,
    compare_location: false,
    actual_location: { lat: 0, lon: 0 },
    method: 'sextant',
    landmarks: [],
    stars: [],
  };
  app_state.worksheet = [];
  app_state.fix = { gha: 0 };
  app_state.constellations_visible = true;
  app_state.sky_rotation = 0;
  app_state.latlon_lines_visible = false;
  app_state.water_opacity = 0.666;
}
reset_app();

window.main = function (almanac) {
  app_state.almanac = almanac;
  window.app_state = app_state;
  reset_app();
  init3D(app_state);
  createGUI(app_state);
};

export {
  reset_app,
};
