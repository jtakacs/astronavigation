import { dms } from "./utils.js";
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const px = ['Sun', 'Moon', 'Sun LL', 'Moon LL', 'Sun UL', 'Moon UL', 'Venus', 'Mars'];
const fmt_deg = (deg) => {
    let angle = Math.abs(deg);
    let degree = Math.floor(angle);
    let mf = parseFloat(((angle - degree) * 60).toFixed(2));
    if (60 <= Math.floor(mf)) { mf -= 60; degree += 1; }
    return `${deg < 0 ? "-" : ""}${360 <= degree ? degree - 360 : degree}° ${mf.toFixed(2)}'`;
};
const format_degminsec = (dir = 'default') => {
    return (deg) => {
        const { sign, degree, minute, second } = dms(deg);
        let prefix = '';
        if (dir != 'lat' && dir != 'lon') prefix = sign < 0 ? '-' : (dir == 'sign' ? '+' : '');
        let suffix = '';
        if (dir == 'lat') suffix = sign < 0 ? 'S' : 'N';
        if (dir == 'lon') suffix = sign < 0 ? 'W' : 'E';
        return `${prefix}${degree < 100 ? (degree < 10 ? '  ' : ' ') : ''}${degree}° ${minute < 10 ? '0' : ''}${minute}' ${second < 10 ? '0' : ''}${second}" ${suffix}`;
    };
};
const fmt_lat = format_degminsec('lat');
const fmt_lon = format_degminsec('lon');
const fmt_time = (d, t, z) => `${d.y}-${d.m < 10 ? '0' : ''}${d.m}-${d.d < 10 ? '0' : ''}${d.d} ${t.h < 10 ? '0' : ''}${t.h}:${t.m < 10 ? '0' : ''}${t.m}:${t.s < 10 ? '0' : ''}${t.s} GMT${-1 < z ? '+' : ''}${z}`;
const exclude = (fn, arr = ['landmark']) => ((page) => arr.includes(page.type) ? '' : fn(page));
const fmt_watch_time = exclude((page) => fmt_time(page.watch_time.date, page.watch_time.time, page.timezone));
const fmt_utc_time = exclude((page) => fmt_time(page.datetime_utc.date, page.datetime_utc.time, 0));
const fmt_gha_0 = exclude((page) => fmt_deg(page.gha_integral), ['landmark', 'star']);
const fmt_gha_i = exclude((page) => fmt_deg(page.gha_increment));
const fmt_gha = exclude((page) => fmt_deg(page.gha));
const fmt_decl = exclude((page) => fmt_deg(page.declination));
const fmt_sxt = exclude((page) => fmt_deg(page.sextant_altitude));
const fmt_v_fact = exclude((page) => page.v_factor.toFixed(2), ['landmark', 'star']);
const fmt_v_corr = exclude((page) => page.v_correction.toFixed(2) + "'", ['landmark', 'star']);
const fmt_d_fact = exclude((page) => page.d_factor.toFixed(2), ['landmark', 'star']);
const fmt_d_corr = exclude((page) => page.d_correction.toFixed(2) + "'", ['landmark', 'star']);
const fmt_idx = (ie) => `${(ie * 60).toFixed(2)}' OFF the arc`;
const fmt_dip = exclude((page) => (page.dip_correction * 60).toFixed(2) + "'");
const fmt_rf = exclude((page) => (page.refraction_factor).toFixed(3));
const fmt_ref = exclude((page) => (page.refraction_correction * 60).toFixed(2) + "'");
const fmt_aries = (page) => ('star' === page.type) ? fmt_deg(page.aries_gha) : "";
const fmt_sha = (page) => ('star' === page.type) ? fmt_deg(page.star_sha) : "";
const fmt_dist = (page) => ('landmark' === page.type) ? (page.distance / 1000).toFixed(3) + " km" : "";
const fmt_lim = (page) => ('Sun' === page.type || 'Moon' === page.type) ? ('LL' === page.limb ? 'Lower' : 'Upper') : '';
const fmt_semi = (page) => ('Sun' === page.type || 'Moon' === page.type) ? page.semidiameter.toFixed(2) + "'" : '';
const fmt_hp = (page) => (px.includes(page.name)) ? page.hp.toFixed(2) : '';
const fmt_px = (page) => (px.includes(page.name)) ? page.parallax.toFixed(2) + "'" : '';

function tbl_row(table_id, worksheet) {
    const table = document.getElementById(table_id);
    while (table.firstChild) table.removeChild(table.lastChild);
    return function (desc, fn, txt2 = false) {
        const r = document.createElement('kor-table-row');
        function cell(txt = false) {
            const c1 = document.createElement('kor-table-cell');
            c1.setAttribute('grid-cols', '6');
            if (txt) c1.append(txt);
            r.append(c1);
        }
        cell(desc);
        if (typeof fn === 'function') {
            worksheet.map(fn).forEach((txt) => cell(txt));
        } else {
            cell(fn);
        }
        if (txt2) cell(txt2);
        table.append(r);
    }
}

function csv_row(result, worksheet) {
    return function (desc, fn, txt2 = false) {
        if (typeof fn === 'function') {
            result.push(worksheet.map(fn).reduce((p, c) => p + '|' + c, desc));
        } else {
            result.push(desc + '|' + fn + (txt2 ? '|' + txt2 : ''));
        }
    }
}

function process_ws({ data, worksheet, fix }, row, append_link = false) {
    const types = worksheet.map((p) => p.type);
    const has_land = types.includes('landmark');
    const has_v = types.includes('planet') || types.includes('Moon');
    const has_d = types.includes('planet') || types.includes('Moon') || types.includes('Sun');
    const has_sha = types.includes('star');
    const has_wgha = 0 < types.filter((t) => (t != 'star') && (t != 'landmark')).length;
    const has_limb = types.includes('Moon') || types.includes('Sun');
    const has_px = 0 < worksheet.map((p) => p.name).filter((n => px.includes(n))).length;

    row('Date', `${data.date.y} ${months[data.date.m - 1]} ${data.date.d}`);
    row('Time Zone', `GMT${-1 < data.timezone ? '+' : ''}${data.timezone}`);
    row('Watch Error', `${(data.watch_error).toFixed(0)} seconds behind`);
    row('Observation Method', data.method);
    row('Eye Height', `${data.observer_height_meter.toFixed(2)} meter`);
    row('Index Error', fmt_idx(data.index_error));
    row('Temperature', `${data.temperature_celsius.toFixed(2)} °C`);
    row('Pressure', `${data.pressure_mbar.toFixed(2)} mbar`);
    row('Ded. Reckoning', fmt_lat(data.dr_lat), fmt_lon(data.dr_lon));
    row('Heading', fmt_deg(data.heading));
    row('Speed', `${data.speed_knots.toFixed(3)} knots`);
    row('Observed Target', (page) => page.name);
    row('Watch Time', fmt_watch_time);
    row('UTC Time', fmt_utc_time);
    row('Sextant Altitude', fmt_sxt);
    row('Dip Correction', fmt_dip);
    row('Refraction Coefficient', fmt_rf);
    row('Refraction Correction', fmt_ref);
    if (has_limb) row('Observed Limb', fmt_lim);
    if (has_limb) row('Semidiameter', fmt_semi);
    if (has_px) row('HP', fmt_hp);
    if (has_px) row('Parallax Correction', fmt_px);
    if (has_wgha) row('GHA whole hour', fmt_gha_0);
    if (has_sha) row('Aries GHA', fmt_aries);
    row('GHA Increment', fmt_gha_i);
    if (has_sha) row('SHA', fmt_sha);
    if (has_v) row('v', fmt_v_fact);
    if (has_v) row('v correction', fmt_v_corr);
    row('GHA', fmt_gha);
    row('Declination', fmt_decl);
    if (has_d) row('d', fmt_d_fact);
    if (has_d) row('d correction', fmt_d_corr);
    if (has_land) row('Distance', fmt_dist);
    row('True Altitude', (page) => fmt_deg(page.angle));
    row('GP Latitude', (page) => fmt_lat(page.lat));
    row('GP Longitude', (page) => fmt_lon(page.lon));
    row('Location Fix', fmt_lat(fix.lat), fmt_lon(fix.lon));
    if (data.compare_location) {
        row('Actual Location', fmt_lat(data.actual_location.lat), fmt_lon(data.actual_location.lon));
        row('Distance Error', `${(fix.distance_error / 1000).toFixed(3)} km`)
    }
    if (append_link) row('Google Maps', `https://maps.google.com/?q=${fix.lat},${fix.lon}`);
}

function worksheet_table(app_state, table_id) {
    process_ws(app_state, tbl_row(table_id, app_state.worksheet), false);
}

function worksheet_csv(app_state) {
    const result = [];
    process_ws(app_state, csv_row(result, app_state.worksheet), true);
    return result.join("\n");
}

export {
    format_degminsec,
    worksheet_table,
    worksheet_csv,
}