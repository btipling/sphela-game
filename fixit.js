#!/usr/local/bin/node
/**
 * @fileOverview Just a quick script to help fix some of the JSON when needed.
 */


fs = require('fs');

regions_raw = fs.readFileSync('./sphela/lib/regions.js', 'utf8');
region_info_raw = fs.readFileSync('./sphela/lib/region_info.js', 'utf8');
regions = JSON.parse(regions_raw);
region_info = JSON.parse(region_info_raw);
regions.features.forEach(function(feature) {
  region_info[feature.id].name = feature.properties.name;
});
fs.writeFileSync('./sphela/lib/region_info_names.js',
    JSON.stringify(region_info), 'utf8');
