const { abs } = Math;

const id = (function () {
    let counter = Number.MIN_SAFE_INTEGER;
    return function () {
        if (Number.MAX_SAFE_INTEGER - 1 <= counter) counter = Number.MIN_SAFE_INTEGER;
        counter += 1;
        return counter;
    };
})();

function once(fn) {
    let called = false;
    return function (...args) {
        if (called) return;
        called = true;
        return fn.apply(this, args);
    };
}

function el(id) {
    return typeof id === 'string' ? document.getElementById(id) : id;
}

function getval(id, at = 'value') {
    return el(id).getAttribute(at);
}

function attr(id, at, val) {
    const element = el(id);
    if (val === false) element.removeAttribute(at);
    else element.setAttribute(at, val);
    return element;
}

function create(tag, attrs = []) {
    const element = document.createElement(tag);
    for (let i = 0; i < attrs.length; i += 2) attr(element, attrs[i], attrs[i + 1]);
    return element;
}

function handler(fn) {
    return (event) => {
        fn(event);
        // event.preventDefault();
        return false;
    };
}

function listen(id, event, fn) {
    const element = el(id);
    element.addEventListener(event, handler(fn));
    return element;
}

function enter_handler(fn) {
    return function (event) {
        if (['Enter', 'NumpadEnter'].includes(event.code))
            fn(event);
    };
}
function listen_with_enter(id, event, fn) {
    const element = listen(id, event, fn);
    listen(element, 'keyup', enter_handler(fn));
    return element;
}

function html5_date_string(d) {
    return `${d.y}-${d.m < 10 ? '0' : ''}${d.m}-${d.d < 10 ? '0' : ''}${d.d}`;
}

function dms(deg) {
    let sign = deg < 0 ? -1 : 1;
    let angle = Math.abs(deg);
    while (360 < angle) angle -= 360;
    let degree = Math.floor(angle);
    const trail = 60 * (angle - degree);
    let minute = Math.floor(trail);
    let second = Math.round(100 * (60 * (trail - minute))) / 100;
    if (60 <= second) {
        second -= 60;
        minute += 1;
    }
    if (60 <= minute) {
        minute -= 60;
        degree += 1;
    }
    return { sign, degree, minute, second };
};

function dms_string(deg) {
    const { sign, degree, minute, second } = dms(deg);
    return `${sign < 0 ? '-' : ''}${degree}° ${minute}' ${second}"`;
}

function time_string(time) {
    return `${time.h} : ${time.m} : ${time.s}`;
}

function metricLength(miles = 0, feet = 0, inches = 0) {
    return miles * 1609.344 + feet * 0.3048 + inches * 0.0254;
}

function degree2decimal(deg, min, sec) {
    return (abs(deg) + abs(min) / 60 + abs(sec) / 3600) * ((deg < 0 || min < 0 || sec < 0) ? -1 : 1);
}

export {
    id,
    el,
    getval,
    attr,
    create,
    handler,
    enter_handler,
    listen,
    listen_with_enter,
    html5_date_string,
    dms,
    dms_string,
    time_string,
    metricLength,
    degree2decimal,
};
