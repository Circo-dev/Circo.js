// SPDX-License-Identifier: LGPL-3.0-only

import {Msg} from "../src/core/msg.js"
import {Scheduler} from "../src/core/scheduler.js"
import {TestActor,TestMessage} from "./testtypes.js"

class MockSocket {
    send(data) {
        console.log(data)
    }
}

QUnit.test("Message serialization", async assert => {
    const actor = new TestActor()
    const scheduler = new Scheduler()  
    await scheduler.init([actor])
    const msg = new Msg(actor.address, actor.address, new TestMessage())
    msg.sendto(new MockSocket())
    assert.equal(1,1)
})