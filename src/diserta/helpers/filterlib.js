// SPDX-License-Identifier: LGPL-3.0-only
import { getactor } from "../filter.js"

export function dist(actor1, actor2) {
    return Math.sqrt(Math.pow(actor1.x - actor2.x, 2) + Math.pow(actor1.y - actor2.y, 2) + Math.pow(actor1.z - actor2.z, 2))
}

export function inhops(actor1, actor2, limit=8) {
    if (limit === 0 || !actor1 || !actor1.extra) {
        return false
    }
    const boxtofind = actor2.box
    for (let value of Object.values(actor1.extra)) {
        if (value === boxtofind) {
            return true
        }
        const next = getactor(value)
        if (next && inhops(next, actor2, limit - 1)) {
            return true
        }
    }
    return false
}

export function onpath(actor1, actor2, path=[/.*/], limit=8, step=0) {
    if (limit <= step || !actor1 || !actor1.extra) {
        return false
    }
    const directionspec = path[step % path.length]
    const boxtofind = actor2.box
    for (let name of Object.keys(actor1.extra)) {
        if (name.match(directionspec)) {
            const value = actor1.extra[name]
            if (value === boxtofind) {
                return true
            }
            const next = getactor(value)
            if (next && onpath(next, actor2, path, limit, step + 1)) {
                return true
            }    
        }
    }
    return false
}