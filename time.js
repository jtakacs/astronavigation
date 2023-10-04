import { LitElement, html } from 'lit';
import '@kor-ui/kor/components/input';
import '@kor-ui/kor/kor-styles.css';

function parse(v) {
    const a = `${v}`.replace(/^[^0-9]*/, '').replace(/[^0-9]*$/, '');
    const d = a.replace(/^[^0-9]*/, '').split(/[^0-9]+/);
    let h = parseInt(d[0], 10);
    let m = parseInt(d[1], 10);
    let s = parseInt(d[2], 10);
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;
    if (isNaN(s)) s = 0;
    if (25 * 3600 < h * 3600 + m * 60 + s) {
        h = 24;
        m = 0;
        s = 0;
    }
    const hour = Math.abs(h);
    const min = Math.abs(m);
    const sec = Math.abs(s);
    return { h: hour, m: min, s: sec };
}

function format({ h, m, s }) {
    return `${h < 10 ? '0' : ''}${h} : ${m < 10 ? '0' : ''}${m} : ${s < 10 ? '0' : ''}${s}`;
}


export class TimeInput extends LitElement {
    static properties = {
        value: { type: Object, reflect: false },
    };

    constructor() {
        super();
        this.value = { h: 0, m: 0, s: 0 };
    }

    render() {
        return html`
            <kor-input
                type="text"
                label="Hours : Minutes : Seconds"
                value="${format(this.value)}"
                no-clear
                tabindex="0"
                @blur="${this._blurHandler}"
                @keyup="${this._blurHandler}"
            ></kor-input>`;
    }

    _blurHandler(e) {
        if (e.type == 'blur' || (e.type == 'keyup' && ['Enter', 'NumpadEnter'].includes(e.code))) {
            this.value = parse(e.target.value);
            this.shadowRoot.querySelector('kor-input').value = format(this.value);
        }
    }
}

customElements.define('time-input', TimeInput);
