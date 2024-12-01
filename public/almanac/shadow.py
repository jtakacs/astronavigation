import os
from skyfield.jpllib import SpiceKernel
from skyfield.api import Loader, wgs84
from math import tan, radians

"""
    Calculates shadow lengths for every minute of a given day at a given location

    Union Glacier Camp 
    Latitude     : 79° 46' S
    Longitude    : 82° 52' W
    Elevation    : 700 m
    Time zone    : Chile Summer Time  CLST (UTC-3)
    Date         : 2024-12-16 
    Time         : from 00:00 until 24:00 CLST
    Temperature  : -10 °C
    Pressure     : 980 mbar
    Gnomon height: 165 cm
"""

latitude = -(79 + 46/60)
longitude = -(82 + 52/60)
elevation_m = 700
temperature_C = -10
pressure_mbar = 980
gnomon_cm = 165

year = 2024
month = 12
day = 16
# start 3 hours after UTC midnight
minutes = range(3*60, (3+24)*60)

cwd = os.path.dirname(__file__)
timescale = Loader(cwd).timescale(builtin=False)  # loads finals2000A.all
ephemeris = SpiceKernel(f'{cwd}/de421.bsp')
earth = ephemeris['earth']
sun = ephemeris['sun']

time = timescale.ut1(year, month, day, 0, minutes, 0)
location = earth + wgs84.latlon(
    latitude,
    longitude,
    elevation_m)

altitude, azimuth, distance = (
    location
    .at(time)
    .observe(sun)
    .apparent()
    .altaz(temperature_C=temperature_C, pressure_mbar=pressure_mbar))

with open('shadow2.csv', 'w') as csv:
    csv.write("time UTC | azimuth deg | altitude deg | cotangent | shadow cm | shadow azimuth deg\n")
    for idx in range(len(time)):
        ts = time.utc_iso()[idx]
        azi = azimuth.degrees[idx]
        alt = altitude.degrees[idx]
        cot = 1 / tan(radians(alt))
        shadow= gnomon_cm * cot
        sh_azi = (180 + azi) % 360
        csv.write(f"{ts} | {azi} | {alt} | {cot} | {shadow} | {sh_azi}\n")

