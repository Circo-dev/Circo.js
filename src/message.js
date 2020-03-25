// SPDX-License-Identifier: LGPL-3.0-only

export class Message {
    constructor(sender, target, body) {
        this.sender = sender
        this.target = target
        this.body = body
    }
}