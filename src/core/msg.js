// SPDX-License-Identifier: LGPL-3.0-only

const encoder = new TextEncoder()

export class Msg {
    constructor(sender, target, body) {
        this.sender = sender
        this.target = target
        this.body = body
    }

    sendto(socket) {
        const header = `Msg{${this.body.constructor.typename || this.body.constructor.name}}\n`
        const headerBytes = encoder.encode(header)
        const msgBytes = msgpack.serialize(this)
        const buf = new Uint8Array(headerBytes.length + msgBytes.length + 1)
        buf.set(headerBytes)
        buf.set(msgBytes, headerBytes.length)
        socket.send(buf)
    }
}

export class RegistrationRequest {
    constructor(actoraddr) {
        this.actoraddr = actoraddr
    }
}
RegistrationRequest.typename = "CircoCore.RegistrationRequest"