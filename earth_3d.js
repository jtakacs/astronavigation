import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { scale, to_cartesian, sub, earth_radius_in_meters, radian } from './vector.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

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
//scene.add(new THREE.AxesHelper(100));
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
        const sc = 1.001;
        ellipse.scale.set(sc, sc, sc);
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
earth.layers.enableAll();

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
    gp_vectors.forEach(item => scene.remove(item));
    gp_vectors.splice(0);
}

function latlon_vector(latlon, sc = false) {
    const vec = scale((sc === false) ? earth_display_radius : sc, to_cartesian(latlon));
    return new THREE.Vector3(vec.x, vec.z, -vec.y);
}

function draw_text(pos, text) {
    const star_div = document.createElement('div');
    star_div.className = 'starlabel';
    star_div.textContent = text;
    star_div.style.backgroundColor = 'transparent';
    const star_label = new CSS2DObject(star_div);
    star_label.position.copy(pos);
    star_label.layers.set(1);
    scene.add(star_label);
    gp_vectors.push(star_label);
}

function draw_fix(fix, worksheet) {
    reset3D();
    starfield.rotation.y = -fix.gha * radian;

    const observer = latlon_vector(fix);
    const observer2 = latlon_vector(fix, 1.3 * earth_display_radius);

    const observer_GP = rod(origin, observer2, colors[5]);
    scene.add(observer_GP);
    gp_vectors.push(observer_GP);
    draw_text(observer, 'observer');
    /*
   const k = [2, 1, 0];
   const gp1 = to_cartesian(worksheet[k[0]]);
   const gp2 = to_cartesian(worksheet[k[1]]);
   const gp3 = to_cartesian(worksheet[k[2]]);
   const A = sin(worksheet[k[0]].angle * radian);
   const B = sin(worksheet[k[1]].angle * radian);
   const C = sin(worksheet[k[2]].angle * radian);
   const n1 = sub(scale(B, gp1), scale(A, gp2));
   const n2 = sub(scale(C, gp2), scale(B, gp3));
   const plane1 = new THREE.PlaneHelper(new THREE.Plane(new THREE.Vector3(n1.x, n1.z, -n1.y), 0), 2.2 * earth_display_radius, colors[0]);
   plane1.children[0].material.side = THREE.DoubleSide;
   plane1.children[0].material.opacity = 0.8;
   scene.add(plane1);
   gp_vectors.push(plane1);
   const plane2 = new THREE.PlaneHelper(new THREE.Plane(new THREE.Vector3(n2.x, n2.z, -n2.y), 0), 2.2 * earth_display_radius, colors[1]);
   plane2.children[0].material.side = THREE.DoubleSide;
   plane2.children[0].material.opacity = 0.8;
   scene.add(plane2);
   gp_vectors.push(plane2);
   */

    worksheet.forEach((obj, idx) => {
        const vec = latlon_vector(obj, star_distance);
        // const vec = latlon_vector(obj, 1.1 * earth_display_radius);
        const arrow1 = rod(origin, vec, colors[idx]);
        scene.add(arrow1);
        gp_vectors.push(arrow1);
        /*
        const arrow2 = rod(observer, vec, colors[idx]);
        scene.add(arrow2);
        gp_vectors.push(arrow2);
        */
        draw_text(latlon_vector(obj, earth_display_radius), obj.name);

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
        let h = sin(obj.angle * radian) * earth_display_radius / star_distance;
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
    camera.layers.enableAll();

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

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px';
    document.body.appendChild(labelRenderer.domElement);

    const orbitControls = new OrbitControls(camera, labelRenderer.domElement);
    orbitControls.enablePan = false;
    orbitControls.minDistance = earth_display_radius * 1.5;
    orbitControls.maxDistance = star_distance * 3;

    window.addEventListener('resize', function () {
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        camera.aspect = ww / wh;
        camera.updateProjectionMatrix();
        renderer.setSize(ww, wh);
        labelRenderer.setSize(ww, wh);
    });

    app_state.water = water;
    app_state.skymap = starfield;
    app_state.constellations = { a: starmap, b: starsky };
    app_state.latlon_lines = latlon_lines;
    app_state.draw_fix = draw_fix;
    app_state.toggle_labels = function () {
        camera.layers.toggle(1);
    };

    function reanimate() {
        orbitControls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        requestAnimationFrame(reanimate);
    };
    requestAnimationFrame(reanimate);
}

export {
    init3D,
    reset3D,
};