// SPDX-License-Identifier: LGPL-3.0-only

import { Address } from "./postoffice.js"
import { Message } from "./message.js"

export class ActorService {
    constructor(scheduler, actor) {
        this.scheduler = scheduler
        this.actor = actor
    }

    send(to, messagebody) {
        this.scheduler.deliver(new Message(this.actor.address, to, messagebody))
    }
}

export class Scheduler {
    constructor(actors = []) {
        this.messagequeue = []
        this.actorcache = new Map()
        this.actors = []
        actors.forEach(a => this.schedule(a))
    }

    schedule(actor) {
        this.actors.push(actor)
        actor.service = new ActorService(this, actor)
        actor.address = new Address()
        this.actorcache.set(actor.address.toString(), actor)
        actor.onschedule()
    }

    deliver(message) {
        this.messagequeue.push(message) // local-only delivery
    }

    step() {
        const message = this.messagequeue.pop()
        const actor = this.actorcache.get(message.target.toString())
        if (actor) {
            actor.onmessage(message.body)
        } else {
            console.log("invalid recipient for message", message)
        }
    }

    run(message=null) {
        if (message) {
            this.deliver(message)
        }
        while (this.messagequeue.length) {
            this.step()
        }
    }
}