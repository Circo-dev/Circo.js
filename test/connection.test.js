// SPDX-License-Identifier: LGPL-3.0-only

import { Actor } from "../src/core/actor.js"
import { Scheduler } from "../src/core/scheduler.js"

class RemoteTestActor extends Actor {
    onschedule() {
        this.service.register(this)
    }

    onRegistered(message) {
        console.log("Registered", message)
    }
}

QUnit.test("Connection", async assert => {
    const actor = new RemoteTestActor()
    const scheduler = new Scheduler()
    await scheduler.init([actor])
    assert.equal(1, 1)
})