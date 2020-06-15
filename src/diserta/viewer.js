// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from "../../web_modules/three/build/three.module.js"
import { TrackballControls } from "../../web_modules/three/examples/jsm/controls/TrackballControls.js"
import { EffectComposer } from "../../web_modules/three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "../../web_modules/three/examples/jsm/postprocessing/RenderPass.js"
import { OutlinePass } from "../../web_modules/three/examples/jsm/postprocessing/OutlinePass.js"
import { thloggler } from "../core/util.js"
import { dist, onpath } from "./helpers/filterlib.js"
import { getactor } from "./filter.js"

const SELECTED_COLOR = 0x606060
const INSCHEDULER_EDGE_COLOR = 0xa0a0a0
const INTERSCHEDULER_EDGE_COLOR = 0xf29507

const projections = {
    default: {
        geometry: new THREE.BoxBufferGeometry(20, 5, 5),
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 }
    },
    nonimportant: {
        geometry: new THREE.TetrahedronBufferGeometry(4, 0),
        color: 0xa0a0a0
    }
}

const actortypes = new Map()

export function registerActor(typeName, descriptor) {
    if (descriptor instanceof THREE.BufferGeometry || descriptor instanceof THREE.Geometry) {
        descriptor = {
            geometry: descriptor
        }
    }
    if (typeof descriptor == "string") {
        try {
            descriptor = eval("(" + descriptor + ")")
        } catch (e) {
            console.error(`Cannot evaluate descriptor: ${descriptor} \n`, e)
            descriptor = projections.default
        }
    }
    actortypes.set(typeName, descriptor)
}

export class PerspectiveView {
    constructor(parentElement = document.body) {
        this.parentElement = parentElement
        this.eventhandlers = new Map()
        this.filterfn = null
        this.mousepos = new THREE.Vector2()
        this.downpos = new THREE.Vector2(-1, -1)
        this.actors = new Map()
        this.edges = new Map()
        this.pointed = null
        this.selected = null
        this.lookinterval = 0
        this.light1 = null
        this.light2 = null
        this.init(parentElement)
        this.animate()
    }

    init(parentElement) {
        this.container = document.createElement('div')
        this.container.tabIndex = 0
        parentElement.appendChild(this.container)

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000)
        this.camera.position.x = -400
        this.camera.position.y = 200
        this.camera.position.z = 1400

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0xd0d0d0)

        this.light1 = new THREE.DirectionalLight(0xffffff, 1)
        this.light1.position.set(0.7, .5, .8).normalize()
        this.scene.add(this.light1)
        this.light2 = new THREE.DirectionalLight(0xffffff, 1)
        this.light2.position.set(-0.7, -.5, -.8).normalize()
        this.scene.add(this.light2)

        this.raycaster = new THREE.Raycaster()

        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.container.appendChild(this.renderer.domElement)

        this.composer = new EffectComposer(this.renderer)
        this.composer.addPass(new RenderPass(this.scene, this.camera))
        this.outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), this.scene, this.camera )
        this.outlinePass.edgeStrength = 3
        this.outlinePass.edgeGlow = 1
        this.outlinePass.edgeThickness = 2
        this.outlinePass.visibleEdgeColor.set(0xffffff)
        this.outlinePass.hiddenEdgeColor.set(0x000000)
        this.composer.addPass(this.outlinePass)

        this.createControls()
        this.container.addEventListener('mousemove', this.onMouseMove, false)
        this.container.addEventListener("pointerdown", this.onPointerdown, false)
        this.container.addEventListener("pointerup", this.onPointerup, false)
        this.container.addEventListener("keydown", this.onkeydown, false)
        window.addEventListener('resize', this.onResize, false)
    }

    loadDescriptor(actor) {
        const typename = actor.typename
        if (!this.loadedDescriptors) {
            this.loadedDescriptors = new Set()
        }
        if (!this.loadedDescriptors.has(typename)) {
            actor[Symbol.for("monitor")].requestMonitorProjection(typename)
            this.loadedDescriptors.add(typename)
        }
    }

    putActor(actor) {
        let actorview = this.actors.get(actor.box)
        const descriptor = actortypes.get(actor.typename)
        if (!descriptor) {
            this.loadDescriptor(actor)
            return
        }
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
        
        try {// TODO find a better place for this
            actorview.visible = this.filterfn ? 
            this.filterfn(actor, this.selected ? this.selected.actor : null, this.pointed ? this.pointed.actor : null,
                dist, onpath, getactor) : true
        } catch (e) {
            thloggler()("Exception while evaulating filter:", e) // TODO: output to screen
            this.filterfn=()=>true
        }
        actorview.actor = actor
        actorview.updateMatrix()
    }

    redrawEdges() {
        const actors = this.actors
        for (var source of this.actors.values()) {
            if (!source.actor.extra) return
            const box = source.actor.box
            for (var val of Object.values(source.actor.extra)) {
                const target = actors.get(val)
                if (target) {
                    const targetactor = target.actor
                    let edge = this.edges.get(box + val)
                    const points = [new THREE.Vector3(source.actor.x, source.actor.y, source.actor.z), new THREE.Vector3(targetactor.x, targetactor.y, targetactor.z)]
                    if (!edge) {
                        const geometry = new THREE.BufferGeometry().setFromPoints( points )
                        edge = new THREE.Line( geometry, new THREE.LineBasicMaterial( {
                            linewidth: 2,
                             color: source.actor._monitorbox === target.actor._monitorbox ? INSCHEDULER_EDGE_COLOR : INTERSCHEDULER_EDGE_COLOR
                            }))
                        this.scene.add(edge)
                        this.edges.set(box + val, edge)
                    } else {
                        edge.geometry = new THREE.BufferGeometry().setFromPoints( points )
                        edge.material.color.setHex(source.actor._monitorbox === target.actor._monitorbox ? INSCHEDULER_EDGE_COLOR : INTERSCHEDULER_EDGE_COLOR)
                    }
                    edge.visible = source.visible && target.visible
                }
            }
        }
    }

    outlinedactorviews() {
        const retval = []
        for (let actor of this.actors.values()) {
            if (this.pointed && this.pointed.actor._monitorbox === actor.actor._monitorbox) {
                retval.push(actor)
            }
        }
        return retval
    }

    redraw() {
        if (this.parentElement.querySelector("#filter").showedges) {
            this.redrawEdges()
        } else {
            for (var edge of this.edges.values()) {
                this.scene.remove(edge)
            }
            this.edges.clear()
        }
        this.outlinePass.selectedObjects = this.parentElement.querySelector("#filter").glow ? this.outlinedactorviews() : []
    }

    onResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.composer.setSize(window.innerWidth, window.innerHeight)
    }

    onMouseMove = (event) => {
        this.mousepos.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mousepos.y = - (event.clientY / window.innerHeight) * 2 + 1
    }

    onPointerdown = (event) => {
        this.downpos.x = event.clientX
        this.downpos.y = event.clientY
        this.container.focus()
    }

    onPointerup = (event) => {
        if (this.downpos.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 5) {
            return
        }
        if (this.pointed && this.selected === this.pointed) {
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
        this.select(this.pointed)
    }

    step(length=1) {
        const direction = new THREE.Vector3().copy(this.controls.target).sub(this.camera.position).normalize().multiplyScalar(40 * length)
        this.camera.position.add(direction)
        this.controls.target.add(direction)
    }

    onkeydown = event => {

        switch (event.code) {
            case "KeyW":
            case "KeyI":
                this.step()
                break
            case "KeyS":
            case "KeyK":
                this.step(-1)
            default:
                break
        }
    }

    select(obj) {
        if (this.selected) this.selected.material.emissive.setHex(this.selected.origHex)
        this.selected = obj
        if (obj) obj.material.emissive.setHex(SELECTED_COLOR)
        if (obj && obj.actor) {
            this.fire("actorselected", obj.actor)
        }
    }

    animate = () => {
        requestAnimationFrame(this.animate)
        this.controls.update()
        this.render()
    }

    highlightPointedObject() {
        this.raycaster.setFromCamera(this.mousepos, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children)
        let firstvisibleidx = 0
        while (firstvisibleidx < intersects.length && (!intersects[firstvisibleidx].object.visible || !intersects[firstvisibleidx].object.actor)) {
            firstvisibleidx++
        }
        if (firstvisibleidx < intersects.length) {
            if (this.pointed != intersects[firstvisibleidx].object) {
                if (this.pointed) {
                    this.pointed.material.emissive.setHex(this.pointed === this.selected ? SELECTED_COLOR : this.pointed.origHex)
                }
                this.pointed = intersects[firstvisibleidx].object
                if (this.pointed !== this.selected) this.pointed.origHex = this.pointed.material.emissive.getHex()
                this.pointed.material.emissive.setHex(0xff0000)
            }
        } else {
            if (this.pointed) this.pointed.material.emissive.setHex(this.pointed === this.selected ? SELECTED_COLOR : this.pointed.origHex)
            this.pointed = null
        }
    }

    setActorInterface(actorInterfaceResponse) {
        if (this.selected && this.selected.actor.box === actorInterfaceResponse.box) {
            this.selected.messagetypes = actorInterfaceResponse.messagetypes
        }
    }

    updateWatch() {
        const target = document.getElementById("watch")
        if (this.selected) {
             target.actor = this.selected.actor
             target.messagetypes = this.selected.messagetypes
        } else {
            target.actor = this.pointed ? this.pointed.actor : null
            target.messagetypes = null
        }
    }

    render() {
        this.highlightPointedObject()
        //this.renderer.render(this.scene, this.camera)
        this.composer.render()
        this.updateWatch()
    }

    createControls() {
        this.controls = new TrackballControls(this.camera, this.renderer.domElement)
        this.controls.rotateSpeed = 2.0
        this.controls.zoomSpeed = 3.2
        this.controls.panSpeed = 1.0
        this.controls.screenSpacePanning = true
    }

    setfilter(filterfn) {
        this.filterfn = filterfn
    }

    addEventListener(eventname, handlerfn) {
        const handlers = this.eventhandlers.get(eventname) || new Array()
        handlers.push(handlerfn)
        this.eventhandlers.set(eventname, handlers)
    }

    fire(eventname, data) {
        const handlers = this.eventhandlers.get(eventname)
        if (handlers) {
            handlers.forEach(handler => handler(data))
        }
    }
}

