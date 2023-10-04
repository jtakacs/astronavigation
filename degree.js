import { LitElement, html } from 'lit';
import '@kor-ui/kor/components/input';
import '@kor-ui/kor/kor-styles.css';
import { dms_string } from './utils.js';

function parse(v) {
    const tmp = `${v}`.replace(/^[^-.0-9]*/, '').replace(/[^.0-9SsWw]*$/, '');
    let sign = tmp.startsWith('-') ? -1 : 1;
    if (tmp.includes('S') || tmp.includes('s') || tmp.includes('W') || tmp.includes('w')) sign = -1;
    const angle = tmp.replace(/^[^.0-9]*/, '').split(/[^.0-9]+/);
    let d = parseFloat(angle[0]);
    let m = parseFloat(angle[1]);
    let s = parseFloat(angle[2]);
    if (isNaN(d)) d = 0;
    if (isNaN(m)) m = 0;
    if (isNaN(s)) s = 0;
    const deg = Math.abs(d);
    const min = Math.abs(m);
    const sec = Math.abs(s);
    return sign * (deg + min / 60 + sec / 3600);
}

function clamp(left, v, right) {
    return v < left ? left : v < right ? v : right;
}

export class DegreeInput extends LitElement {
    static properties = {
        value: { type: Number },
        min: { type: Number },
        max: { type: Number },
        disabled: { type: Boolean },
    };

    constructor() {
        super();
        this.disabled = false;
        this.value = 0;
        this.min = -360;
        this.max = 360;
    }

    render() {
        return html`
            <kor-input
                .disabled="${this.disabled}"
                type="text"
                label="Degrees : Minutes : Seconds"
                value="${dms_string(this.value)}"
                no-clear
                tabindex="0"
                @blur="${this._blurHandler}"
                @keyup="${this._blurHandler}"
            ></kor-input>`;
    }

    _blurHandler(e) {
        if (e.type == 'blur' || (e.type == 'keyup' && ['Enter', 'NumpadEnter'].includes(e.code))) {
            this.value = clamp(this.min, parse(e.target.value), this.max);
            this.shadowRoot.querySelector('kor-input').value = dms_string(this.value);
        }
    }
}

customElements.define('degree-input', DegreeInput);
