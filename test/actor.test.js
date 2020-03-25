// SPDX-License-Identifier: LGPL-3.0-only

import {Actor} from "../src/actor.js"
import {Scheduler} from "../src/scheduler.js"

QUnit.test("Actor address", assert => {
  const actor = new Actor()
  assert.equal(actor.address, null)
  const scheduler = new Scheduler([actor])
  assert.equal(typeof actor.address, "object")
  assert.equal(typeof actor.address.box, "number")
})


const MESSAGE_TEXT = "Test Message"
const TESTMESSAGE_VAL = 42
class TestMessage {
  constructor(value) {
    this.value = value
  }
}

class TestActor extends Actor {
  onschedule() {
    this.service.send(this.address, MESSAGE_TEXT)
  }

  onString = (message) => {
    this.receivedStr = message
    this.service.send(this.address, new TestMessage(TESTMESSAGE_VAL))
  }

  onTestMessage = (message) => {
    this.receivedTestMessage = message
  }
}

QUnit.test("Actor messaging", assert => {
  const actor = new TestActor()
  const scheduler = new Scheduler([actor])
  scheduler.run()
  assert.equal(actor.receivedStr, MESSAGE_TEXT)
  assert.deepEqual(actor.receivedTestMessage, new TestMessage(TESTMESSAGE_VAL))
})
