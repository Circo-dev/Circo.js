// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js'
import { OrbitControls } from "../../web_modules/three/examples/jsm/controls/OrbitControls.js"

const defaultdescriptor = {
    geometry: new THREE.BoxBufferGeometry(20, 20, 20),
    scale: {
        x: 1,
        y: 1,
        z: 1,
    },
    rotation: {
        x: 0,
        y: 0,
        z: 0
    }
}
const actortypes = new Map()

export function registerActor(typeName, descriptor) {
    if (descriptor instanceof THREE.BufferGeometry || descriptor instanceof THREE.Geometry) {
        descriptor = {
            geometry: descriptor
        }
    }
    actortypes.set(typeName, descriptor)
}

export class PerspectiveView {
    constructor(parentElement = document.body) {
        this.parentElement = parentElement
        this.mousepos = new THREE.Vector2()
        this.downpos = new THREE.Vector2(-1, -1)
        this.actors = new Map()
        this.pointed = null
        this.selected = null
        this.lookinterval = 0
        this.init(parentElement)
        this.animate()
    }

    init(parentElement) {
        this.container = document.createElement('div')
        parentElement.appendChild(this.container)

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000)
        this.camera.position.z = 500

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0xf0f0f0)

        const light = new THREE.DirectionalLight(0xffffff, 1)
        light.position.set(0.7, .5, .8).normalize()
        this.scene.add(light)
        const light2 = new THREE.DirectionalLight(0xffffff, 1)
        light2.position.set(-0.7, -.5, -.8).normalize()
        this.scene.add(light2)

        this.raycaster = new THREE.Raycaster()

        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.container.appendChild(this.renderer.domElement)

        this.createControls()
        document.addEventListener('mousemove', this.onMouseMove, false)
        document.addEventListener("pointerdown", this.onPointerdown, false)
        document.addEventListener("pointerup", this.onPointerup, false)
        window.addEventListener('resize', this.onResize, false)
    }

    putActor(actor) {
        let actorview = this.actors.get(actor.box)
        const descriptor = actortypes.get(actor.typename) || defaultdescriptor
        if (!actorview) {
            actorview = new THREE.Mesh(descriptor.geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }))
            actorview.matrixAutoUpdate = false;
            this.scene.add(actorview)
            this.actors.set(actor.box, actorview)
        }
        if (descriptor.position) {
            const pos = typeof descriptor.position === "function" ? descriptor.position(actor) : descriptor.position
            Object.assign(actorview.position, pos)
        } else {
            actorview.position.x = actor.x
            actorview.position.y = actor.y
            actorview.position.z = actor.z
        }
        if (descriptor.rotation) {
            const rotation = typeof descriptor.rotation === "function" ? descriptor.rotation(actor) : descriptor.rotation
            Object.assign(actorview.rotation, rotation)
        }
        if (descriptor.scale) {
            const scale = typeof descriptor.scale === "function" ? descriptor.scale(actor) : descriptor.scale
            Object.assign(actorview.scale, scale)
        }
        if (descriptor.color) {
            const color = typeof descriptor.color === "function" ? descriptor.color(actor) : descriptor.color
            actorview.material.color.setHex(color)
        }
        actorview.actor = actor
        actorview.updateMatrix()
    }

    onResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    onMouseMove = (event) => {
        this.mousepos.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mousepos.y = - (event.clientY / window.innerHeight) * 2 + 1
    }

    onPointerdown = (event) => {
        this.downpos.x = event.clientX
        this.downpos.y = event.clientY
    }

    onPointerup = (event) => {
        if (this.downpos.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 5) {
            return
        }
        if (this.pointed) {
            let stepidx = 0
            const stepcount = 30
            const targetpos = new THREE.Vector3().copy(this.pointed.position)
            const distance = this.camera.position.distanceTo(targetpos)
            const posdiff = new THREE.Vector3().copy(targetpos).sub(this.camera.position)
            const posdiffafteranim = new THREE.Vector3().copy(posdiff).divideScalar(distance / 250)
            const posstep = posdiff.sub(posdiffafteranim).divideScalar(stepcount)
            let stepunit = new THREE.Vector3().copy(targetpos).sub(this.controls.target).divideScalar(stepcount)
            if (this.lookinterval) clearInterval(this.lookinterval)
            this.lookinterval = setInterval(() => {
                this.controls.target.add(stepunit)
                this.camera.position.add(posstep)
                if (++stepidx >= stepcount) {
                    clearInterval(this.lookinterval)
                }
            }, 16)
        }
        this.selected = this.pointed
    }

    animate = () => {
        requestAnimationFrame(this.animate)
        this.controls.update()
        this.render()
    }

    highlightPointedObject() {
        this.raycaster.setFromCamera(this.mousepos, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children)
        if (intersects.length > 0) {
            if (this.pointed != intersects[0].object) {
                if (this.pointed) this.pointed.material.emissive.setHex(this.pointed.currentHex)
                this.pointed = intersects[0].object
                this.pointed.currentHex = this.pointed.material.emissive.getHex()
                this.pointed.material.emissive.setHex(0xff0000)
            }
        } else {
            if (this.pointed) this.pointed.material.emissive.setHex(this.pointed.currentHex)
            this.pointed = null
        }
    }

    updateWatch() {
        const target = document.getElementById("watch")
        if (this.selected) {
             target.actor = this.selected.actor
        } else {
            target.actor = this.pointed ? this.pointed.actor : null
        }
    }

    render() {
        this.highlightPointedObject()
        this.renderer.render(this.scene, this.camera)
        this.updateWatch()
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.rotateSpeed = 1.0
        this.controls.zoomSpeed = 1.2
        this.controls.panSpeed = 0.8
        this.controls.keys = [65, 83, 68]
    }
}

