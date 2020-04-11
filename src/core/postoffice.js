// SPDX-License-Identifier: LGPL-3.0-only

import { unmarshal } from "./msg.js"

export const LOCALPOSTCODE="L"
export const MASTERPOSTCODE="Master"

export class Addr {
    static generateId() {
        if (window.crypto && window.crypto.getRandomValues) {
            const buf = new Uint32Array(2);
            window.crypto.getRandomValues(buf)
            return buf[0] * Math.pow(2, 20) + buf[1]; // TODO use 64 bit integers instead of 52, overcome js Number limitation
        }
        console.log("No crypto.getRandomValues(), falling back to Math.random()")
        return Math.round(Math.random() * Math.pow(2, 52))
    }

    constructor(postcode=LOCALPOSTCODE, box) {
        this.postcode = postcode
        this.box = typeof box !== "undefined" ? box : Addr.generateId()
    }
}

export class PostOffice {
    constructor(masterurl, scheduler) {
        this.masterurl = masterurl
        this.masteraddr = new Addr(MASTERPOSTCODE, 0)
        this.scheduler = scheduler
        this.queue = []
        this.socket = new WebSocket(masterurl)
        this.socket.onmessage = this._onmessage
    }

    opened() {
        if (this.socket.readyState === WebSocket.OPEN) {
            return true
        }
        if (this.socket.readyState === WebSocket.CLOSING || this.socket.readyState === WebSocket.CLOSED) {
            return false
        }
        return new Promise((resolve, reject) => {
            this.socket.onopen = () => resolve(true)
        })
    }

    _onmessage = (event) => {
        console.log(event.data)
        if (!this.scheduler) return
        unmarshal(event.data).then((unmarshaled) => {
            console.log(unmarshaled)
            this.scheduler.run(unmarshaled)
        })
    }

    send(msg) {
        msg.sendto(this.socket)
    }

    shutdown() {
        try {
            this.socket.close()
        } catch (e) {
            console.log("Exception while closing websocket", e)
        }
    }
}