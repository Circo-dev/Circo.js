// SPDX-License-Identifier: LGPL-3.0-only

import "./viewer.js"
import { Scheduler } from "../core/scheduler.js"
import { MonitorClient } from "./monitor.js"

let scheduler = null
async function start() {
    const monitor = new MonitorClient()
    scheduler = new Scheduler()
    await scheduler.init([monitor])
    scheduler.run()    
}

start()
