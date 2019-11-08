# Pulse

This application animates features with the WebGL Renderer in the ArcGIS API for JavaScript. 

## setlist.fm Pulse

This is a client application that searches the portal setlist.fm for recent concerts of an artist and puts them on a globe, using a client-side feature layer and line graphics. 

The client uses a node.js middleware to get to the Setlist.FM API. The middleware can be run locally, but there is also a demo installation on [heroku](https://setlist-fm-connector.herokuapp.com/). For local install, please find the server component at [Github](https://github.com/esride-nik/setlist-fm-connector).

## Original application

The Setlist.FM capability was built on top of a fork from the orinal application by Sean McGee, Esri UK. Please read about it on the [geonet blog](https://community.esri.com/people/smcgeeesriuk-esridist/blog/2018/06/29/feature-layer-animations-with-webgl).

## References

* View the original application [here](https://maplabs.github.io/pulse/index.html).
* View the TypeScriptified application [here](https://esride-nik.github.io/pulse/).