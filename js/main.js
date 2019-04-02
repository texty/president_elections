let map = L.map('map')
    .setView([50.455779, 30.464253], 7);

let zelenskiColor = "#000253";
let poroshenkoColor = "#bc3939";
let closeResultColor = "#874e8e";
let emptyColor = "#dddddd";


let legend = L.control({position: 'topright'});

legend.onAdd = function (map) {

var div = L.DomUtil.create('div', 'info legend'),
    grades = [zelenskiColor, closeResultColor, poroshenkoColor],
    labels = ["Зеленський", "Близький результат" ,"Порошенко"];

// div.innerHTML += "<h3>Легенда</h3>"

// loop through our density intervals and generate a label with a colored square for each interval
for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
        '<span class="dot" style="background:' + grades[i] + '"></span> ' + " " + labels[i] +'<br>';
}

return div;
};

legend.addTo(map);



// L.tileLayer("http://{s}.sm.mapstack.stamen.com/(toner-background,$fff[difference],$fff[@23],$fff[hsl-saturation@20],toner-lines[destination-in])/{z}/{x}/{y}.png")
//   //L.tileLayer("http://{s}.sm.mapstack.stamen.com/(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/{z}/{x}/{y}.png")
//   .addTo(map);

wget(['electionData.json'], function (electionPolygon) {

    let tj = JSON.parse(electionPolygon);
    let poly = topojson.feature(tj, tj.objects["simplified.merged"]);


    function opacify(color, op) {
        op = Math.min(op, 1);

        color = d3.color(color);

        return d3.rgb(
            opacify_component(color.r, op) / 255,
            opacify_component(color.g, op) / 255,
            opacify_component(color.b, op) / 255
        )
        //  .toString();        

        function opacify_component(c, op) {
            return c * op + (1 - op) * 255;
        }
    }

    let selected;


    let shapes = L.glify.shapes({
        map: map,
        click: function (e, feature) {

            if (selected != undefined) {
                selected.remove()
            }

            // adding polygon on selected 
            selected = L.geoJSON({ type: 'Feature Collection', features: [feature] }, {style: {color: 'yellow'}}).addTo(map);

            let z = feature.properties.z  ? feature.properties.z : 'Немає даних'
            let p = feature.properties.p  ? feature.properties.p : 'Немає даних'
            let yavka = feature.properties.v9/feature.properties.v2 * 100
            yavka = yavka == NaN ? yavka : "Немає даних"
            console.log(yavka);

            L.popup()
                .setLatLng(e.latlng)
                .setContent("<b>" + "Номер дільниці: " + feature.properties.d + "</b>" 
                            + "</br>" + "<span>Проголосували за Зеленського: "  
                            + z +  "</span>"
                            + "</br>" + "<span>Проголосували за Порошенка: "  
                            + p +  "</span>"  
                            + "</br>" + "<span>Явка на дільниці: "  
                            + yavka +  "</span>"                           
                            )
                .openOn(map);
        },
        opacity: 1,
        color: function (index, feature) {
            if (!feature.properties.v9) {
                return opacify(emptyColor, 1)
            }

            let zelenski = feature.properties.z / feature.properties.v9 * 100
            let poroshenko = feature.properties.p / feature.properties.v9 * 100

            let yavka = feature.properties.v2 / 1000

            let diff = zelenski - poroshenko

            let color;


            // if difference between P and Z is small
            if (Math.abs(diff) < 10) {

                color = opacify(closeResultColor, yavka)

            }
            // if difference between P and Z is bigger than 10%
            else {
                // if Z has more votes
                if (diff > 0) {
                    color = opacify(zelenskiColor, yavka)
                    // color = {
                    // 'r': 0,
                    // 'g': 0.71,
                    // 'b': 0.28       
                    // }
                }
                // if P has more votes
                else {
                    color = opacify(poroshenkoColor, yavka)

                }
            }

            return color
        },
        data: poly
    });

    console.log(shapes);


});

// request data from json
function wget(urls, fn) {
    let results = [],
        complete = 0,
        total = urls.length;

    urls.forEach(function (url, i) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function () {
            if (request.status < 200 && request.status > 400) return;
            results[i] = request.responseText;
            complete++;
            if (complete === total) fn.apply(null, results);
        };
        request.send();
    });
}