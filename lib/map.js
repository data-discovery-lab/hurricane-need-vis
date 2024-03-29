//Initialize a map inside a div called map
var map = L.map('map', {
  zoomControl: false,
  scrollWheelZoom: false,
  dragging: false,
  attributionControl: false,
}).setView([29.76, -95.37], 10.3);

var current_day = '0827';
var current_hour = '23';
var init_region_id = 30;
var init_region_name = 'Downtown';
var geojson;
var style_override = {};
var style_target = function (f) {
  return f.properties.count
};

function merge_styles(base, new_styles) {
  for (var attrname in new_styles) {
    base[attrname] = new_styles[attrname];
  }
  return base;
}

//set color palatte
function getColor(d) {
  return d > 80 ? '#67000d' :
    d > 60 ? '#cb181d' :
    d > 40 ? '#ef3b2c' :
    d > 20 ? '#fb6a4a' :
    d > 0 ? '#fc9272' : '#ffffff'
};

//attach color palatte to category
function style(feature, color) {
  var target = style_target(feature);
  var fillColor = (!color) ? getColor(target) : color;
  var default_style = {
    fillColor: fillColor,
    weight: 1,
    opacity: 1,
    color: 'grey',
    fillOpacity: 1
  };
  return merge_styles(default_style, style_override);
};

//new function
function showConcerns(ids) {
  needs_arr = ['water', 'help', 'need', 'people', 'store', 'safe', 'home', 'flood', 'family', 'school', 'nurse', 'support', 'donate', 'food', 'service', 'call', 'rescue', 'donation', 'relief', 'shelter', 'volunteer', 'community', 'boat', 'money', 'victim', 'supply', 'car', 'power', 'emergency', 'truck', 'dog', 'gas', 'damage', 'contact',  'text', 'tank', 'clothes', 'trail', 'fund', 'bottle', 'assistance', 'oil', 'advisory', 'cable'];
  for (let i = 0; i < ids.length; i++) {
    id_index = needs_arr.indexOf(ids[i])
    if (id_index > -1) {
      needs_arr.splice(id_index, 1);
    }
  }
  for (let j = 0; j < needs_arr.length; j++) {
    var x = document.getElementById(needs_arr[j]);
    x.style.opacity = 0.1
  }
}

function hideConcerns() {
  needs_arr = ['water', 'help', 'need', 'people', 'store', 'safe', 'home', 'flood', 'family', 'school', 'nurse', 'support', 'donate', 'food', 'service', 'call', 'rescue', 'donation', 'relief', 'shelter', 'volunteer', 'community', 'boat', 'money', 'victim', 'supply', 'car', 'power', 'emergency', 'truck', 'dog', 'gas', 'damage', 'contact', 'text', 'tank', 'clothes', 'trail', 'fund', 'bottle', 'assistance', 'oil', 'advisory', 'cable'];
  for (let i = 0; i < needs_arr.length; i++) {
    var x = document.getElementById(needs_arr[i]);
    x.style.opacity = 0.9
  }
}

function showTimeSeries(day, region_prop) {
  var regdata = region_data;
  var region_name = region_prop.name;
  title_name = "Tweet Rate Percentage: " + region_name + " (Date: " + day + ")"
  for (i = 0; i < regdata[day].length; i++) {
    if (regdata[day][i]["region_id"] == region_prop.dist_num) {
      var x_row = []
      for (j = 0; j < regdata[day][i]["needs_frequency"].length; j++) {
          let tmp = regdata[day][i]["needs_frequency"][j];
          x_row.push(tmp)
      }
      var chart = c3.generate({
        bindto: '#chrt',
        data: {
          columns: x_row,
          types: {
            tweetWithNeeds: 'area-spline',
            tweetWithoutNeeds: 'bar'
          },
            names: {
              tweetWithoutNeeds: 'Tweets without needs',
                tweetWithNeeds: 'Tweets with needs'
            }
        },
           axis: {
              y: {
                max: 1,
                tick: {
                values: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
                }
              }
           },
        title: {
            text: title_name
        }
      });
      break;
    }
  }
}

//clean the previous wordCloud for adding a new one
function clean_wordCloud() {
  $("#chart").empty();
}

//To show the regionName of the wordCloud
function showRegionName(ids) {
  $('#region_name').children().remove();
  var html = '<span id="ids" style="text-align: center; display: block; ">Region: ' + ids + '</span>'
  $('#region_name').append(html);
}

//To show streamGraph
function showCanvas(region_name, dist_num) {
  $(".concern_flow").empty()
  var html = '<canvas id="streamgraph"></canvas>';
  $(".concern_flow").append(html);
  showStreamgraph(dist_num);
  $('.concern_region_name').text('Region: ' + region_name);
}

function showTweet(userId, tweet, timestamp) {
  $(".tweet").empty();
  Tweet(userId, tweet, timestamp);
}

function highlightFeature(e) {
  var concerns = [];
  var layer = e.target;
  var needs = []
  //on hover change color from what was defined in function style(feature)
  style_override = {
    weight: 0.2,
    fillOpacity: 0.8
  }
  geojson.resetStyle(e.target);

  if (!L.Browser.ie && !L.Browser.opera) {
    layer.bringToFront();
  }

  var region_name = layer.feature.properties.name;
  let region_id = layer.feature.properties.dist_num;
  display_graphs_for_region(region_id, region_name);
}

function needsByDay(day){
  window.current_day = day;
  needsByHours(current_hour);
  let initPage = true;
  display_graphs_for_region(init_region_id, init_region_name, initPage);  
}


function needsByHours(hour){
  //merge the two data sets
  // hour = hour.toString();
  let my_day = window.current_day;
  data = all_data.features[my_day][hour];
  for (i = 0; i < districts.features.length; i++) {
    for (j = 1; j < 89; j++) { //the dist_num start from 1 to 88
      if (districts.features[i].properties.dist_num == j) {
          // sum_needs.append(data[k][j].needs);
          if(data[j].needs.length > 0){
            districts.features[i].properties.concern = data[j].needs;
            districts.features[i].properties.userId = data[j].userId;
            districts.features[i].properties.tweet = data[j].tweet;
            districts.features[i].properties.timestamp = data[j].timestamp;
            districts.features[i].properties.wordfreq = data[j].wordfreq;
          }
          else{
            districts.features[i].properties.concern = "";
            districts.features[i].properties.userId = "";
            districts.features[i].properties.tweet = "";
            districts.features[i].properties.timestamp = "";
            districts.features[i].properties.wordfreq = "";
          }
      districts.features[i].properties.count = 10*data[j].count;
      }
    }
  };
  map.eachLayer(function (layer) {
    map.removeLayer(layer)
  });

  var geojson = L.geoJson(districts, {
      style: style,
      onEachFeature: onEachFeature
  }).addTo(map);
}


function display_graphs_for_region(region_id, region_name, initial=false) {
  clean_wordCloud();
  showTimeSeries(current_day, {dist_num: region_id, name: region_name });
  showRegionName(region_name);
  let all_districts = districts;
  // Extract other contents from region id.
  // The district start from 0, but dist_num start from 1
  let concerns = all_districts.features[region_id-1].properties.concern.toString().split(',');
  // let userContent = all_districts.features[region_id-1].properties.user_content;
  let userId = all_districts.features[region_id-1].properties.userId;
  let tweet = all_districts.features[region_id-1].properties.tweet;
  let timestamp = all_districts.features[region_id-1].properties.timestamp;
  let tweet_content = all_districts.features[region_id-1].properties.wordfreq;
  // console.log(all_districts.features[region_id-1].properties.dist_num);
  // console.log(tweet);
  if (initial == false){
      showConcerns(concerns);
  }
  drawWordCloud(tweet_content);
  showCanvas(region_name, region_id);
  showTweet(userId, tweet, timestamp);
}

function initial(region_id, region_name){
  needsByHours(current_hour);
  let initPage = true;
  display_graphs_for_region(region_id, region_name, initPage);
}

initial(init_region_id, init_region_name)

//reset highlight when hovering out
function resetHighlight(e) {
  style_override = {};
  var layer = e.target;
  geojson.resetStyle(layer);
  hideConcerns();
  clean_wordCloud();
  showRegionName('Houston');
  drawWordCloud(userAll_content); //show All Houston tweet
}

var geojson = L.geoJson(districts, {
  style: style,
  onEachFeature: onEachFeature
}).addTo(map);

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
  });
}

//create an legend
var legend = L.control({
  position: 'topleft'
})
legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
    grades = ['100', '80', '60', '40', '20', '0'],
    labels = [];

  // loop through categories and generate a label with a colored square for each interval
  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      '<i style="background:' + getColor(grades[i]) + '"></i> ' +
      grades[i] + '<br>';
  }
  return div;
};
legend.addTo(map);


$('#ex21').on('slide', function (ev) {
    let hour = $('#ex21').val();
    if(hour.length < 2){
      hour = '0' + hour;
    }
    else{
      hour = hour.toString();
    }
    window.current_hour = hour;
    needsByHours(current_hour);
});
$('#ex21').on('slideStop', function (ev) {
    let hour = $('#ex21').val().toString();
    if(hour.length < 2){
      hour = '0' + hour;
    }
    else{
      hour = hour.toString();
    }
    window.current_hour = hour;
    needsByHours(current_hour);
});
$("#ex21").slider({
	tooltip: 'always'
});
