// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from "three"
import { OrbitControls } from "three-orbitcontrols"
import { TrackballControls } from "three-trackballcontrols"
import { EffectComposer } from "three-effectcomposer"
import { RenderPass } from "three-renderpass"
import { OutlinePass } from "three-outlinepass"
import { thloggler } from "../core/util.js"
import { dist, onpath } from "./helpers/filterlib.js"
import { getactor } from "./filter.js"

const AUTO_ROTATE = false
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
        geometry: new THREE.BoxBufferGeometry(1, 1, 1),
    }
}

const actortypes = new Map()

export function registerActor(typeName, descriptor) {
    if (descriptor instanceof THREE.BufferGeometry) {
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
        this.edgefilterfn = null
        this.mousepos = new THREE.Vector2()
        this.downpos = new THREE.Vector2(-1, -1)
        this.actorviews = new Map()
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

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000000)
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
        let actorview = this.actorviews.get(actor.box)
        const descriptor = actortypes.get(actor.typename)
        if (!descriptor) {
            this.loadDescriptor(actor)
            return
        }
        if (!actorview) {
            actorview = new THREE.Mesh(descriptor.geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }))
            actorview.matrixAutoUpdate = false;
            this.scene.add(actorview)
            this.actorviews.set(actor.box, actorview)
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

    isedgevisible(src, dst, edge, srcvisible, dstvisible) {
        try {
            return this.edgefilterfn ? this.edgefilterfn(src, dst, edge, srcvisible, dstvisible) : true
        } catch (e) {
            thloggler()("Exception while evaulating edge filter:", e) // TODO: output to screen
            this.edgefilterfn=()=>true
            return false
        }
    }

    drawedge(src, dst, edgename) {
        const srcactor = src.actor
        const dstactor = dst.actor
        const edgeid = srcactor.box + dstactor.box
        let edge = this.edges.get(edgeid)
        const points = [new THREE.Vector3(srcactor.x, srcactor.y, srcactor.z), new THREE.Vector3(dstactor.x, dstactor.y, dstactor.z)]
        if (!edge) {
            const geometry = new THREE.BufferGeometry().setFromPoints( points )
            edge = new THREE.Line( geometry, new THREE.LineBasicMaterial( {
                linewidth: 2,
                 color: srcactor._monitorbox === dstactor._monitorbox ? INSCHEDULER_EDGE_COLOR : INTERSCHEDULER_EDGE_COLOR
                }))
            this.scene.add(edge)
            this.edges.set(edgeid, edge)
        } else {
            edge.geometry = new THREE.BufferGeometry().setFromPoints( points )
            edge.material.color.setHex(srcactor._monitorbox === dstactor._monitorbox ? INSCHEDULER_EDGE_COLOR : INTERSCHEDULER_EDGE_COLOR)
        }
        edge.visible = this.isedgevisible(src.actor, dst.actor, edgename, src.visible, dst.visible)
    }

    redrawEdges() {
        const actors = this.actorviews
        for (var src of this.actorviews.values()) {
            if (!src.actor.extra) return
            for (const [edgename, val] of Object.entries(src.actor.extra)) {
                const dst = actors.get(val)
                if (dst) {
                    this.drawedge(src, dst, edgename)
                }
            }
        }
    }

    outlinedactorviews() {
        const retval = []
        for (let actor of this.actorviews.values()) {
            if (this.pointed && this.pointed.actor._monitorbox === actor.actor._monitorbox) {
                retval.push(actor)
            }
        }
        return retval
    }

    redraw() {
        if (this.parentElement.querySelector("#edgecontrol").showedges) {
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

    setActorInterface(actorInterface) {
        if (this.selected && this.selected.actor.box === actorInterface.box) {
            this.selected.messagetypes = actorInterface.messagetypes
        }
    }

    updateWatch() {
        const target = document.getElementById("watch")
        target.selectedactor = this.selected ? this.selected.actor : null
        target.pointedactor = this.pointed ? this.pointed.actor : null
        target.actorviews = this.actorviews
    }

    render() {
        this.highlightPointedObject()
        this.composer.render()
        this.updateWatch()
    }

    createControls() {
        if (AUTO_ROTATE) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement)
            this.controls.autoRotate = true
            this.controls.autoRotateSpeed = 0.4
        } else {
            this.controls = new TrackballControls(this.camera, this.renderer.domElement)
        }
        this.controls.rotateSpeed = 2.0
        this.controls.zoomSpeed = 3.2
        this.controls.panSpeed = 1.0
        this.controls.screenSpacePanning = true
    }

    setfilter(filterfn) {
        this.filterfn = filterfn
    }

    setedgefilter(edgefilterfn) {
        this.edgefilterfn = edgefilterfn
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

