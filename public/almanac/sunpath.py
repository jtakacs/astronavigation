
from almanac import sunpath_hires

class Date: pass

if __name__ == "__main__":
    # Union Glacier Camp -79.768056, -83.261667. For December 14-18
    latitude = -79.768056
    longitude = -83.261667
    elevation_m = 700
    temperature_C = -5
    pressure_mbar = 990
    print("time | altitude | azimuth")
    for day in [13, 14, 15, 16, 17, 18, 19]:
    # for day in [13]:
        date = Date()
        date.y = 2024
        date.m = 12
        date.d = day
        for hour in range(24):
            y = sunpath_hires(date, hour,  latitude, longitude, elevation_m, temperature_C, pressure_mbar)
            for x in y:
                print(f"{x['time']} | {x['altitude']} | {x['azimuth']}")
