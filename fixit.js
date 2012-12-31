#!/usr/local/bin/node

console.log('running');

fs = require('fs');

console.log('start reading');
regions_raw = fs.readFileSync('./sphela/lib/regions.js', 'utf8');
console.log('still reading');
region_info_raw = fs.readFileSync('./sphela/lib/region_info.js', 'utf8');
console.log('start parsing');
regions = JSON.parse(regions_raw);
console.log('still parsing');
region_info = JSON.parse(region_info_raw);
regions.features.forEach(function(feature) {
  console.log(feature);
  region_info[feature.id].name = feature.properties.name;
  console.log('feature', region_info[feature.id]);
});
fs.writeFileSync('./sphela/lib/region_info_names.js',
    JSON.stringify(region_info), 'utf8');
