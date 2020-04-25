// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js'
import { Scheduler } from "../core/scheduler.js"
import { MonitorClient } from "./monitor.js"
import { PerspectiveView, registerActor } from "./viewer.js"

registerActor("Main.SearchTreeTest.TreeNode{UInt16}",  {
    geometry: new THREE.TetrahedronBufferGeometry( 20, 0 ),
    scale: (actor) => {
        const size = 0.2 + (actor.extra.left ? 1 : 0) + (actor.extra.right ? 1 : 0)
        return { x: size, y: size, z: 1 }
    }
})

let scheduler = null
async function start() {
    const monitor = new MonitorClient()
    const view = new PerspectiveView()
    monitor.setView(view)
    scheduler = new Scheduler()
    await scheduler.init([monitor])
    scheduler.run()    
}

start()
