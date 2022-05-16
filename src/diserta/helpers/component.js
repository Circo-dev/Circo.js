import {LitElement} from "lit"

export class Component extends LitElement {
  constructor() {
    super()
  }
  
  el(id) {
    return this.renderRoot.getElementById(id)
  }

  val(id, propertyName = "value") {
    const el = this.el(id) || this
    return el[propertyName]
  }
}
