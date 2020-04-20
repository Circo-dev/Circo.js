// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js'
import { OrbitControls } from "../../web_modules/three/examples/jsm/controls/OrbitControls.js"

const geometry = new THREE.BoxBufferGeometry(20, 20, 20)

export class PerspectiveView {
    constructor(parentElement=document.body) {
        this.parentElement=parentElement
        this.mousepos = new THREE.Vector2()
        this.downpos = new THREE.Vector2(-1, -1)
        this.actors = new Map()
        this.intersected = null
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
        light.position.set(1, 1, 1).normalize()
        this.scene.add(light)
        
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
        if (!actorview) {
            actorview = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }))
            actorview.rotation.y = Math.random() * 2 * Math.PI
            actorview.rotation.x = Math.random() * 2 * Math.PI
            actorview.rotation.z = Math.random() * 2 * Math.PI
    
            actorview.scale.x = Math.random() + 0.5
            actorview.scale.y = Math.random() + 0.5
            actorview.scale.z = Math.random() + 0.5
            actorview.matrixAutoUpdate  = false;
            this.scene.add(actorview)
            this.actors.set(actor.box, actorview)
        }
                
        actorview.position.x = actor.x
        actorview.position.y = actor.y
        actorview.position.z = actor.z
        actorview.updateMatrix()
    }

    
    createActorObject(actor) {

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
        if (this.intersected) {
            let stepidx = 0
            const stepcount = 30
            const targetpos = new THREE.Vector3().copy(this.intersected.position)
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
            if (this.intersected != intersects[0].object) {
                if (this.intersected) this.intersected.material.emissive.setHex(this.intersected.currentHex)
                this.intersected = intersects[0].object
                this.intersected.currentHex = this.intersected.material.emissive.getHex()
                this.intersected.material.emissive.setHex(0xff0000)
            }
        } else {
            if (this.intersected) this.intersected.material.emissive.setHex(this.intersected.currentHex)
            this.intersected = null
        }
    }
    
    render() {
        this.highlightPointedObject()
        this.renderer.render(this.scene, this.camera)
    }
    
    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.rotateSpeed = 1.0
        this.controls.zoomSpeed = 1.2
        this.controls.panSpeed = 0.8
        this.controls.keys = [65, 83, 68]
    }
}

