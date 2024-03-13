import nearley from 'nearley/lib/nearley.js';
import grammar from './grammar.js';
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
        observer_height_meter: 0,
        timezone: 0,
        method: 'sextant',
        index_error: 0,
        watch_error: 0,
        temperature_celsius: 10,
        pressure_mbar: 1010,
        compare_location: false,
        actual_location: { lat: 0, lon: 0 },
        heading: 0,
        speed_knots: 0,
        dr_lat: 0,
        dr_lon: 0,
        stars: [],
        landmarks: [],
    };
    observations.forEach(item => {
        if ("date" in item) {
            data.date.y = item.date.y;
            data.date.m = item.date.m;
            data.date.d = item.date.d;
        } else if ("height" in item) {
            data.observer_height_meter = item.height;
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
            data.speed_knots = item.speed;
        } else if ("temp" in item) {
            data.temperature_celsius = item.temp;
            data.pressure_mbar = item.press;
        } else if ("compare" in item) {
            data.compare_location = true;
            item.compare.forEach(latlon => {
                if ("lat" in latlon) data.actual_location.lat = decdeg(latlon.lat);
                else data.actual_location.lon = decdeg(latlon.lon);
            });
        } else if ("dr" in item) {
            item.dr.forEach(latlon => {
                if ("lat" in latlon) data.dr_lat = decdeg(latlon.lat);
                else data.dr_lon = decdeg(latlon.lon);
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
        } else if ("mark" in item) {
            data.landmarks.push({
                name: item.mark.trim(),
                lat: decdeg(item.lat),
                lon: decdeg(item.lon),
                distance: item.dist * 1000.0
            });
        }
    });
    return data;
}

export {
    parse,
    validate
};
