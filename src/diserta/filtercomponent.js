import {Component} from "./helpers/component.js"
import {html, css} from "../../../../web_modules/lit-element.js"

class Filter extends Component {

  static get properties() {
    return {
      actorfilter: { type: String },
      showedges: { type: Boolean }
    }
  }

  static get styles() {
    return css`
      .container { position: absolute; top: 10px; left: 10px;}
      .filterinput { font-size: 110%; width: 600px; opacity: 0.8}
    `;
  }

  constructor() {
    super()
    this.actorfilter = "!selected || selected.box == me.box || onpath(me, selected, [/left|right/])  || onpath( selected, me, [/sibling/]) || onpath( selected, me, [/left|right/]) "
    this.showedges = false
  }

  firstUpdated() {
    this.dispatchActorfilter()
  }

  dispatchActorfilter = value => {
    this.dispatchEvent(new CustomEvent('filterinput', { detail: { value: this.actorfilter }, bubbles: true, composed: true }));
  }

  handleinput = e => {
    this.actorfilter = e.target.value
    this.dispatchActorfilter()
  }

  dispatchShowedges = value => {
    this.dispatchEvent(new CustomEvent('showedgeschanged', { detail: { value: this.showedges }, bubbles: true, composed: true }));
  }

  handleShowedges = e => {
    this.showedges = e.target.checked
    this.dispatchShowedges()
  }

  render() {
    return html`
    <div class="container">
      <div>
        <input class="filterinput" type="text" placeholder="Filter" @input=${this.handleinput} value="${this.actorfilter}"></input>
      </div>
      <div>
        <input id="showedges" type="checkbox" ?checked=${this.showedges} @click=${this.handleShowedges}></input><label for="showedges">Show Edges</label>
      </div>
    </div>
`
  }
}

customElements.define("actor-filter", Filter)
