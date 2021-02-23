import {Component} from "./helpers/component.js"
import {html, css} from "../../../../web_modules/lit-element.js"

const filters = [
  { label: "natural", filter:"srcvisible && dstvisible"},
  { label: "all", filter:"true"}
]

class EdgeControl extends Component {
  static get properties() {
    return {
      edgefilter: { type: String },
      showedges: { type: Boolean },
    }
  }

  static get styles() {
    return css`
      .container { position: absolute; top: 8px; right: 4px }
      .filterinput { font-size: 110%; width: 600px; opacity: 0.8 }
      .filler { margin-right: 5px }
      .activefiller { color: blue }
      .options { margin-top: 5px }
    `;
  }

  constructor() {
    super()
    this.showedges = false
    this.editedtext = localStorage.getItem("editededgefilter")
  }

  firstUpdated() {
    this.setedgefilter(filters[0].filter)
  }

  setedgefilter = value => {
    this.edgefilter = value
    if (!filters.find(filter => filter.filter === value)) {
      this.editedtext = value
      localStorage.setItem("editededgefilter", this.editedtext)
    }
    this.dispatchEvent(new CustomEvent('edgefilterinput', { detail: { value: this.edgefilter }, bubbles: true, composed: true }));
  }

  handleinput = e => {
    this.setedgefilter(e.target.value)
  }

  handleShowedges = e => {
    this.showedges = e.target.checked
    this.dispatchEvent(new CustomEvent('showedgeschanged', { detail: { value: this.showedges }, bubbles: true, composed: true }));
  }

  inputfiller(text) {
    return (e) => {
      e.preventDefault()
      this.setedgefilter(text)
    }
  }

  render() {
    return html`
    <div class="container">
      <details open="true">
        <summary>Edges</summary>
        <div class="options">
          <input id="showedges" type="checkbox" ?checked=${this.showedges} @click=${this.handleShowedges}></input><label for="showedges">Show edges (slow)</label>
        </div>
        <div>
          <input class="filterinput" type="text" placeholder="Edge Filter" @input=${this.handleinput} .value="${this.edgefilter}"></input>
          <div>
            ${filters.map(({label, filter}) => html`<a class="filler ${filter === this.edgefilter ? 'activefiller': ''}" href="" @click=${this.inputfiller(filter)}>${label}</a>`)}
            ${this.editedtext && html`<a class="filler ${this.edgefilter === this.editedtext ? 'activefiller': ''}" href="" @click=${this.inputfiller(this.editedtext)}>edited</a>`}
          </div>
        </div>
      </div>
    </details>
`
  }
}

customElements.define("edge-control", EdgeControl)
