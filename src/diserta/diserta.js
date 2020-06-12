// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js'
import { Scheduler } from "../core/scheduler.js"
import { MonitorClient } from "./monitor.js"
import { PerspectiveView, registerActor } from "./viewer.js"
import "./watch.js"
import { filterfn } from "./filter.js"
import "./filtercomponent.js"
import { registerMsg } from "../core/msg.js"

const ITEMS_PER_NODE = 1000
const RED_AFTER = ITEMS_PER_NODE * 0.95 - 1
const SPHERESCALE_FACTOR = 1 / ITEMS_PER_NODE / 2

const nonimportantDescriptor = {
    geometry: new THREE.TetrahedronBufferGeometry(4, 0),
    color: 0xa0a0a0
}

registerActor("Main.SearchTreeTest.TreeNode{UInt32}",  {
    geometry: new THREE.TetrahedronBufferGeometry(10, 2),
    scale: function(actor) {
        if (actor.extra.left) {
            return { x: 0.4 , y: 0.5, z: 0.4 }
        } else {
            return { x: 0.2 + actor.extra.size * SPHERESCALE_FACTOR , y: 0.2 + actor.extra.size * SPHERESCALE_FACTOR, z: 0.2 + actor.extra.size * SPHERESCALE_FACTOR }
        }
    },
    color: function(actor) {
        return actor.extra.size < RED_AFTER ? 0x389826 : (actor.extra.left ? 0x9558b2 : 0xcb3c33)
    }
})

registerActor("Main.LinkedListTest.ListItem{Float64}",  {
    geometry: new THREE.BoxBufferGeometry(10, 10, 10)
})

registerActor("CircoCore.MonitorActor{MonitorService}",  {
    geometry: new THREE.BoxBufferGeometry(5, 5, 5),
    scale: actor => {
        const plussize = actor.extra.actorcount * 0.00002
        // Works only for origo-centered setups:
        return { x: 1 + plussize * Math.abs(actor.y + actor.z), y: 1 + plussize * Math.abs(actor.x + actor.z), z: 1 + plussize * Math.abs(actor.x + actor.y)}
    }
})

registerActor("CircoCore.MigrationHelper", nonimportantDescriptor)
registerActor("ClusterActor", nonimportantDescriptor)
registerActor("EventDispatcher", nonimportantDescriptor)

class Stop {
    constructor() { this.a=42 }
}
registerMsg("CircoCore.Debug.Stop", Stop, { ui: true })
class Step {
    constructor() { this.a=42 }
}
registerMsg("CircoCore.Debug.Step", Step, { ui: true })

class Run {
    constructor() { this.a=42 }
}
registerMsg("CircoCore.Debug.Run", Run, { ui: true })

class RunSlow {
    constructor() {
        this.a=42
    }
}
registerMsg("Main.SearchTreeTest.RunSlow", RunSlow, { ui: true })
class RunFast {
    constructor() {
        this.a=42
    }
}
registerMsg("Main.SearchTreeTest.RunFast", RunFast, { ui: true })

let view = new PerspectiveView()

function updatefilter(newvalue) {
    view.setfilter(filterfn(newvalue))
}

function initfilter() {
    document.getElementById("filter").addEventListener("filterinput", e => {
        updatefilter(e.detail.value)
    })
}

async function createmonitor(view, port) {
    const monitor = new MonitorClient()
    const scheduler = new Scheduler("ws://" + window.location.hostname + ":" + port)
    await scheduler.init([monitor])
    monitor.setview(view)
    return {monitor, scheduler}
}

async function start() {
    initfilter()
    const schedulers = []
    try {
        let port = 2497
        while (true) {
            const {monitor, scheduler} = await createmonitor(view, port)
            schedulers.push(scheduler)
            port = port + 1
        }
    } catch (e) {
        if (!schedulers.length) {
            document.getElementById("fatal").textContent = "Unable to connect to backend actor system. Please reload to try again."
            console.error("Websocket error:", e)    
        }
    }
    schedulers.map(scheduler => scheduler.run())
}

start()
