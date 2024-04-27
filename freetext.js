import nearley from 'nearley/lib/nearley.js';
import grammar from './grammar.js';
import { metricLength } from './utils.js';
const { abs } = Math;

function parse(text) {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    try {
        parser.feed(text + "\n\n");
        return parser.finish()[0];
    } catch (parseError) {
        throw `${parseError}\n\n`.split('\n')[0];
    }
}

function decdeg(x) {
    return x.sign * (abs(x.deg.d) + abs(x.deg.m) / 60 + abs(x.deg.s) / 3600);
}

function validate(observations, constants) {
    const data = {
        date: { y: 1000, m: 1, d: 1 },
        timezone: 0,
        watch_error: 0,
        method: 'sextant',
        index_error: 0,
        observer_height_meter: 0,
        temperature_celsius: 10,
        pressure_mbar: 1010,
        has_dr: false,
        dr: { lat: 0, lon: 0 },
        heading: 0,
        speed_knots: 0,
        compare_location: false,
        actual_location: { lat: 0, lon: 0 },
        stars: [],
    };
    let has_date = false;
    let has_height = false;
    observations.forEach(item => {
        if ("date" in item) {
            has_date = true;
            data.date.y = item.date.y;
            data.date.m = item.date.m;
            data.date.d = item.date.d;
        } else if ("height" in item) {
            has_height = true;
            if ("f" == item.u) data.observer_height_meter = metricLength(0, item.height, 0);
            else data.observer_height_meter = item.height;
        } else if ("zone" in item) {
            data.timezone = item.zone;
        } else if ("method" in item) {
            data.method = item.method;
        } else if ("index" in item) {
            data.index_error = item.index / 60.0;
        } else if ("watch" in item) {
            data.watch_error = item.watch;
        } else if ("bear" in item) {
            data.heading = decdeg({ "sign": 1, "deg": item.bear });
        } else if ("speed" in item) {
            if ("m/s" == item.speed.u) data.speed_knots = item.speed * 3.6 * 0.5399568035;
            else if ("km/h" == item.speed.u) data.speed_knots = item.speed * 0.5399568035;
            else if ("mph" == item.speed.u) data.speed_knots = item.speed * 0.8689762419;
            else data.speed_knots = item.speed;
        } else if ("temp" in item) {
            if ("f" == item.temp.u) data.temperature_celsius = (item.temp.v - 32) * 5 / 9;
            else if ("k" == item.temp.u) data.temperature_celsius = item.temp.v - 273.15;
            else data.temperature_celsius = item.temp.v;
            if ("psi" == item.press.u) data.pressure_mbar = item.press.v * 68.9475729318;
            else if ("Pa" == item.press.u) data.pressure_mbar = item.press.v * 0.01;
            else if ("atm" == item.press.u) data.pressure_mbar = item.press.v * 1013.25;
            else if ("Torr" == item.press.u) data.pressure_mbar = item.press.v * 1.3332236842;
            else data.pressure_mbar = item.press.v;
        } else if ("compare" in item) {
            data.compare_location = true;
            item.compare.forEach(latlon => {
                if ("lat" in latlon) data.actual_location.lat = decdeg(latlon.lat);
                else data.actual_location.lon = decdeg(latlon.lon);
            });
        } else if ("dr" in item) {
            data.has_dr = true;
            item.dr.forEach(latlon => {
                if ("lat" in latlon) data.dr.lat = decdeg(latlon.lat);
                else data.dr.lon = decdeg(latlon.lon);
            });
        } else if ("star" in item) {
            const name = item.star.trim();
            if (!constants.includes(name)) {
                if (name.toLowerCase().startsWith('sun')) {
                    throw `Misspelled name. Choose either "Sun UL" or "Sun LL".`;
                } else if (name.toLowerCase().startsWith('moon')) {
                    throw `Misspelled name. Choose either "Moon UL" or "Moon LL".`;
                }
                throw `Misspelled name: "${name}". Star names are case sensitive!`;
            }
            data.stars.push({
                name: name,
                alt: decdeg(item.angle),
                time: {
                    h: item.time.d,
                    m: item.time.m,
                    s: item.time.s
                }
            });
        }
    });
    if (!has_date) throw `Required field 'date' is missing!`;
    if (!has_height) throw `Required field 'height' is missing!`;
    return data;
}

export {
    parse,
    validate
};
