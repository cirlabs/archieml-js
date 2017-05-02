This converts the (messy) html from a downloaded google doc to archieML/json.

A fork of the google-drive script from the NY Times' Archie ML script. I removed all the google-drive stuff from it and just kept the handy html parsing stuff.

Takes an input html `input.html` and outputs a json file, `output.json`.

To run:

`node convert-html.js`
