import '@kor-ui/kor';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { el, getval, attr, listen, html5_date_string, dms_string } from './utils.js';

const colors = [
    0xff7777, //lightred
    0xaaff66, //lightgreen
    0xeeee77, //yellow
    0xcc44cc, //violet
    0x0000aa, //blue
    0xdd8855, //orange
    0xaaffee, //cyan
    0x0088ff, //lightblue
    0x00cc55, //green
    0x880000, //red
    0x664400, //brown
];

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
const radius = 25;
const dist = 25;
const gnomon_height = 5;
const origin = new THREE.Vector3(0, 0, 0);
const near = 0.1;
const far = 1e9;
const fov = 60;
const sun_mat = new THREE.SpriteMaterial({ map: txt('textures/sun.png') });
const gnomon_mat = new THREE.MeshPhysicalMaterial({ map: txt("textures/wood.png") });

const state = {
    almanac: null,
    animate: false,
    fe: false,
    real: true,
    date: { y: 2024, m: 12, d: 21 },
    observer:
    {
        lat: -77.8833,
        lon: 166.65,
        elevation: 12,
        temp: -5.6,
        pressure: 980.2,
        base: new THREE.Vector3(0, 0, 0)
    },
};
const cache = [];
let time = 0;
const max_time = 24 * 60 + 1;
let full_circle = false;
let scene = null;
let fake_data = [];

function step() {
    time = (time + 1) % max_time;
    if (0 == time) full_circle = true;
    return time;
}

const txt_time = el("txt-time");
const tgl_anim = el("tgl-anim");
const tgl_flerf = el('tgl-flerf');
const tgl_real = el('tgl-real');
const spinner = el("spinner");
spinner.style.display = 'none';
const txt_alt = el("txt-alt");
const txt_azi = el("txt-azi");
const btn_load = el("btn-load");
const obs_date = attr("obs-date", 'value', html5_date_string(state.date));
const obs_lat = el("obs-lat");
obs_lat.value = state.observer.lat;
const obs_lon = el("obs-lon");
obs_lon.value = state.observer.lon;
const obs_elev = el("obs-height");
obs_elev.value = state.observer.elevation;
const obs_temp = el("obs-temp");
obs_temp.value = state.observer.temp;
const obs_press = el("obs-pressure");
obs_press.value = state.observer.pressure;
const menu = el('menu');

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(6 * radius, 6 * radius),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, depthWrite: false })
);
plane.rotateX(-90 * deg);
plane.castShadow = false;
plane.receiveShadow = true;

const flerf = new THREE.Mesh(
    new THREE.CylinderGeometry(0, radius, Number.EPSILON, 64, 64, true),
    new THREE.MeshPhysicalMaterial({ map: txt("textures/earth2.png") })
);
flerf.position.y = Number.EPSILON;
flerf.castShadow = false;
flerf.receiveShadow = true;

const group = new THREE.Object3D();
group.add(plane);
group.add(flerf);

const fakesprite = new THREE.Sprite(sun_mat);
fakesprite.name = 'fakesprite';
const sc = 4;
fakesprite.scale.set(sc, sc, sc);

const fakesun = new THREE.PointLight(0xffffff, 15, 0, 0.8);
fakesun.name = 'fakesun';
fakesun.castShadow = true;
fakesun.shadow.mapSize.width = 4096;
fakesun.shadow.mapSize.height = 4096;
fakesun.add(fakesprite);

const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
camera.position.set(7, 20, 7);
camera.updateProjectionMatrix();

const asdf = new THREE.Scene();
// asdf.add(new THREE.AxesHelper(100));
asdf.add(new THREE.AmbientLight(0xffffff, 0.5));
asdf.add(group);
asdf.add(fakesun);
asdf.add(camera);

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
// orbitControls.enablePan = false;
orbitControls.minPolarAngle = 0;
orbitControls.maxPolarAngle = PI / 2 - 1e-4;
orbitControls.minDistance = near * 2;
orbitControls.maxDistance = 1000;

function latlon2xy(lat, lon) {
    const v = new THREE.Vector3();
    v.setFromSphericalCoords(radius * (90 - lat) / 180, PI / 2, (180 + lon) * deg);
    return v;
}

function load_data(date, minutes, lat, lon, elev, temp, press) {
    if (cache.length <= minutes) {
        const result = state.almanac.sunpath(date, minutes, lat, lon, elev, temp, press);
        result.v = new THREE.Vector3().setFromSphericalCoords(dist, (90 - result.altitude) * deg, -result.azimuth * deg);
        cache[minutes] = result;
    }
    return cache[minutes];
}

function path(scene, data) {
    scene.remove(scene.getObjectByName('path'));
    const curve = data
        .filter((x, i) => 0 == i % 20)
        .map(d => [d.v.x, d.v.y, d.v.z]);
    const geom = new LineGeometry();
    geom.setPositions(new Float32Array(curve.flat(2)));
    const mat = new LineMaterial({ color: colors[0], linewidth: 2 });
    mat.resolution.set(window.innerWidth, window.innerHeight);
    const path = new Line2(geom, mat);
    path.name = 'path';
    path.computeLineDistances();
    path.visible = state.real;
    scene.add(path);
}

function create_scene(obs) {
    const pos = cache[0].v.clone();

    const sprite = new THREE.Sprite(sun_mat);
    sprite.name = 'sprite';
    const sc = 4;
    sprite.scale.set(sc, sc, sc);

    const sun = new THREE.PointLight(0xffffff, 30, 0, 0.8);
    sun.name = 'sun';
    sun.castShadow = true;
    sun.shadow.mapSize.width = 4096;
    sun.shadow.mapSize.height = 4096;
    sun.add(sprite);
    sun.position.copy(pos);
    sun.visible = state.real;

    const gnomon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, gnomon_height, 32, 1, false), gnomon_mat);
    gnomon.name = 'gnomon';
    gnomon.castShadow = true;
    gnomon.receiveShadow = true;
    gnomon.position.y = gnomon_height / 2;
    gnomon.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 1, 0xffffff));

    const pointer = new THREE.ArrowHelper(pos.normalize(), origin, dist, colors[0], 0, 0);
    pointer.name = 'pointer';
    pointer.visible = state.real;

    const scene = new THREE.Object3D();
    scene.add(sun);
    scene.add(gnomon);
    scene.add(pointer);
    path(scene, cache);
    scene.rotateY(obs.lon * deg);
    scene.position.copy(obs.base);
    return scene;
}

listen(window, 'resize', e => {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    camera.aspect = ww / wh;
    camera.updateProjectionMatrix();
    renderer.setSize(ww, wh);
});

function start() {
    const obs = state.observer;
    obs.base = latlon2xy(obs.lat, obs.lon);
    load_data(state.date, 0, obs.lat, obs.lon, obs.elevation, obs.temp, obs.pressure);
    scene = create_scene(obs);
    asdf.add(scene);
    const sun_lat = state.almanac.sun_lat(state.date);
    fake(sun_lat, asdf);
    state.animate = true;
    let past = 0;
    function reanimate(now) {
        const delta = now - past;
        if (state.animate && (1000 / 60 <= delta)) {
            past = now;
            txt_time.innerText = cache[time].time;
            txt_alt.innerText = `Altitude: ${dms_string(cache[time].altitude)}`;
            txt_azi.innerText = `Azimuth: ${dms_string(cache[time].azimuth)}`;
            if (!full_circle) path(scene, cache);
            const sun = scene.getObjectByName('sun');
            const dir = cache[time].v.clone();
            sun.position.copy(dir);
            const pointer = scene.getObjectByName('pointer');
            pointer.setDirection(dir.normalize());
            const fakedir = fake_data[time].clone();
            fakesun.position.copy(fakedir);
            step();
            if (!full_circle) {
                const obs = state.observer;
                load_data(state.date, time, obs.lat, obs.lon, obs.elevation, obs.temp, obs.pressure);
            }
        }
        orbitControls.update();
        renderer.render(asdf, camera);
        requestAnimationFrame(reanimate);
    };
    requestAnimationFrame(reanimate);
}

function fake(lat, scene) {
    const sun_r = radius * (90 - lat) / 180;
    const meter = 1;
    const furlong = 1;
    const mile = 1609.344 * meter;
    const earth_polar_radius = 6356751.9 * meter;
    const half_meridian_circumference = PI * earth_polar_radius;
    const flat_earth_radius = half_meridian_circumference * furlong;
    const y = 3000 * mile * radius / flat_earth_radius;
    const curve = [];
    fake_data = [];
    for (let t = 0; t < max_time; t++) {
        const theta = 2 * PI * t / (max_time - 1);
        const x = sun_r * Math.cos(theta);
        const z = sun_r * Math.sin(theta);
        fake_data.push(new THREE.Vector3(x, y, z));
        if (0 == (t % 20)) curve.push([x, y, z]);
    }
    scene.remove(scene.getObjectByName('fakepath'));
    const geom = new LineGeometry();
    geom.setPositions(new Float32Array(curve.flat(2)));
    const mat = new LineMaterial({ color: colors[1], linewidth: 2 });
    mat.resolution.set(window.innerWidth, window.innerHeight);
    const fakepath = new Line2(geom, mat);
    fakepath.name = 'fakepath';
    fakepath.computeLineDistances();
    fakepath.visible = state.fe;
    scene.add(fakepath);
    const pos = fake_data[0].clone();
    fakesun.position.copy(pos);
    fakesun.visible = state.fe;
}

window.main = function (almanac) {
    state.almanac = almanac;
    const loaders = document.getElementsByTagName('py-splashscreen');
    for (let idx = loaders.length; 0 < idx; loaders[--idx].remove());
    attr('obs-date', 'value', html5_date_string(state.date)).shadowRoot.querySelector('input[type="date"]').style.colorScheme = 'dark';
    listen(tgl_anim, 'active-changed', e => state.animate = tgl_anim.active);
    listen(tgl_flerf, 'active-changed', e => {
        state.fe = tgl_flerf.active;
        const fakepath = asdf.getObjectByName('fakepath');
        fakesun.visible = state.fe;
        fakepath.visible = state.fe;
    });
    listen(tgl_real, 'active-changed', e => {
        state.real = tgl_real.active;
        const sun = scene.getObjectByName('sun');
        const path = asdf.getObjectByName('path');
        const pointer = asdf.getObjectByName('pointer');
        sun.visible = state.real;
        path.visible = state.real;
        pointer.visible = state.real;
    });
    listen(btn_load, 'click', e => {
        time = 0;
        full_circle = false;
        cache.length = 0;
        const date = getval(obs_date).split('-');
        state.date = {
            y: parseInt(date[0], 10),
            m: parseInt(date[1], 10),
            d: parseInt(date[2], 10),
        };
        const obs = state.observer;
        obs.lat = parseFloat(obs_lat.value);
        obs.lon = parseFloat(obs_lon.value);
        obs.elevation = parseFloat(getval(obs_elev));
        obs.temp = parseFloat(getval(obs_temp));
        obs.pressure = parseFloat(getval(obs_press));
        obs.base = latlon2xy(obs.lat, obs.lon);
        load_data(state.date, 0, obs.lat, obs.lon, obs.elevation, obs.temp, obs.pressure);
        asdf.remove(scene);
        scene = create_scene(obs);
        asdf.add(scene);
        const sun_lat = almanac.sun_lat(state.date);
        fake(sun_lat, asdf);
        menu.visible = false;
    });
    setTimeout(start, 100);
};
