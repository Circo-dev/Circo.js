// SPDX-License-Identifier: LGPL-3.0-only

import {Actor} from "../src/core/actor.js"
import {Scheduler} from "../src/core/scheduler.js"
import {TestActor,TestMessage,MESSAGE_TEXT,TESTMESSAGE_VAL} from "./testtypes.js"

QUnit.test("Actor address", async assert => {
  const actor = new Actor()
  assert.equal(actor.address, null)
  const scheduler = new Scheduler()
  await scheduler.init([actor])
  assert.equal(typeof actor.address, "object")
  assert.equal(typeof actor.address.box, "number")
})

QUnit.test("Actor messaging", async assert => {
  const actor = new TestActor()
  const scheduler = new Scheduler()
  await scheduler.init([actor])
  scheduler.run()
  assert.equal(actor.receivedStr, MESSAGE_TEXT)
  assert.deepEqual(actor.receivedTestMessage, new TestMessage(TESTMESSAGE_VAL))
})
