// SPDX-License-Identifier: LGPL-3.0-only

import { Actor } from "../src/core/actor.js"
import { Scheduler } from "../src/core/scheduler.js"
import { PeerListRequest } from "../src/diserta/cluster.js"

class RemoteTestActor extends Actor {
    onschedule() {
        this.service.register(this)
    }

    onRegistered = message => {
        console.log("Registered", message)
        this.service.querymastername("cluster")
    }

    onNameResponse = response => {
        console.log(response)
        this.clusteraddr = response.handler
        this.service.send(this.clusteraddr, new PeerListRequest(this.address))
    }

    onPeerListResponse = response => {
        console.log("Got cluster peer list", response.peers)
    }
}

QUnit.test("Connection", async assert => {
    const actor = new RemoteTestActor()
    const scheduler = new Scheduler()
    await scheduler.init([actor])
    assert.equal(1, 1)
})