// SPDX-License-Identifier: LGPL-3.0-only

const encoder = new TextEncoder()

export class Msg {
    constructor(sender, target, body) {
        this.sender = sender
        this.target = target
        this.body = body
    }

    sendto(socket) {
        const header = `Msg{${this.body.constructor.name}}`
        const headerBytes = encoder.encode(header)
        const zero = new Uint8Array([0])
        const msgBytes = msgpack.serialize(this)
        socket.send(headerBytes)
        socket.send(zero)
        socket.send(msgBytes)
    }
}