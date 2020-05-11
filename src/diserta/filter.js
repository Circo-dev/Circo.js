// SPDX-License-Identifier: LGPL-3.0-only

const actormap = new Map()
export function setactors(actors) {
    actormap.clear()
    for (var actor of actors) {
        actormap.set(actor.box, actor)
    }
}

export function getactor(actorid) {
    return actormap.get(actorid)
}

const alwaystrue = () => true
export function filterfn(source) {
    if (source === "") {
        return alwaystrue
    } 
    const fullsource = '"use strict";return (!selected || selected.box == me.box || ' + source + ')'
    return Function("me", "selected", "pointed", "dist", "onpath", fullsource)
}