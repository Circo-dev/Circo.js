import {Actor} from "../src/core/actor.js"

export const MESSAGE_TEXT = "Test Message"
export const TESTMESSAGE_VAL = 42

export class TestMessage {
  constructor(value = TESTMESSAGE_VAL) {
    this.value = value
  }
}

export class TestActor extends Actor {
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
  