// SPDX-License-Identifier: LGPL-3.0-only

import { Actor } from "../src/core/actor.js"
import { Scheduler } from "../src/core/scheduler.js"
import { ActorRequest, ActorResponse } from "../src/core/token.js"

class TestRequest extends ActorRequest {
    constructor(requestid) {
        super()
        this.requestid = requestid
    }
}

class TestResponse extends ActorResponse {
    constructor(request) {
        super(request)
        this.requestid = request.id
    }
}

const MSG_COUNT = 10
class TokenTestActor extends Actor {
    constructor(assert) {
        super()
        this.done = assert.async(MSG_COUNT / 2)
        this.assert = assert
    }
    onschedule() {
        for (let i = 0; i < MSG_COUNT; i++) {
            this.service.send(this.address, new TestRequest(i))
        }
    }

    onTestRequest = (request) => {
        if (request.requestid % 2 === 1) {
            this.service.send(this.address, new TestResponse(request))
        }
    }

    onTestResponse = (response) => {
    }

    onTimeout = (timeout) => {
        console.log(timeout)
        this.done()
    }
}

QUnit.test("Token timeout", async assert => {
    const actor = new TokenTestActor(assert)
    const scheduler = new Scheduler()
    await scheduler.init([actor])
    scheduler.run()
    assert.expect(0)
})
