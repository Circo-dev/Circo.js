// SPDX-License-Identifier: LGPL-3.0-only

const actormap = new Map()
export function setactors(monitor, actors) {
    // TODO periodically remove inactive (dead) actors
    for (var actor of actors) {
        actormap.set(actor.box, actor)
    }
}

export function getactor(actorid) {
    return actormap.get(actorid)
}

const alwaystrue = () => true
export function filterfn(source, argnames) {
    if (source === "") {
        return alwaystrue
    } 
    const fullsource = '"use strict";return !!(' + source + ')'
    try {
        return Function(...argnames, fullsource)
    } catch (e) {
        console.error("Error creating filter fn", e)
        return alwaystrue
    }
    
}
