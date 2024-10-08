import { metricLength, degree2decimal } from './utils.js';

const examples = [
    { // #0
        date: { y: 1982, m: 7, d: 18 },
        timezone: -7,
        watch_error: 0,
        method: 'sextant',
        index_error: 0,
        observer_height_meter: metricLength(0, 9, 0),
        temperature_celsius: 10,
        pressure_mbar: 1010,
        has_dr: true,
        dr: { lat: degree2decimal(25, 19, 0), lon: -degree2decimal(150, 25, 0) },
        heading: 242,
        speed_knots: 6.9,
        compare_location: true,
        actual_location: { lat: degree2decimal(25, 15, 0), lon: -degree2decimal(150, 25.9, 0) },
        stars: [
            { name: 'Vega', alt: degree2decimal(47, 22.5, 0), time: { h: 22, m: 37, s: 30 } },
            { name: 'Alkaid', alt: degree2decimal(59, 14.0, 0), time: { h: 22, m: 40, s: 14 } },
        ],
    },
    { // #1
        date: { y: 2022, m: 3, d: 28 },
        timezone: -5,
        watch_error: 0,
        method: 'cellphone',
        index_error: 0,
        observer_height_meter: metricLength(0, 1248.666, 0),
        temperature_celsius: 10,
        pressure_mbar: 1010,
        has_dr: false,
        dr: { lat: 0, lon: 0 },
        heading: 0,
        speed_knots: 0,
        compare_location: true,
        actual_location: { lat: degree2decimal(46, 38, 36.4), lon: -degree2decimal(93, 22, 31.6) },
        stars: [
            { name: 'Arcturus', alt: 45.7, time: { h: 0, m: 22, s: 33 } },
            { name: 'Polaris', alt: 45.6, time: { h: 0, m: 21, s: 45 } },
            { name: 'Procyon', alt: 25.2, time: { h: 0, m: 19, s: 51 } },
        ],
    },
    { // #2
        date: { y: 2018, m: 11, d: 15 },
        timezone: 0,
        watch_error: 0,
        method: 'sextant',
        index_error: degree2decimal(0, 0.3, 0),
        observer_height_meter: 2,
        pressure_mbar: 975,
        temperature_celsius: 12,
        has_dr: false,
        dr: { lat: 0, lon: 0 },
        heading: 0,
        speed_knots: 12,
        compare_location: false,
        actual_location: { lat: 0, lon: 0 },
        stars: [
            { name: 'Regulus', alt: degree2decimal(70, 48.7, 0), time: { h: 8, m: 28, s: 15 } },
            { name: 'Arcturus', alt: degree2decimal(27, 9.0, 0), time: { h: 8, m: 30, s: 30 } },
            { name: 'Dubhe', alt: degree2decimal(55, 18.4, 0), time: { h: 8, m: 32, s: 15 } },
        ],
    },
    { // #3
        date: { y: 2022, m: 7, d: 14 },
        timezone: 0,
        watch_error: 0,
        method: 'sextant',
        index_error: degree2decimal(0, 2, 0),
        observer_height_meter: 32,
        temperature_celsius: 10,
        pressure_mbar: 1010,
        has_dr: false,
        dr: { lat: 0, lon: 0 },
        heading: 0,
        speed_knots: 0,
        compare_location: true,
        actual_location: { lat: -31.154076, lon: 15.503133 },
        stars: [
            { name: 'Achernar', alt: degree2decimal(63, 17.1, 0), time: { h: 5, m: 48, s: 12 } },
            { name: 'Betelgeuse', alt: degree2decimal(22, 5.0, 0), time: { h: 5, m: 30, s: 42 } },
            { name: 'Canopus', alt: degree2decimal(38, 56.0, 0), time: { h: 5, m: 31, s: 48 } },
        ],
    },
    { // #4
        date: { y: 2022, m: 7, d: 13 },
        timezone: 0,
        watch_error: 0,
        method: 'sextant',
        index_error: degree2decimal(0, 2, 0),
        observer_height_meter: 32,
        temperature_celsius: 10,
        pressure_mbar: 1010,
        has_dr: false,
        dr: { lat: 0, lon: 0 },
        heading: 0,
        speed_knots: 0,
        compare_location: true,
        actual_location: { lat: -32.965812, lon: -71.665188 },
        stars: [
            { name: 'Atria', alt: degree2decimal(16, 2.1, 0), time: { h: 11, m: 40, s: 33 } },
            { name: 'Canopus', alt: degree2decimal(40, 8.4, 0), time: { h: 11, m: 23, s: 3 } },
            { name: 'Rigel', alt: degree2decimal(39, 18.0, 0), time: { h: 11, m: 24, s: 9 } },
        ],
    },
    { // #5  Tiny Captain's measurement https://youtu.be/tdmaLeXGBGk?t=517
        date: { y: 2003, m: 3, d: 17 },
        timezone: 3,
        watch_error: 0,
        method: 'sextant',
        index_error: degree2decimal(0, -2, 0),
        observer_height_meter: metricLength(0, 9, 0),
        temperature_celsius: 10,
        pressure_mbar: 1010,
        has_dr: false,
        dr: { lat: 0, lon: 0 },
        heading: 327,
        speed_knots: 13.6,
        compare_location: false,
        actual_location: { lat: 0, lon: 0 },
        stars: [
            { name: 'Regulus', alt: degree2decimal(33, 58.2, 0), time: { h: 19, m: 8, s: 15 } },
            { name: 'Capella', alt: degree2decimal(63, 45, 0), time: { h: 19, m: 14, s: 41 } },
            { name: 'Aldebaran', alt: degree2decimal(63, 53.5, 0), time: { h: 19, m: 16, s: 31 } },
        ],
    },
    { // #6  Proto Thad's measurement https://youtu.be/ykRb5Ku225U?t=881
        date: { y: 2022, m: 10, d: 1 },
        timezone: 0,
        watch_error: 0,
        method: 'sextant',
        index_error: 0,
        observer_height_meter: metricLength(0, 9, 0),
        temperature_celsius: 10,
        pressure_mbar: 1010,
        has_dr: false,
        dr: { lat: 0, lon: 0 },
        heading: 0,
        speed_knots: 0,
        compare_location: true,
        actual_location: { lat: degree2decimal(42, 46.9, 0), lon: -degree2decimal(87, 45.5, 0) },
        stars: [
            { name: 'Schedar', alt: degree2decimal(39, 36.2, 0), time: { h: 0, m: 33, s: 24 } },
            { name: 'Altair', alt: degree2decimal(55, 33.8, 0), time: { h: 0, m: 34, s: 49 } },
            { name: 'Saturn', alt: degree2decimal(24, 7, 0), time: { h: 0, m: 32, s: 2 } },
        ],
    },
    { // #7
        date: { y: 1982, m: 7, d: 16 },
        timezone: -7,
        watch_error: 0,
        method: 'sextant',
        index_error: 0,
        observer_height_meter: metricLength(0, 9, 0),
        temperature_celsius: 10,
        pressure_mbar: 1010,
        has_dr: true,
        dr: { lat: degree2decimal(28, 33, 0), lon: - degree2decimal(142, 41, 0) },
        heading: 245,
        speed_knots: 7.7,
        compare_location: true,
        actual_location: { lat: degree2decimal(28, 32, 0), lon: -degree2decimal(142, 39.6, 0) },
        stars: [
            { name: 'Deneb', alt: degree2decimal(47, 23, 0), time: { h: 6, m: 55, s: 50 } },
            { name: 'Venus', alt: degree2decimal(15, 56, 0), time: { h: 6, m: 58, s: 30 } },
            { name: 'Moon LL', alt: degree2decimal(42, 6.8, 0), time: { h: 7, m: 14, s: 25 } },
        ],
    },
    { // #8  Shoebill
        date: { y: 2023, m: 11, d: 17 },
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
        compare_location: true,
        actual_location: { lat: degree2decimal(39, 42, 41.103334), lon: -degree2decimal(77, 44, 27.12836) },
        stars: [
            { name: 'Rigel', alt: degree2decimal(13, 0.1, 0), time: { h: 2, m: 20, s: 42.4 } },
            { name: 'Vega', alt: degree2decimal(15, 33.9, 0), time: { h: 2, m: 56, s: 18.6 } },
            { name: 'Fomalhaut', alt: degree2decimal(12, 59, 0), time: { h: 2, m: 52, s: 20.7 } },
        ],
    },
];
export {
    examples,
};

/* 
more examples

Date        : 2022-08-04 # August 4, 2022
Eye Height  : 8.5344 m # 28 ft
Timezone    : GMT-0
Index Error : 0
Watch Error : 0
Speed       : 15.4 knots
True Bearing: 168°
Compare: 58° 29' 42" N, 10° 36' 36" E

star: Arcturus
alt : 28° 37.4'
time: 21:05:33

star: Capella
alt : 17° 26.8'
time: 21:28:17

star: Altair
alt : 40° 24.6'
time: 21:56:39



Index Error: -1.1
Eye Height: 4.572 meter # 15 feet
Refraction: standard

Celestial Body	Altitude	Time
Avior	37° 22.5'	Sat, 10 Apr 2021 13:45:19 GMT
Mars	43° 18.8'	Sat, 10 Apr 2021 13:50:28 GMT
Regulus	50° 17.0'	Sat, 10 Apr 2021 13:54:37 GMT
compare: 7° 27.9' S, 69° 41.5' E



Index Error: -2
Eye Height: 7 feet
Refraction: standard

Celestial Body	Altitude	Time
Arcturus      	49° 56.4'	Mon, 15 Feb 2021 22:32:46 GMT
Gacrux        	45° 14.2'	Mon, 15 Feb 2021 22:34:48 GMT
Kaus Australis	41° 48.2'	Mon, 15 Feb 2021 22:38:14 GMT
20° 17.2' S, 97° 59.8' E



Index Error: -0.4
Eye Height: 15 feet
Refraction: standard

Celestial Body	Altitude	Time
Altair	44° 59.5'	Sat, 04 Dec 2021 06:03:03 GMT
Fomalhaut	49° 12.9'	Sat, 04 Dec 2021 06:06:37 GMT
Saturn	45° 12.3'	Sat, 04 Dec 2021 06:10:41 GMT
11° 22.3' N, 179° 43.3' E




Index Error: -1.9
Eye Height: 11 feet
Refraction: standard

Celestial Body	Altitude	Time
Hadar	48° 5.8'	Fri, 26 Mar 2021 04:50:51 GMT
Peacock	53° 24.3'	Fri, 26 Mar 2021 04:55:23 GMT
Saturn	44° 7.7'	Fri, 26 Mar 2021 04:59:55 GMT
34° 8.4' S, 6° 8.8' E



Index Error: -2.3
Eye Height: 7 feet
Refraction: standard

Celestial Body	Altitude	Time
Alphard	57° 15.0'	Fri, 17 Dec 2021 12:51:37 GMT
Dubhe	37° 45.1'	Fri, 17 Dec 2021 12:55:43 GMT
Spica	54° 1.7'	Fri, 17 Dec 2021 13:00:07 GMT
9° 21.6' N, 109° 35.0' W



Index Error: 2.2
Eye Height: 10 feet
Refraction: standard

Celestial Body	Altitude	Time
Altair	40° 17.4'	Thu, 25 Nov 2021 18:38:28 GMT
Fomalhaut	69° 2.9'	Thu, 25 Nov 2021 18:41:27 GMT
Saturn	54° 43.7'	Thu, 25 Nov 2021 18:43:46 GMT
8° 32.6' S, 0° 11.8' E



Index Error: 2.4
Eye Height: 12 feet
Refraction: standard

Celestial Body	Altitude	Time
Altair	59° 48.0'	Wed, 02 Jun 2021 20:33:02 GMT
Jupiter	69° 45.4'	Wed, 02 Jun 2021 20:38:31 GMT
Saturn	60° 47.2'	Wed, 02 Jun 2021 20:40:42 GMT
8° 9.4' N, 128° 44.7' E

*/