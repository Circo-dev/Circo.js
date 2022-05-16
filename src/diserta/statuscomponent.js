import {Component} from "./helpers/component.js"
import {html, css} from "lit"

class Status extends Component {
  static get properties() {
    return {
        schedulercount: { type: Number }
    }
  }

  static get styles() {
    return css`
        .container {
          position: absolute;
          bottom: 2px;
          right: 4px;
          text-shadow: 1px 1px white;
        }
    `;
  }

  constructor() {
    super()
  }

  render() {
    return html`<div class="container">
      ${this.schedulercount ? this.schedulercount : "no"} schedulers
    </div>
`
  }
}

customElements.define("diserta-status", Status)
