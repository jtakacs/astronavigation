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
const dist = 1e4;
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
    date: { y: 2023, m: 12, d: 22 },
    observers: [
        { lat: -80, lon: 20, elevation: 0, temp: 10, pressure: 1010, base: new THREE.Vector3(0, 0, 0) },
        { lat: -40, lon: 20, elevation: 0, temp: 10, pressure: 1010, base: new THREE.Vector3(0, 0, 0) },
        { lat: 0, lon: 20, elevation: 0, temp: 10, pressure: 1010, base: new THREE.Vector3(0, 0, 0) },
        { lat: 40, lon: -160, elevation: 0, temp: 10, pressure: 1010, base: new THREE.Vector3(0, 0, 0) },
        { lat: 80, lon: -160, elevation: 0, temp: 10, pressure: 1010, base: new THREE.Vector3(0, 0, 0) },
    ],
};
const cache = [[], [], [], [], []];
let time = 0;
const max_time = 24 * 60 + 1;
let full_circle = false;
const scenes = [];
function step() {
    time = (time + 1) % max_time;
    if (0 == time) full_circle = true;
    return time;
}

const txt_time = el("txt-time");
const tgl_anim = el("tgl-anim");

window.T = THREE;

const globe = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 128, 128),
    new THREE.MeshPhysicalMaterial({ map: txt("textures/earth2.png") })
);
globe.rotateY(-PI / 2);
globe.castShadow = false;
globe.receiveShadow = true;

const group = new THREE.Object3D();
group.add(globe);

const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
camera.position.set(0, 0, 2 * radius);
camera.updateProjectionMatrix();

const asdf = new THREE.Scene();
// asdf.add(new THREE.AxesHelper(100));
asdf.add(new THREE.AmbientLight(0xffffff, 0.5));
asdf.add(group);
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
orbitControls.enablePan = false;
// orbitControls.minPolarAngle = 0;
// orbitControls.maxPolarAngle = PI / 2 - 1e-4;
orbitControls.minDistance = near * 2;
orbitControls.maxDistance = far / 2;

function latlon2xy(lat, lon) {
    const v = new THREE.Vector3();
    v.setFromSphericalCoords(radius, (90 - lat) * deg, lon * deg);
    return v;
}

function load_data(index, date, minutes, lat, lon, elev, temp, press) {
    if (cache[index].length <= minutes) {
        const result = state.almanac.sunpath(date, minutes, lat, lon, elev, temp, press);
        result.v = new THREE.Vector3().setFromSphericalCoords(dist, (90 - result.altitude) * deg, -result.azimuth * deg);
        cache[index][minutes] = result;
    }
    return cache[index][minutes];
}

function path(scene, data, index) {
    scene.remove(scene.getObjectByName('path'));
    const curve = data
        .filter((x, i) => 0 == i % 20)
        .map(d => [d.v.x, d.v.y, d.v.z]);
    const geom = new LineGeometry();
    geom.setPositions(new Float32Array(curve.flat(2)));
    const mat = new LineMaterial({ color: colors[index], linewidth: 2 });
    mat.resolution.set(window.innerWidth, window.innerHeight);
    const path = new Line2(geom, mat);
    path.name = 'path';
    path.computeLineDistances();
    scene.add(path);
}

function create_scene(obs, index) {
    const pos = cache[index][0].v.clone();

    const sprite = new THREE.Sprite(sun_mat);
    sprite.name = 'sprite';
    const sc = 100;
    sprite.scale.set(sc, sc, sc);
    sprite.position.copy(pos.clone().multiplyScalar(0.5));

    const sun = new THREE.PointLight(0xffffff, 60, 0, 0.8);
    sun.name = 'sun';
    sun.castShadow = true;
    sun.shadow.mapSize.width = 4096;
    sun.shadow.mapSize.height = 4096;
    sun.position.copy(pos.clone().multiplyScalar(10 * radius / dist));

    const gnomon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, gnomon_height, 32, 1, false), gnomon_mat);
    gnomon.name = 'gnomon';
    gnomon.castShadow = true;
    gnomon.receiveShadow = true;
    gnomon.position.y = gnomon_height / 2;
    gnomon.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 1, 0xffffff));

    const pointer = new THREE.ArrowHelper(pos.normalize(), origin, dist, colors[index], 0, 0);
    pointer.name = 'pointer';

    const tangent = new THREE.Object3D();
    tangent.add(gnomon);
    tangent.add(sprite);
    tangent.add(sun);
    tangent.add(pointer);
    path(tangent, cache[index], index);
    tangent.position.y = radius;

    const scene = new THREE.Object3D();
    scene.add(tangent);
    scene.rotation.reorder('YXZ');
    scene.rotation.set(-(90 - obs.lat) * deg, (180 + obs.lon) * deg, 0);

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
    window.scenes = scenes;
    let past = 0;
    function reanimate(now) {
        const delta = now - past;
        if (state.animate && (1000 / 60 <= delta)) {
            past = now;
            txt_time.innerText = cache[0][time].time;
            for (let index = 0; index < state.observers.length; index++) {
                const scene = scenes[index];
                if (!full_circle) path(scene, cache[index], index);
                const sun = scene.getObjectByName('sun');
                const dir = cache[index][time].v.clone();
                sun.position.copy(dir.clone().multiplyScalar(10 * radius / dist));
                const sprite = scene.getObjectByName('sprite');
                sprite.position.copy(dir.clone().multiplyScalar(0.5));
                const pointer = scene.getObjectByName('pointer');
                pointer.setDirection(dir.normalize());
            }
            step();
            if (!full_circle) for (let index = 0; index < state.observers.length; index++) {
                const obs = state.observers[index];
                load_data(index, state.date, time, obs.lat, obs.lon, obs.elevation, obs.temp, obs.pressure);
            }
        }
        orbitControls.update();
        renderer.render(asdf, camera);
        requestAnimationFrame(reanimate);
    };
    requestAnimationFrame(reanimate);
}

window.main = function (almanac) {
    state.almanac = almanac;
    setTimeout(() => {
        for (let index = 0; index < state.observers.length; index++) {
            const obs = state.observers[index];
            obs.base = latlon2xy(obs.lat, obs.lon);
            load_data(index, state.date, 0, obs.lat, obs.lon, obs.elevation, obs.temp, obs.pressure);
            const sc = create_scene(obs, index);
            scenes.push(sc);
            asdf.add(sc);
        }
        const loaders = document.getElementsByTagName('py-splashscreen');
        for (let idx = loaders.length; 0 < idx; loaders[--idx].remove());
        listen(tgl_anim, 'active-changed', e => state.animate = tgl_anim.active);
        state.animate = true;
        start();
    }, 100);
};

