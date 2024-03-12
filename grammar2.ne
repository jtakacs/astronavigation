@preprocessor esmodule
observation   -> break:* required break:+ (optional break:+):* sights break:*    {% d=>d[1].concat(d[3].map(v=>v[0][0])).concat(d[4]) %}

required      -> date   break:+ height                                           {% d=> [d[0],d[2]] %}
              |  height break:+ date                                             {% d=> [d[2],d[0]] %}

optional      -> zone
              |  method
              |  index_error
              |  watch_error
              |  refraction
              |  compare
              |  ded_reckoning
              |  heading
              |  speed

date          -> _ "date" _ ":" _ int sep:+ int sep:+ int                       {% d=> ({"date":{"y":d[5],"m":d[7],"d":d[9]}}) %}

height        -> _ obsheight _ ":" _ float _ meter                               {% d=> ({"height":d[5]}) %}

zone          -> _ "time":? "zone" _ ":" tzone                                 {% d=> ({"zone":d[5]}) %}

tzone         -> _ utc:? ("+"|"-") zoffset                                       {% d=> parseInt(`${d[2]}${d[3]}`,10) %}

zoffset       -> "1"   [0-2]                                                     {% ([a,b])=> `${a}${b}` %}
              |  "0":? [0-9]                                                     {% ([a,b])=>     `${b}` %}

method        -> _ "method" _ ":" _ methodtype                                  {% d=> ({"method":d[5][0]}) %}

index_error   -> _ ie _ ":" _ decminsec sep:*                                    {% d=> ({"index":d[5]}) %}

watch_error   -> _ we _ ":" _ decminsec sep:*                                    {% d=> ({"watch":d[5]}) %}

refraction    -> _ "refraction" _ ":" _ "standard"                             {% d=> ({"temp":10  ,"press":1010}) %}
              |  temperature break:+ pressure                                    {% d=> ({"temp":d[0],"press":d[2]}) %}
              |  pressure    break:+ temperature                                 {% d=> ({"temp":d[2],"press":d[0]}) %}

temperature   -> _ "temp" "erature":? _ ":" _ float _ celsius                  {% d=> parseFloat(d[6]) %}

pressure      -> _ "press" "ure":?    _ ":" _ float _ mbar                     {% d=> parseFloat(d[6]) %}

compare       -> _ "compare" _ ":" _ lat _ "," _ lon                            {% d=> ({"compare":[d[5],d[9]]}) %}
              |  _ "compare" _ ":" break:+ latlon                               {% d=> ({"compare":d[5]}) %}

ded_reckoning -> _ dr         _ ":" _ lat _ "," _ lon                            {% d=> ({"dr":[d[5],d[9]]}) %}
              |  _ dr         _ ":" break:+ latlon                               {% d=> ({"dr":d[5]}) %}

heading       -> _ bearing  _ ":" _ deg360                                       {% d=> ({"bear":d[5]}) %}

speed         -> _ "speed" _ ":" _ float _ knot                                 {% d=> ({"speed":d[5]}) %}

sights        -> sight     break:+ sight     break:+ sight                       {% d=> [d[0],d[2],d[4]] %}
              |  sight     break:+ sight     break:+ landmark                    {% d=> [d[0],d[2],d[4]] %}
              |  sight     break:+ landmark  break:+ sight                       {% d=> [d[0],d[4],d[2]] %}
              |  landmark  break:+ sight     break:+ sight                       {% d=> [d[2],d[4],d[0]] %}

sight         -> star break:+ time  break:+ angle                                {% d=> [d[0],d[2],d[4]] %}
              |  star break:+ angle break:+ time                                 {% d=> [d[0],d[4],d[2]] %}

landmark      -> markname break:+ latitude  break:+ longitude break:+ distance   {% d=> [d[0],d[2],d[4],d[6]] %}
              |  markname break:+ longitude break:+ latitude  break:+ distance   {% d=> [d[0],d[4],d[2],d[6]] %}
              |  markname break:+ distance  break:+ latitude  break:+ longitude  {% d=> [d[0],d[4],d[6],d[2]] %}
              |  markname break:+ distance  break:+ longitude break:+ latitude   {% d=> [d[0],d[6],d[4],d[2]] %}
              |  markname break:+ latitude  break:+ distance  break:+ longitude  {% d=> [d[0],d[2],d[6],d[4]] %}
              |  markname break:+ longitude break:+ distance  break:+ latitude   {% d=> [d[0],d[6],d[2],d[4]] %}

star          -> _ object   _ ":" _ word                                         {% d=> ({"star":d[5]}) %}

time          -> _ "time"  _ ":" _ hhmmss                                       {% d=> ({"time":d[5]}) %}

angle         -> _ alt _ ":" _ ("+"|"-"):? deg90                                 {% d=> ({"angle":{"sign":("-"==d[5])?-1:1,"deg":d[6]}}) %}

markname      -> _ "land":? "mark"  _ ":" _ word                               {% d=> ({"mark":d[6]}) %}

distance      -> _ "dist" "ance":?  _ ":" _ float _ km                         {% d=> ({"dist":d[6]}) %}

latlon        -> latitude  break:+ longitude                                     {% d=> [d[0],d[2]] %}
              |  longitude break:+ latitude                                      {% d=> [d[2],d[0]] %}

latitude      -> _ "lat" "itude":?  _ ":" _ lat                                {% d=> d[6] %}

longitude     -> _ "lon" "gitude":? _ ":" _ lon                                {% d=> d[6] %}

lat           -> ("+"|"-"):? deg90                                               {% d=> ({"lat":{"sign":("-"==d[0])           ?-1:1,"deg":d[1]}}) %}
              |              deg90 _ ("N"|"S"):?                               {% d=> ({"lat":{"sign":("s"==d[2]||"S"==d[2])?-1:1,"deg":d[0]}}) %}

lon           -> ("+"|"-"):? deg180                                              {% d=> ({"lon":{"sign":("-"==d[0])           ?-1:1,"deg":d[1]}}) %}
              |              deg180 _ ("E"|"W"):?                              {% d=> ({"lon":{"sign":("w"==d[2]||"W"==d[2])?-1:1,"deg":d[0]}}) %}

deg360        -> decdeg360 sep:+ decminsec sep:+ decminsec sep:*                 {% d=> ({"d":d[0],"m":d[2],"s":d[4]}) %}
              |  decdeg360 sep:+ decminsec sep:*                                 {% d=> ({"d":d[0],"m":d[2],"s":0   }) %}
			  |  decdeg360 sep:*                                                 {% d=> ({"d":d[0],"m":0   ,"s":0   }) %}

deg180        -> decdeg180 sep:+ decminsec sep:+ decminsec sep:*                 {% d=> ({"d":d[0],"m":d[2],"s":d[4]}) %}
              |  decdeg180 sep:+ decminsec sep:*                                 {% d=> ({"d":d[0],"m":d[2],"s":0   }) %}
		      |  decdeg180 sep:*                                                 {% d=> ({"d":d[0],"m":0   ,"s":0   }) %}

deg90         -> decdeg90 sep:+ decminsec sep:+ decminsec sep:*                  {% d=> ({"d":d[0],"m":d[2],"s":d[4]}) %}
              |  decdeg90 sep:+ decminsec sep:*                                  {% d=> ({"d":d[0],"m":d[2],"s":0   }) %}
              |  decdeg90 sep:*                                                  {% d=> ({"d":d[0],"m":0   ,"s":0   }) %}

hhmmss        -> hour sep:+ decminsec sep:+ decminsec sep:*                      {% d=> ({"d":d[0],"m":d[2],"s":d[4]}) %}
              |  hour sep:+ decminsec sep:*                                      {% d=> ({"d":d[0],"m":d[2],"s":0   }) %}
              |  hour sep:*                                                      {% d=> ({"d":d[0],"m":0   ,"s":0   }) %}

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

utc           -> "UT"
              |  "UTC"
              |  "GMT"

methodtype    -> "sextant"
              |  "bubble sextant"
              |  "theodolite"
              |  "cellphone"

meter         -> "m" 
              |  "meter" 
              |  "meters" 
              |  "metre" 
              |  "metres"

obsheight     -> ("eye " | "observer " | "obs. "):? "height"

we            -> "watch error"
              |  "watch"
              |  "we"

ie            -> "index error" 
              |  "index" 
              |  "ie"

celsius       -> "°" 
              |  "°C" 
              |  "C" 
              |  "Celsius"

mbar          -> "mbar" 
              |  "millibar" 
              |  "millibars"

dr            -> ("ded" ".":? | "deduced" | "dead") _ ("rec" ".":? | "reck" ".":? | "reckoning")
              |  "dr"

bearing       -> "heading"
              |  "true":? _ "bearing"

knot          -> "knot"
              |  "knots"
              |  "kn"

alt           -> "alt" "itude":? 
              |  "angle"

object        -> "star"
              |  "planet"
              |  "body"
              |  "sight"
              |  "object"
              |  "celestial"
              |  "celestial" _ "body"
              |  "target"

km            -> "km"
              |  "kilometer"
              |  "kilometers"
              |  "kilometre"
              |  "kilometres"

word          -> [^\n\r\#]:+                                                     {% d=> d[0].join('') %}
float         -> num ("." num:?):?                                               {% d=> parseFloat(`${d[0]}.${(d[1]&&d[1][1]?d[1][1]:0)}`) %}
int           -> num                                                             {% d=> parseInt(d[0],10) %}
num           -> [0-9]:+                                                         {% d=> d[0].join('') %}
sep           -> [^.0-9\n\r\#]                                                   {% d=> null %}
break         -> _ comment:? nl                                                  {% d=> null %}
comment       -> "#" [^\n\r]:*                                                   {% d=> null %}
nl            -> [\n\r]                                                          {% d=> null %}
_             -> [ \t]:*                                                         {% d=> null %}
