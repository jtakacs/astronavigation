import '@kor-ui/kor';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { el, getval, attr, listen, html5_date_string, dms_string } from './utils.js';

const txt = (function () {
    const textureLoader = new THREE.TextureLoader();
    return function (name, colorSpace = false) {
        const texture = textureLoader.load(name);
        if (false === colorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        else texture.colorSpace = colorSpace;
        return texture;
    };
})();

const { PI } = Math;
const deg = PI / 180;
const near = 0.1;
const far = 1e4;
const fov = 60;
let data = null;

const state = {
    almanac: null,
    animate: false,
    date: { y: 2024, m: 12, d: 21 },
    lat: -77.8833,
    lon: 166.65,
    elevation: 12,
    temp: -5.6,
    pressure: 980.2,
};

const spinner = el("spinner");
spinner.style.display = 'none';
const txt_time = el("txt-time");
const txt_alt = el("txt-alt");
const txt_azi = el("txt-azi");
const tgl_anim = el("tgl-anim");
const btn_load = el("btn-load");
const obs_date = attr("obs-date", 'value', html5_date_string(state.date));
const obs_lat = el("obs-lat");
obs_lat.value = state.lat;
const obs_lon = el("obs-lon");
obs_lon.value = state.lon;
const obs_elev = el("obs-height");
obs_elev.value = state.elevation;
const obs_temp = el("obs-temp");
obs_temp.value = state.temp;
const obs_press = el("obs-pressure");
obs_press.value = state.pressure;
const menu = el('menu');

function load_data(date, lat, lon, elev, temp, press) {
    if (state.almanac) {
        data = state.almanac.sunpath(date, lat, lon, elev, temp, press);
    }
}

window.main = function (almanac) {
    state.almanac = almanac;
    const loaders = document.getElementsByTagName('py-splashscreen');
    for (let idx = loaders.length; 0 < idx; loaders[--idx].remove());
    attr('obs-date', 'value', html5_date_string(state.date)).shadowRoot.querySelector('input[type="date"]').style.colorScheme = 'dark';
    load_data(state.date, state.lat, state.lon, state.elevation, state.temp, state.pressure);
    state.animate = true;
};

listen(tgl_anim, 'active-changed', e => state.animate = tgl_anim.active);

listen(btn_load, 'click', e => {
    btn_load.disabled = true;
    state.animate = false;
    spinner.style.display = 'block';
    const date = getval(obs_date).split('-');
    state.date = {
        y: parseInt(date[0], 10),
        m: parseInt(date[1], 10),
        d: parseInt(date[2], 10),
    };
    state.lat = parseFloat(obs_lat.value);
    state.lon = parseFloat(obs_lon.value);
    state.elevation = parseFloat(getval(obs_elev));
    state.temp = parseFloat(getval(obs_temp));
    state.pressure = parseFloat(getval(obs_press));
    setTimeout(() => {
        load_data(state.date, state.lat, state.lon, state.elevation, state.temp, state.pressure);
        spinner.style.display = 'none';
        state.animate = true;
        btn_load.disabled = false;
        menu.visible = false;
    }, 100);
});

const scene = new THREE.Scene();
// scene.add(new THREE.AxesHelper(100));
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const sun = new THREE.PointLight(0xffffff, 60, 0, 0.8);
sun.castShadow = true;
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;

const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: txt('textures/sun.png') }));
sun.add(sprite);
scene.add(sun);

const compass = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshPhysicalMaterial({ map: txt("textures/compass rose.png"), transparent: true, opacity: 1 })
);
compass.castShadow = false;
compass.receiveShadow = true;
compass.rotateX(-90 * deg);
compass.rotateZ(PI);
scene.add(compass);

const gnomon_height = 5;
const gnomon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, gnomon_height, 32, 1, false),
    new THREE.MeshPhysicalMaterial({ map: txt("textures/wood.png") })
);
gnomon.castShadow = true;
gnomon.receiveShadow = true;
gnomon.position.y = gnomon_height / 2;
scene.add(gnomon);

const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
camera.position.set(7, 10, 7);
scene.add(camera);
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas'),
    logarithmicDepthBuffer: true,
    outputColorSpace: THREE.SRGBColorSpace,
    antialias: true,
    autoClear: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enablePan = false;
orbitControls.minPolarAngle = 0;
orbitControls.maxPolarAngle = PI / 2 - 1e-4;
orbitControls.minDistance = 0.3;
orbitControls.maxDistance = 100;

window.addEventListener('resize', function () {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    camera.aspect = ww / wh;
    camera.updateProjectionMatrix();
    renderer.setSize(ww, wh);
});

let index = 0;
let past = 0;
function reanimate(now) {
    orbitControls.update();
    renderer.render(scene, camera);
    const delta = now - past;
    if (state.animate && (1000 / 60 <= delta)) {
        past = now;
        const dist = 20;
        const alt = data[index].altitude;
        const azi = data[index].azimuth;
        const time = data[index].time;
        index = (index + 1) % data.length;
        const sunpos = new THREE.Vector3().setFromSphericalCoords(dist, (90 - alt) * deg, -azi * deg);
        sun.position.copy(sunpos);
        txt_time.innerText = time;
        txt_alt.innerText = `Altitude: ${dms_string(alt)}`;
        txt_azi.innerText = `Azimuth: ${dms_string(azi)}`;
    }
    requestAnimationFrame(reanimate);
};
requestAnimationFrame(reanimate);
