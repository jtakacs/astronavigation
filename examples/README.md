# Example text input
<pre>
## $10k challenge

## required field
## in YYYY MM DD format
date: 2018-11-15

## required field, measurement in meters
eye height: 2 meter

## optional, defaults to GMT+0 if omitted
timezone: GMT+0

## optional, defaults to 0 if omitted
## only decimal arc minutes are accepted
index error: 0.3'

## optional, defaults to 0 seconds if omitted
## only seconds are accepted
watch error: 0

## optional, defaults to "sextant" if omitted
## possible values: "sextant" | "bubble sextant" |  "theodolite" | "cellphone"
method: sextant

## optional block, defaults to standard refraction if omitted
## either use this line:
# refraction: standard 
## OR specify the temperature and pressure with these lines:
# temperature: 10 Celsius 
# pressure: 1010 millibar
temperature: 12 °C
pressure: 975 mbar

## optional
heading: 0°

## optional, also not implemented yet
speed: 12 knots

## optional block
## either a one liner, like:
# ded reckoning: lat , lon
## OR three lines as shown:
ded reckoning:
lat: 0°
lon: 0°

## optional block
## either a one liner like:
# compare: -31.154076°, 15.503133°
## OR three lines, like:
# compare:
# lat: -31.154076°
# lon: 15.503133°

## the last 3 blocks are required
## provide either three celestial body observations
## OR two celestial body observations 
##    and a distance from a known landmark

## example of landmark definition
# landmark: Hawaii
# lat: 20.937192°
# lon: -156.347435°
# distance: 1931.213 km

star: Regulus
## degree separator can be any non-numeric character
alt: 70° 48.7' 0"  # would be also valid: angle: 70 deg 48.7 min 0 sec
time: 08:28:15

## instead of star, the keyword can be
## planet | body | sight | object |
## celestial | celestial body | target

## in case of Sun or Moon sights, the 
## measured limb must be included in the name.
## ( Sun UL | Sun LL | Moon UL | Moon LL )

## planet names can be
## Venus | Mars | Jupyter | Saturn

## Star names can be
## Acamar | Achernar | Acrux | Adhara | Aldebaran | 
## Alioth | Alkaid | Alnilam | Al Na'ir | Alphard | 
## Alphecca | Alpheratz | Altair | Atria | Ankaa | 
## Antares | Arcturus | Avior | Bellatrix | 
## Betelgeuse | Canopus | Capella | Diphda | Deneb | 
## Denebola | Dubhe | Elnath | Eltanin | Enif | 
## Fomalhaut | Gacrux | Gienah | Hadar | Hamal | 
## Kaus Aust. | Kochab | Markab | Menkar | Menkent | 
## Miaplacidus | Mirfak | Nunki | Peacock | Polaris | 
## Pollux | Procyon | Rasalhague | Regulus | Rigel | 
## Rigil Kent. | Schedar | Sabik | Scheat | Shaula | 
## Sirius | Suhail | Spica | Vega | Zuben'ubi | 

star: Arcturus
alt: 27° 9.0' 0"
time: 08:30:30

star: Dubhe
alt: 55° 18.4' 0" 
time: 08:32:15

</pre>
