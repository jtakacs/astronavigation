@preprocessor esmodule
observation   -> break:* (optional break:+):* sights break:*                     {% d=>d[1].map(v=>v[0][0]).concat(d[2]) %}

optional      -> date
              |  height
              |  zone
              |  method
              |  index_error
              |  watch_error
              |  refraction
              |  compare
              |  ded_reckoning
              |  heading
              |  speed

date          -> _ "date"i _ ":" _ int dsep int dsep int dsep:?                  {% d=> ({"date":{"y":d[5],"m":d[7],"d":d[9]}}) %}

height        -> _ obsheight _ ":" _ float _ length_unit                         {% d=> ({"height":d[5], "u":d[7]}) %}

zone          -> _ "time"i:? "zone"i _ ":" tzone                                 {% d=> ({"zone":d[5]}) %}

tzone         -> _ utc:? ("+"|"-") zoffset                                       {% d=> parseInt(`${d[2]}${d[3]}`,10) %}

zoffset       -> "1"   [0-2]                                                     {% ([a,b])=> `${a}${b}` %}
              |  "0":? [0-9]                                                     {% ([a,b])=>     `${b}` %}

method        -> _ "method"i _ ":" _ methodtype                                  {% d=> ({"method":d[5][0]}) %}

index_error   -> _ ie _ ":" _ ("+"|"-"):? decminsec word:*                       {% d=> ({"index":d[6]*("-"==d[5]?-1:1)}) %}

watch_error   -> _ we _ ":" _ decminsec word:*                                   {% d=> ({"watch":d[5]}) %}

refraction    -> _ "refraction"i _ ":" _ "standard"i                             {% d=> ({"temp":{"v":10,"u":"c"}  ,"press":{"v":1010,"u":"mbar"}}) %}
              |  temperature break:+ pressure                                    {% d=> ({"temp":d[0],"press":d[2]}) %}
              |  pressure    break:+ temperature                                 {% d=> ({"temp":d[2],"press":d[0]}) %}

temperature   -> _ "temp"i "erature"i:? _ ":" _ float _ temp_unit                {% d=> ({"v":parseFloat(d[6]),"u":d[8]}) %}

pressure      -> _ "press"i "ure"i:?    _ ":" _ float _ press_unit               {% d=> ({"v":parseFloat(d[6]),"u":d[8]}) %}

compare       -> _ "compare"i _ ":" _ lat _ "," _ lon                            {% d=> ({"compare":[d[5],d[9]]}) %}
              |  _ "compare"i _ ":" break:+ latlon                               {% d=> ({"compare":d[5]}) %}

ded_reckoning -> _ dr         _ ":" _ lat _ "," _ lon                            {% d=> ({"dr":[d[5],d[9]]}) %}
              |  _ dr         _ ":" break:+ latlon                               {% d=> ({"dr":d[5]}) %}

heading       -> _ bearing  _ ":" _ deg360                                       {% d=> ({"bear":d[5]}) %}

speed         -> _ "speed"i _ ":" _ float _ speed_unit                           {% d=> ({"speed":d[5],"u":d[7]}) %}

sights        -> sight     break:+ sight     break:+ sight                       {% d=> [d[0],d[2],d[4]] %}
              |  sight     break:+ sight                                         {% d=> [d[0],d[2]] %}

sight         -> star break:+ time  break:+ angle                                {% d=> ({"star":d[0],"time":d[2],"angle":d[4]}) %}
              |  star break:+ angle break:+ time                                 {% d=> ({"star":d[0],"time":d[4],"angle":d[2]}) %}

star          -> _ object   _ ":" _ word                                         {% d=> d[5] %}

time          -> _ "time"i  _ ":" _ hhmmss                                       {% d=> d[5] %}

angle         -> _ alt _ ":" _ ("+"|"-"):? deg90                                 {% d=> ({"sign":("-"==d[5])?-1:1,"deg":d[6]}) %}

latlon        -> latitude  break:+ longitude                                     {% d=> [d[0],d[2]] %}
              |  longitude break:+ latitude                                      {% d=> [d[2],d[0]] %}

latitude      -> _ "lat"i "itude"i:?  _ ":" _ lat                                {% d=> d[6] %}

longitude     -> _ "lon"i "gitude"i:? _ ":" _ lon                                {% d=> d[6] %}

lat           ->             deg90 ("N"i|"S"i)                                   {% d=> ({"lat":{"sign":("s"==d[1]||"S"==d[1])?-1:1,"deg":d[0]}}) %}
              |  ("+"|"-"):? deg90                                               {% d=> ({"lat":{"sign":("-"==d[0])           ?-1:1,"deg":d[1]}}) %}

lon           ->             deg180 ("E"i|"W"i)                                  {% d=> ({"lon":{"sign":("w"==d[1]||"W"==d[1])?-1:1,"deg":d[0]}}) %}
              |  ("+"|"-"):? deg180                                              {% d=> ({"lon":{"sign":("-"==d[0])           ?-1:1,"deg":d[1]}}) %}

deg360        -> decdeg360 sep decminsec sep decminsec sep:?                     {% d=> ({"d":d[0],"m":d[2],"s":d[4]}) %}
              |  decdeg360 sep decminsec sep:?                                   {% d=> ({"d":d[0],"m":d[2],"s":0   }) %}
			  |  decdeg360 sep:?                                                 {% d=> ({"d":d[0],"m":0   ,"s":0   }) %}

deg180        -> decdeg180 sep decminsec sep decminsec sep:?                     {% d=> ({"d":d[0],"m":d[2],"s":d[4]}) %}
              |  decdeg180 sep decminsec sep:?                                   {% d=> ({"d":d[0],"m":d[2],"s":0   }) %}
		      |  decdeg180 sep:?                                                 {% d=> ({"d":d[0],"m":0   ,"s":0   }) %}

deg90         -> decdeg90 sep decminsec sep decminsec sep:?                      {% d=> ({"d":d[0],"m":d[2],"s":d[4]}) %}
              |  decdeg90 sep decminsec sep:?                                    {% d=> ({"d":d[0],"m":d[2],"s":0   }) %}
              |  decdeg90 sep:?                                                  {% d=> ({"d":d[0],"m":0   ,"s":0   }) %}

hhmmss        -> hour sep decminsec sep decminsec sep:?                          {% d=> ({"d":d[0],"m":d[2],"s":d[4]}) %}
              |  hour sep decminsec sep:?                                        {% d=> ({"d":d[0],"m":d[2],"s":0   }) %}
              |  hour sep:?                                                      {% d=> ({"d":d[0],"m":0   ,"s":0   }) %}

decdeg360     -> "0":? "360"             ("."   "0":*):?                         {% d=> 360.0 %}
              |  "0":?   "3" [0-5] [0-9] ("." [0-9]:*):?                         {% d=> parseFloat(`${d[1]}${d[2]}${d[3]}.${(d[4]?d[4][1].join(''):'0')}`) %}
              |  "0":? [1-2] [0-9] [0-9] ("." [0-9]:*):?                         {% d=> parseFloat(`${d[1]}${d[2]}${d[3]}.${(d[4]?d[4][1].join(''):'0')}`) %}
              |  "0":? "0":? [1-9] [0-9] ("." [0-9]:*):?                         {% d=> parseFloat(       `${d[2]}${d[3]}.${(d[4]?d[4][1].join(''):'0')}`) %}
              |  "0":? "0":? "0":? [0-9] ("." [0-9]:*):?                         {% d=> parseFloat(              `${d[3]}.${(d[4]?d[4][1].join(''):'0')}`) %}

decdeg180     -> "0":? "180"             ("."   "0":*):?                         {% d=> 180.0 %}
              |  "0":?   "1" [0-7] [0-9] ("." [0-9]:*):?                         {% d=> parseFloat(`${d[1]}${d[2]}${d[3]}.${(d[4]?d[4][1].join(''):'0')}`) %}
              |  "0":? "0":? [1-9] [0-9] ("." [0-9]:*):?                         {% d=> parseFloat(       `${d[2]}${d[3]}.${(d[4]?d[4][1].join(''):'0')}`) %}
              |  "0":? "0":? "0":? [0-9] ("." [0-9]:*):?                         {% d=> parseFloat(              `${d[3]}.${(d[4]?d[4][1].join(''):'0')}`) %}

decdeg90      -> "0":?  "90"       ("."   "0":*):?                               {% d=> 90.0 %}
              |  "0":? [1-8] [0-9] ("." [0-9]:*):?                               {% d=> parseFloat(`${d[1]}${d[2]}.${(d[3]?d[3][1].join(''):'0')}`) %}
              |  "0":? "0":? [0-9] ("." [0-9]:*):?                               {% d=> parseFloat(       `${d[2]}.${(d[3]?d[3][1].join(''):'0')}`) %}

hour          -> "2"   [0-4] ("." [0-9]:*):?                                     {% d=> parseFloat(`${d[0]}${d[1]}.${(d[2]?d[2][1].join(''):'0')}`) %}
              |  "1"   [0-9] ("." [0-9]:*):?                                     {% d=> parseFloat(`${d[0]}${d[1]}.${(d[2]?d[2][1].join(''):'0')}`) %}
              |  "0":? [0-9] ("." [0-9]:*):?                                     {% d=> parseFloat(       `${d[1]}.${(d[2]?d[2][1].join(''):'0')}`) %}

decminsec     -> "0":?  "60"       ("."   "0":*):?                               {% d=> 60.0 %}
              |  "0":? [1-5] [0-9] ("." [0-9]:*):?                               {% d=> parseFloat(`${d[1]}${d[2]}.${(d[3]?d[3][1].join(''):'0')}`) %}
              |  "0":? "0":? [0-9] ("." [0-9]:*):?                               {% d=> parseFloat(       `${d[2]}.${(d[3]?d[3][1].join(''):'0')}`) %}

utc           -> "UT"i
              |  "UTC"i
              |  "GMT"i

methodtype    -> "sextant"i
              |  "bubble sextant"i
              |  "theodolite"i
              |  "cellphone"i

length_unit   -> "m"                                                             {% d=> "m" %}
              |  "meter"                                                         {% d=> "m" %}
              |  "meters"                                                        {% d=> "m" %}
              |  "metre"                                                         {% d=> "m" %}
              |  "metres"                                                        {% d=> "m" %}
              |  "foot"                                                          {% d=> "f" %}
              |  "feet"                                                          {% d=> "f" %}
              |  "ft"                                                            {% d=> "f" %}

obsheight     -> ("eye "i | "observer "i | "obs. "i):? "height"i

we            -> "watch error"i
              |  "watch"i
              |  "we"i

ie            -> "index error"i 
              |  "index"i 
              |  "ie"i

temp_unit     -> "°"                                                             {% d=> "c" %} 
              |  "°C"                                                            {% d=> "c" %} 
              |  "C"                                                             {% d=> "c" %} 
              |  "Celsius"                                                       {% d=> "c" %} 
              |  "°F"                                                            {% d=> "f" %} 
              |  "F"                                                             {% d=> "f" %} 
              |  "Fahrenheit"                                                    {% d=> "f" %} 
              |  "K"                                                             {% d=> "k" %} 
              |  "Kelvin"                                                        {% d=> "k" %} 

press_unit    -> "mbar"                                                          {% d=> "mbar" %} 
              |  "millibar"                                                      {% d=> "mbar" %} 
              |  "millibars"                                                     {% d=> "mbar" %} 
              |  "Pa"                                                            {% d=> "Pa" %} 
              |  "Pascal"                                                        {% d=> "Pa" %} 
              |  "atm"                                                           {% d=> "atm" %} 
              |  "Torr"                                                          {% d=> "Torr" %} 
              |  "psi"                                                           {% d=> "psi" %} 

dr            -> ("ded"i ".":? | "deduced"i | "dead"i) _ ("rec"i ".":? | "reck"i ".":? | "reckoning"i)
              |  "dr"i

bearing       -> "heading"i
              |  "true"i:? _ "bearing"i
              |  "course"

speed_unit    -> "knot"                                                          {% d=> "kn" %} 
              |  "knots"                                                         {% d=> "kn" %} 
              |  "kn"                                                            {% d=> "kn" %} 
              |  "kt"                                                            {% d=> "kn" %} 
              |  "km/h"                                                          {% d=> "km/h" %} 
              |  "kmph"                                                          {% d=> "km/h" %} 
              |  "m/s"                                                           {% d=> "m/s" %} 
              |  "mps"                                                           {% d=> "m/s" %} 
              |  "mi/h"                                                          {% d=> "mph" %} 
              |  "mph"                                                           {% d=> "mph" %} 

alt           -> "alt"i "itude"i:? 
              |  "angle"i

object        -> "star"i
              |  "planet"i
              |  "moon"i
              |  "sun"i
              |  "body"i
              |  "sight"i
              |  "object"i
              |  "celestial"i
              |  "celestial"i _ "body"i
              |  "target"i

dist_unit     -> "km"                                                            {% d=> "km" %} 
              |  "kilometer"                                                     {% d=> "km" %} 
              |  "kilometers"                                                    {% d=> "km" %} 
              |  "kilometre"                                                     {% d=> "km" %} 
              |  "kilometres"                                                    {% d=> "km" %} 
              |  "mi"                                                            {% d=> "mi" %} 
              |  "mile"                                                          {% d=> "mi" %} 
              |  "miles"                                                         {% d=> "mi" %} 
              |  "nm"                                                            {% d=> "nm" %} 
              |  "Nm"                                                            {% d=> "nm" %} 
              |  "nautical mile"                                                 {% d=> "nm" %} 
              |  "nautical miles"                                                {% d=> "nm" %} 

word          -> [^\n\r\#]:+                                                     {% d=> d[0].join('') %}
float         -> num ("." num:?):?                                               {% d=> parseFloat(`${d[0]}.${(d[1]&&d[1][1]?d[1][1]:0)}`) %}
int           -> num                                                             {% d=> parseInt(d[0],10) %}
num           -> [0-9]:+                                                         {% d=> d[0].join('') %}
sep           -> _ "deg"i _                                                      {% d=> null %}
              |  _ "degree"i _                                                   {% d=> null %}
              |  _ "degrees"i _                                                  {% d=> null %}
              |  _ "min"i _                                                      {% d=> null %}
              |  _ "minute"i _                                                   {% d=> null %}
              |  _ "minutes"i _                                                  {% d=> null %}
              |  _ "s"i _                                                        {% d=> null %}
              |  _ "sec"i _                                                      {% d=> null %}
              |  _ "second"i _                                                   {% d=> null %}
              |  _ "seconds"i _                                                  {% d=> null %}
              |  [^-+.0-9newsNEWS\n\r\#]:+                                       {% d=> null %}
dsep          -> [^0-9\n\r\#]:+                                                  {% d=> null %}
break         -> _ comment:? nl                                                  {% d=> null %}
comment       -> "#" [^\n\r]:*                                                   {% d=> null %}
nl            -> [\n\r]                                                          {% d=> null %}
_             -> [ \t]:*                                                         {% d=> null %}
