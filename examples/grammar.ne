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

date          -> _ "date"i _ ":" _ int sep:+ int sep:+ int                       {% d=> ({"date":{"y":d[5],"m":d[7],"d":d[9]}}) %}

height        -> _ obsheight _ ":" _ float _ meter                               {% d=> ({"height":d[5]}) %}

zone          -> _ "time"i:? "zone"i _ ":" tzone                                 {% d=> ({"zone":d[5]}) %}

tzone         -> _ utc:? ("+"|"-") zoffset                                       {% d=> parseInt(`${d[2]}${d[3]}`,10) %}

zoffset       -> "1"   [0-2]                                                     {% ([a,b])=> `${a}${b}` %}
              |  "0":? [0-9]                                                     {% ([a,b])=>     `${b}` %}

method        -> _ "method"i _ ":" _ methodtype                                  {% d=> ({"method":d[5][0]}) %}

index_error   -> _ ie _ ":" _ ("+"|"-"):? decminsec sep:*                        {% d=> ({"index":d[6]*("-"==d[5]?-1:1)}) %}

watch_error   -> _ we _ ":" _ decminsec sep:*                                    {% d=> ({"watch":d[5]}) %}

refraction    -> _ "refraction"i _ ":" _ "standard"i                             {% d=> ({"temp":10  ,"press":1010}) %}
              |  temperature break:+ pressure                                    {% d=> ({"temp":d[0],"press":d[2]}) %}
              |  pressure    break:+ temperature                                 {% d=> ({"temp":d[2],"press":d[0]}) %}

temperature   -> _ "temp"i "erature"i:? _ ":" _ float _ celsius                  {% d=> parseFloat(d[6]) %}

pressure      -> _ "press"i "ure"i:?    _ ":" _ float _ mbar                     {% d=> parseFloat(d[6]) %}

compare       -> _ "compare"i _ ":" _ lat _ "," _ lon                            {% d=> ({"compare":[d[5],d[9]]}) %}
              |  _ "compare"i _ ":" break:+ latlon                               {% d=> ({"compare":d[5]}) %}

ded_reckoning -> _ dr         _ ":" _ lat _ "," _ lon                            {% d=> ({"dr":[d[5],d[9]]}) %}
              |  _ dr         _ ":" break:+ latlon                               {% d=> ({"dr":d[5]}) %}

heading       -> _ bearing  _ ":" _ deg360                                       {% d=> ({"bear":d[5]}) %}

speed         -> _ "speed"i _ ":" _ float _ knot                                 {% d=> ({"speed":d[5]}) %}

sights        -> sight     break:+ sight     break:+ sight                       {% d=> [d[0],d[2],d[4]] %}
              |  sight     break:+ sight     break:+ landmark                    {% d=> [d[0],d[2],d[4]] %}
              |  sight     break:+ landmark  break:+ sight                       {% d=> [d[0],d[4],d[2]] %}
              |  landmark  break:+ sight     break:+ sight                       {% d=> [d[2],d[4],d[0]] %}

sight         -> star break:+ time  break:+ angle                                {% d=> ({"star":d[0],"time":d[2],"angle":d[4]}) %}
              |  star break:+ angle break:+ time                                 {% d=> ({"star":d[0],"time":d[4],"angle":d[2]}) %}

landmark      -> markname break:+ latitude  break:+ longitude break:+ distance   {% d=> ({"mark":d[0],"lat":d[2].lat,"lon":d[4].lon,"dist":d[6]}) %}
              |  markname break:+ longitude break:+ latitude  break:+ distance   {% d=> ({"mark":d[0],"lat":d[4].lat,"lon":d[2].lon,"dist":d[6]}) %}
              |  markname break:+ distance  break:+ latitude  break:+ longitude  {% d=> ({"mark":d[0],"lat":d[4].lat,"lon":d[6].lon,"dist":d[2]}) %}
              |  markname break:+ distance  break:+ longitude break:+ latitude   {% d=> ({"mark":d[0],"lat":d[6].lat,"lon":d[4].lon,"dist":d[2]}) %}
              |  markname break:+ latitude  break:+ distance  break:+ longitude  {% d=> ({"mark":d[0],"lat":d[2].lat,"lon":d[6].lon,"dist":d[4]}) %}
              |  markname break:+ longitude break:+ distance  break:+ latitude   {% d=> ({"mark":d[0],"lat":d[6].lat,"lon":d[2].lon,"dist":d[4]}) %}

star          -> _ object   _ ":" _ word                                         {% d=> d[5] %}

time          -> _ "time"i  _ ":" _ hhmmss                                       {% d=> d[5] %}

angle         -> _ alt _ ":" _ ("+"|"-"):? deg90                                 {% d=> ({"sign":("-"==d[5])?-1:1,"deg":d[6]}) %}

markname      -> _ "land"i:? "mark"i  _ ":" _ word                               {% d=> d[6] %}

distance      -> _ "dist"i "ance"i:?  _ ":" _ float _ km                         {% d=> d[6] %}

latlon        -> latitude  break:+ longitude                                     {% d=> [d[0],d[2]] %}
              |  longitude break:+ latitude                                      {% d=> [d[2],d[0]] %}

latitude      -> _ "lat"i "itude"i:?  _ ":" _ lat                                {% d=> d[6] %}

longitude     -> _ "lon"i "gitude"i:? _ ":" _ lon                                {% d=> d[6] %}

lat           -> ("+"|"-"):? deg90                                               {% d=> ({"lat":{"sign":("-"==d[0])           ?-1:1,"deg":d[1]}}) %}
              |              deg90 _ ("N"i|"S"i):?                               {% d=> ({"lat":{"sign":("s"==d[2]||"S"==d[2])?-1:1,"deg":d[0]}}) %}

lon           -> ("+"|"-"):? deg180                                              {% d=> ({"lon":{"sign":("-"==d[0])           ?-1:1,"deg":d[1]}}) %}
              |              deg180 _ ("E"i|"W"i):?                              {% d=> ({"lon":{"sign":("w"==d[2]||"W"==d[2])?-1:1,"deg":d[0]}}) %}

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

utc           -> "UT"i
              |  "UTC"i
              |  "GMT"i

methodtype    -> "sextant"i
              |  "bubble sextant"i
              |  "theodolite"i
              |  "cellphone"i

meter         -> "m"i 
              |  "meter"i 
              |  "meters"i 
              |  "metre"i 
              |  "metres"i

obsheight     -> ("eye "i | "observer "i | "obs. "i):? "height"i

we            -> "watch error"i
              |  "watch"i
              |  "we"i

ie            -> "index error"i 
              |  "index"i 
              |  "ie"i

celsius       -> "°" 
              |  "°C"i 
              |  "C"i 
              |  "Celsius"i

mbar          -> "mbar"i 
              |  "millibar"i 
              |  "millibars"i

dr            -> ("ded"i ".":? | "deduced"i | "dead"i) _ ("rec"i ".":? | "reck"i ".":? | "reckoning"i)
              |  "dr"i

bearing       -> "heading"i
              |  "true"i:? _ "bearing"i

knot          -> "knot"i
              |  "knots"i
              |  "kn"i

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

km            -> "km"i
              |  "kilometer"i
              |  "kilometers"i
              |  "kilometre"i
              |  "kilometres"i

word          -> [^\n\r\#]:+                                                     {% d=> d[0].join('') %}
float         -> num ("." num:?):?                                               {% d=> parseFloat(`${d[0]}.${(d[1]&&d[1][1]?d[1][1]:0)}`) %}
int           -> num                                                             {% d=> parseInt(d[0],10) %}
num           -> [0-9]:+                                                         {% d=> d[0].join('') %}
sep           -> [^.0-9\n\r\#]                                                   {% d=> null %}
break         -> _ comment:? nl                                                  {% d=> null %}
comment       -> "#" [^\n\r]:*                                                   {% d=> null %}
nl            -> [\n\r]                                                          {% d=> null %}
_             -> [ \t]:*                                                         {% d=> null %}
