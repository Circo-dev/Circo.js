// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js';
import { OrbitControls } from "../../web_modules/three/examples/jsm/controls/OrbitControls.js"

let container, controls;
let camera, scene, raycaster, renderer;

let mouse = new THREE.Vector2(), intersected;

init();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    const geometry = new THREE.BoxBufferGeometry(20, 20, 20);

    for (let i = 0; i < 2000; i++) {
        const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));

        object.position.x = Math.random() * 800 - 400;
        object.position.y = Math.random() * 800 - 400;
        object.position.z = Math.random() * 800 - 400;

        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() + 0.5;
        object.scale.y = Math.random() + 0.5;
        object.scale.z = Math.random() + 0.5;

        scene.add(object);
    }

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    createControls(camera);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener("pointerdown", onPointerdown, false)
    document.addEventListener("pointerup", onPointerup, false)
    window.addEventListener('resize', onResize, false);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

let downpos = new THREE.Vector2(-1, -1)
function onPointerdown(event) {
    downpos.x = event.clientX
    downpos.y = event.clientY
}

let lookinterval = 0
function onPointerup(event) {
    if (downpos.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 5) {
        return
    }
    if (intersected) {
        let stepidx = 0
        const stepcount = 30
        const targetpos = new THREE.Vector3().copy(intersected.position)
        const distance = camera.position.distanceTo(targetpos)
        const posdiff = new THREE.Vector3().copy(targetpos).sub(camera.position)
        const posdiffafteranim = new THREE.Vector3().copy(posdiff).divideScalar(distance / 250)
        const posstep = posdiff.sub(posdiffafteranim).divideScalar(stepcount)
        let stepunit = new THREE.Vector3().copy(targetpos).sub(controls.target).divideScalar(stepcount)
        if (lookinterval) clearInterval(lookinterval)
        lookinterval = setInterval(() => {
            controls.target.add(stepunit)
            camera.position.add(posstep)
            if (++stepidx >= stepcount) {
                clearInterval(lookinterval)
            }
        }, 16)
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function highlightPointedObject() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        if (intersected != intersects[0].object) {
            if (intersected) intersected.material.emissive.setHex(intersected.currentHex);
            intersected = intersects[0].object;
            intersected.currentHex = intersected.material.emissive.getHex();
            intersected.material.emissive.setHex(0xff0000);
        }
    } else {
        if (intersected) intersected.material.emissive.setHex(intersected.currentHex);
        intersected = null;
    }
}

function render() {
    highlightPointedObject()
    renderer.render(scene, camera);
}

function createControls(camera) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.keys = [65, 83, 68];
}
