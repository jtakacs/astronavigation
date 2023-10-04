import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { scaleVector, toCartesian, earth_radius_in_meters, radian } from './celnav.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const txt = (function () {
    const textureLoader = new THREE.TextureLoader();
    return function (name, colorSpace = false) {
        const texture = textureLoader.load(name);
        if (false === colorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        else texture.colorSpace = colorSpace;
        return texture;
    };
})();

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
const { PI, sin, cos } = Math;
const TAU = 2 * PI;
const kilometer = 1e-4;
const earth_display_radius = earth_radius_in_meters * kilometer / 1000;
const star_distance = 7e4;
const origin = new THREE.Vector3(0, 0, 0);

const scene = new THREE.Scene();
const gp_vectors = [];

const curve = new THREE.EllipseCurve(0, 0, earth_display_radius, earth_display_radius, 0, TAU, false, 0).getPoints(128).map(p => [p.x, p.y, 0]).flat(2);
const mat1 = new LineMaterial({ color: 0xaaffee, linewidth: 1 });
const mat2 = new LineMaterial({ color: 0xffaaee, linewidth: 2 });
mat1.resolution.set(window.innerWidth, window.innerHeight);
mat2.resolution.set(window.innerWidth, window.innerHeight);

function circle(lat, deg) {
    const geom = new LineGeometry();
    geom.setPositions(curve);
    const ellipse = new Line2(geom, (0 != deg) ? mat1 : mat2);
    ellipse.computeLineDistances();
    if (lat) {
        ellipse.rotateX(PI / 2);
        const sc = cos(deg * radian);
        ellipse.scale.set(sc, sc, sc);
        ellipse.position.y = sin(deg * radian) * earth_display_radius;
    } else {
        ellipse.rotateY(deg * radian);
    }
    return ellipse;
}

function rod(start, end, color) {
    const mat = new LineMaterial({ color: color, linewidth: 3 });
    mat.resolution.set(window.innerWidth, window.innerHeight);
    const geom = new LineGeometry();
    geom.setPositions([start.x, start.y, start.z, end.x, end.y, end.z]);
    const line = new Line2(geom, mat);
    line.computeLineDistances();
    return line;
}

const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earth_display_radius, 128, 128, 0),
    new THREE.MeshStandardMaterial({
        map: txt('textures/earth.png'),
        transparent: false,
        opacity: 1,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
    })
);

const hdrEquirect = new RGBELoader().load('textures/test.hdr', () => hdrEquirect.mapping = THREE.EquirectangularReflectionMapping);
const normalMapTexture = txt('textures/normal.jpg', THREE.NoColorSpace);
normalMapTexture.wrapS = normalMapTexture.wrapT = THREE.RepeatWrapping;
normalMapTexture.repeat.set(1, 1);
const water = new THREE.MeshPhysicalMaterial({
    map: txt('textures/water.png'),
    transparent: true,
    opacity: 0.666,
    transmission: 1,
    thickness: 0,
    roughness: 0.5,
    envMap: hdrEquirect,
    envMapIntensity: 1.5,
    ior: 1.2,
    normalScale: new THREE.Vector2(1.5),
    normalMap: normalMapTexture,
    clearcoat: 0.15,
    clearcoatRoughness: 0.15,
    clearcoatNormalMap: normalMapTexture,
    clearcoatNormalScale: new THREE.Vector2(0.4),
    side: THREE.DoubleSide,
});
const waterMesh = new THREE.Mesh(new THREE.SphereGeometry(earth_display_radius, 128, 128, 0), water);

const starsky = txt('textures/starmap_2020_8k.png');
const starmap = txt('textures/constellations_2020_8k.png');
const starfield = new THREE.Mesh(
    new THREE.SphereGeometry(star_distance, 128, 128, -PI),
    new THREE.MeshBasicMaterial({
        map: starmap,
        side: THREE.BackSide,
        transparent: false,
        opacity: 1,
    })
);

const latlon_lines = new THREE.Group();
for (let deg = 0; deg < 180; deg += 10) latlon_lines.add(circle(false, deg));
for (let deg = -80; deg < 90; deg += 10) latlon_lines.add(circle(true, deg));
latlon_lines.visible = false;

scene.add(starfield);
scene.add(waterMesh);
earth.add(latlon_lines);
scene.add(earth);

const sun = new THREE.PointLight(0xffffff, 10, 1000, 1);
sun.position.x = 10;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 2));

function reset3D() {
    gp_vectors.forEach(line => scene.remove(line));
    gp_vectors.splice(0);
}

function latlon_vector(latlon, scale = false) {
    const vec = scaleVector((scale === false) ? earth_display_radius : scale, toCartesian(latlon));
    return new THREE.Vector3(vec.x, vec.z, -vec.y);
}

function draw_fix(fix, worksheet) {
    reset3D();

    starfield.rotation.y = -fix.gha * radian;

    const observer = latlon_vector(fix);
    const observer2 = latlon_vector(fix, 1.1 * earth_display_radius);

    const observer_GP = rod(origin, observer2, colors[5]);
    scene.add(observer_GP);
    gp_vectors.push(observer_GP);

    worksheet.forEach((obj, idx) => {
        const lm = obj.type == 'landmark';
        const vec = latlon_vector(obj, lm ? 1.1 * earth_display_radius : star_distance);
        const arrow1 = rod(origin, vec, colors[idx]);
        scene.add(arrow1);
        gp_vectors.push(arrow1);
        if (!lm) {
            const arrow2 = rod(observer, vec, colors[idx]);
            scene.add(arrow2);
            gp_vectors.push(arrow2);
        }
        const r_circle = earth_display_radius * cos(obj.angle * radian);
        const geom = new THREE.CylinderGeometry(r_circle, r_circle, 0, 360, 1, true);
        const mat = new THREE.MeshBasicMaterial({
            color: colors[idx],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            wireframe: true,
            wireframeLinewidth: 4,
        });
        const cone = new THREE.Mesh(geom, mat);
        let h = sin(obj.angle * radian);
        if (lm) h /= 1.1;
        else h *= earth_display_radius / star_distance;
        cone.position.x = h * vec.x;
        cone.position.y = h * vec.y;
        cone.position.z = h * vec.z;
        cone.rotation.z = (-90 + obj.lat) * radian;
        cone.rotation.y = obj.lon * radian;
        scene.add(cone);
        gp_vectors.push(cone);
    });
}

function init3D() {
    const app_state = window.app_state;
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5 * star_distance);
    camera.position.set(7, 7, 7);
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

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enablePan = false;
    orbitControls.minDistance = earth_display_radius * 1.5;
    orbitControls.maxDistance = star_distance * 3;

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    app_state.water = water;
    app_state.skymap = starfield;
    app_state.constellations = { a: starmap, b: starsky };
    app_state.latlon_lines = latlon_lines;
    app_state.draw_fix = draw_fix;

    function reanimate() {
        orbitControls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(reanimate);
    };
    requestAnimationFrame(reanimate);
}

export {
    init3D,
    reset3D,
}