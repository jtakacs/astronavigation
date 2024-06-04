import os
from skyfield.jpllib import SpiceKernel
from skyfield.api import Star, Loader, wgs84
from skyfield.almanac import meridian_transits, find_discrete
from datetime import date, datetime, timezone, timedelta
from math import degrees, atan, tan, copysign, pi, cos

_sun_volumetric_mean_radius = 695700.0
_earth_volumetric_mean_radius = 6371.0
_moon_volumetric_mean_radius = 1737.4


def _decdeg(d, mmm):
    return d + mmm/60


def _norm(delta):
    # normalize the angle between 0° and 360°
    while delta < 0:
        delta += 360
    while delta >= 360:
        delta -= 360
    return delta


def _fmtgha(gst, ra):
    sha = (gst - ra) * 15
    while sha < 0:
        sha = sha + 360
    return sha


def _d_factor(decl, i0, i1):
    D0 = decl.degrees[i0] * 60.0
    D1 = decl.degrees[i1] * 60.0
    if copysign(1.0, D1) == copysign(1.0, D0):
        return abs(D1) - abs(D0)
    else:
        return -abs(D1 - D0)


def _v_factor(t, ra, i):
    Vdelta = _fmtgha(t[i+1].gast, ra.hours[i+1]) - _fmtgha(t[i].gast, ra.hours[i])
    if Vdelta < 0:
        Vdelta += 360
    # subtract 14:19:00
    return (Vdelta-(14.0+(19.0/60.0))) * 60


def _moon_data(d):
    t = almanac.timescale.ut1(d.year, d.month, d.day, list(range(25)), 0, 0)
    ra, decl, distance = _observe(t, almanac.moon)
    return {
        'GHA': [_fmtgha(t[i].gast, ra.hours[i]) for i in range(24)],
        'DEC': [decl.degrees[i] for i in range(24)],
        'SD': degrees(atan(_moon_volumetric_mean_radius/distance.km[0])) * 60,
        'HP': [degrees(atan(_earth_volumetric_mean_radius / distance.km[i])) * 60 for i in range(24)],
        'd': [_d_factor(decl, i, i+1) for i in range(24)],
        'v': [_v_factor(t, ra, i) for i in range(24)],
    }


def _stars_SHA(midnight):
    def calc_ra_decl(star):
        ra, decl, _ = _observe(midnight, star['position'])
        return {'SHA': _fmtgha(0, ra.hours), 'DEC': decl.degrees}
    return dict([(star['name'], calc_ra_decl(star)) for star in almanac.hipparcos])


def _calc_daily_page(d):
    t = almanac.timescale.ut1(d.year, d.month, d.day, list(range(24)), 0, 0)
    result = {
        'Aries': {
            "GHA": [_fmtgha(t[i].gast, 0) for i in range(24)],
            'stars': _stars_SHA(t[0]),
            "DEC": [0 for _ in range(24)],
            "SD": 0,
            "HP": 0,
            "d": 0,
            "v": 0,
        },
        'Moon': _moon_data(d),
    }
    for name, planet in almanac.planets.items():
        ra, decl, distance = _observe(t, planet)
        result[name] = {
            "GHA": [_fmtgha(t[i].gast, ra.hours[i]) for i in range(24)],
            "DEC": [decl.degrees[i] for i in range(24)],
            "SD": 0,
            "HP": 0,
            "d": _d_factor(decl, 0, 1),
            "v": 0,
        }
        if name == 'Sun':
            result[name]["SD"] = degrees(atan(_sun_volumetric_mean_radius / distance.km[0])) * 60
            result[name]["HP"] = 8.794148 / 60  # arc minutes
        else:
            sha_diff = t[1].gast - t[0].gast + ra.hours[0] - ra.hours[1]
            result[name]["v"] = (_norm(sha_diff * 15) - 15) * 60
        if name in ['Venus', 'Mars']:
            result[name]["HP"] = degrees(tan(_earth_volumetric_mean_radius/(distance.au[0]*149597870.7)))*60  # arc minutes
    return result


def _observe(time, celestial):
    return almanac.earth.at(time).observe(celestial).apparent().radec(epoch='date')


def _hipparcos(file):
    catalog = []
    with open(file, 'r') as fobj:
        next(fobj)
        for line in fobj:
            line = [l.strip() for l in line.split('|')]
            catalog.append({
                'HIP': int(line[0]),
                'name': line[1],
                'magnitude': float(line[2]),
                'position': Star(
                    ra_hours=float(line[3]) / 15.0,
                    dec_degrees=float(line[4]),
                    parallax_mas=float(line[5]),
                    ra_mas_per_year=float(line[6]),
                    dec_mas_per_year=float(line[7]),
                    epoch=1991.25 * 365.25 + 1721045.0)})
    return catalog


def _init():
    if not hasattr(almanac, 'hipparcos'):
        cwd = os.path.dirname(__file__)
        almanac.timescale = Loader(cwd).timescale(builtin=False)  # loads finals2000A.all
        almanac.hipparcos = _hipparcos(f'{cwd}/Hipparcos.csv')
        eph = SpiceKernel(f'{cwd}/de421.bsp')
        almanac.eph = eph
        almanac.earth = eph['earth']
        almanac.moon = eph['moon']
        almanac.planets = {
            'Sun': eph['sun'],
            'Venus': eph['venus'],
            'Mars': eph['mars'],
            'Jupiter': eph['jupiter barycenter'],
            'Saturn': eph['saturn barycenter'],
        }


def utc_date(y, mm, d, h, m, s, z):
    zone = timezone(copysign(1, z) * timedelta(hours=abs(z)))
    delta = timedelta(weeks=0, days=0, hours=h, minutes=m, seconds=s)
    a = (datetime(y, mm, d, 0, 0, 0, tzinfo=zone) + delta).astimezone(timezone.utc)
    return {
        "date": {"y": a.year, "m": a.month, "d": a.day},
        "time": {"h": a.hour, "m": a.minute, "s": a.second},
    }


def vd_corr(m, vd):
    # returns the v/d correction for a given minute and tabular v/d.
    return vd * (m + 0.5) / 60


def gha_increment(body, min, sec):
    if 'Sun' == body or body in planets():
        return 15 * (min * 60 + sec) / 3600
    elif ('Moon' == body):
        return _decdeg(14, 19) * (min * 60 + sec) / 3600
    return _decdeg(15, 2.46) * (min * 60 + sec) / 3600


def planets():
    return ['Venus', 'Mars', 'Jupiter', 'Saturn']


def sunmoon():
    return ['Moon LL', 'Moon UL', 'Sun LL', 'Sun UL']


def stars():
    _init()
    return sorted([star['name'].strip() for star in almanac.hipparcos])


def almanac(y, m, d):
    _init()
    day = date(int(str(y).strip(), base=10), int(str(m).strip(), base=10), int(str(d).strip(), base=10))
    return _calc_daily_page(day)


def parallax(hp, altitude):
    # returns parallax in minutes from horizontal parallax, and Ha
    return hp * cos(altitude * pi / 180)


def sun_lat(date):
    _init()
    time = almanac.timescale.ut1(date.y, date.m, date.d, 0, 0, 0)
    ra, decl, distance = _observe(time, almanac.planets['Sun'])
    return decl.degrees


def sunpath(date, minutes, latitude, longitude, elevation_m, temperature_C, pressure_mbar):
    _init()
    time = almanac.timescale.ut1(date.y, date.m, date.d, 0, minutes, 0)
    location = almanac.earth + wgs84.latlon(
        latitude,
        longitude,
        elevation_m)
    alt, az, dist = location.at(time).observe(almanac.planets['Sun']).apparent().altaz(temperature_C=temperature_C, pressure_mbar=pressure_mbar)
    return {
        "time": time.utc_iso(),
        "altitude": alt.degrees,
        "azimuth": az.degrees,
    }

def solarnoon(lat, lon, y, m, d):
    _init()

    location = wgs84.latlon(lat, lon)
    t0 = almanac.timescale.utc(y, m, d-1)
    t1 = almanac.timescale.utc(y, m, d+1)

    f = meridian_transits(almanac.eph, almanac.planets['Sun'], location)
    times, events = find_discrete(t0, t1, f)
    noon = times[events == 1][-1].utc_datetime()

    return {
        "date": { "y": noon.year, "m": noon.month, "d": noon.day },
        "time": { "h": noon.hour, "m": noon.minute, "s": noon.second },
    }

