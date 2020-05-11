// SPDX-License-Identifier: LGPL-3.0-only
import { getactor } from "../filter.js"

class FilterError extends Error {
    constructor(message, ex) {
        super(message)
    }
}

export function dist(actor1, actor2) {
    return Math.sqrt(Math.pow(actor1.x - actor2.x, 2) + Math.pow(actor1.y - actor2.y, 2) + Math.pow(actor1.z - actor2.z, 2))
}

function onpathimpl(actor1, actor2, path, limit, step) {// TODO speed up circular references
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
            if (next && onpathimpl(next, actor2, path, limit, step + 1)) {
                return true
            }    
        }
    }
    return false
}

export function onpath(actor1, actor2, path=[/.*/], limit=8) {// TODO speed up circular references
    if (typeof actor1 !== "object" || !actor1.box) {
        throw new FilterError("First argument provided is not an actor: " + actor1)
    }
    if (typeof actor2 !== "object" || !actor2.box) {
        throw new FilterError("Second argument provided is not an actor: " + actor2)
    }
    if (!Array.isArray(path)) {
        if (typeof path === "object" && path.constructor.name === "RegExp") {
            path = [path]
        } else {
            throw new FilterError("Path must be a single RegExp or an array of them. Got " + path)
        }
    }
    if (limit < 0 || limit > 18) {
        throw new FilterError("Invalid limit (must be nonnegative, max 18): " + limit)
    }
    return onpathimpl(actor1, actor2, path, limit, 0)
}