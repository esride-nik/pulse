define(["require", "exports", "esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer", "axios"], function (require, exports, Map, MapView, FeatureLayer, axios_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Pulse = /** @class */ (function () {
        function Pulse() {
            // function(Map, MapView, FeatureLayer, VectorTileLayer, SimpleLineSymbol, watchUtils, webMercatorUtils, Point, dom) {
            //global vars
            this.mapLongLattZoom = [0, 0, 1]; //default
            this.setIntervalSpeed = 16.6; //refresh speed in ms
            this.restarting = false; //flag to control removing animation 
            this.updateField = false; //check for attribute change
            console.log("PULSE");
            this.initalise();
        }
        Pulse.prototype.initalise = function () {
            this.map = new Map({
                basemap: "dark-gray-vector"
            });
            this.view = new MapView({
                container: "viewDiv",
                map: this.map,
                zoom: 3,
                center: [0, 0]
            });
            //event listeners
            this.addEventListenerToDocumentElementValueById("play", "click", this.play);
            this.addEventListenerToDocumentElementValueById("fs-url", "blur", this.addFeatureLayer);
            this.addEventListenerToDocumentElementValueById("fs-url", "change", this.addFeatureLayer);
            // //check URL for paramaters, if there's some. Add it in.
            // var browserURL = window.location.search
            // if (browserURL != "") {
            //     updateField = true
            //     browserURL = browserURL.replace("?", '')
            //     var partsOfStr = browserURL.split(',')
            //     this.getDocumentElementValueById("fs-url") = partsOfStr[0]
            //     overRidingField = partsOfStr[1]
            //     this.getDocumentElementValueById("animation-time") = partsOfStr[2]
            //     mapLongLattZoom = [parseInt(partsOfStr[3]), parseInt(partsOfStr[4]), parseInt(partsOfStr[5])]
            // } else {
            //     defaultService()
            // }
            this.view.when(function () {
                // watchUtils.when(this.view, "stationary", updateMapLongLatt)
                // var pt = new Point({
                //     longitude: mapLongLattZoom[0],
                //     latitude: mapLongLattZoom[1]
                //   });
                // this.view.goTo({
                //     target: pt,
                //     zoom: mapLongLattZoom[2]
                // })
            });
            //once feature layer url has been set, now add it to the map.
            // addFeatureLayer()
        };
        Pulse.prototype.addEventListenerToDocumentElementValueById = function (elementId, eventName, eventListener) {
            var element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(eventName, eventListener);
            }
        };
        Pulse.prototype.getDocumentElementById = function (elementId) {
            var element = document.getElementById(elementId);
            return element;
        };
        Pulse.prototype.getDocumentElementValueById = function (elementId) {
            var element = document.getElementById(elementId);
            return element ? element.value : "";
        };
        // //if there's no paramaters, then add these in as a default.
        // private defaultService() {
        //     this.getDocumentElementValueById("fs-url") = "https://services.arcgis.com/Qo2anKIAMzIEkIJB/arcgis/rest/services/hurricanes/FeatureServer/0"
        //     this.getDocumentElementValueById("animation-time") = 10
        // }
        //this generates a new, sharable url link.
        Pulse.prototype.updateBrowserURL = function () {
            history.pushState({
                id: 'homepage'
            }, 'Home', '?' + this.getDocumentElementValueById("fs-url") + ',' + this.getDocumentElementValueById("selection") + ',' + this.getDocumentElementValueById("animation-time") + ',' + this.mapLongLattZoom);
        };
        // //when map moves, update url.
        // private updateMapLongLatt() {
        //     mapLongLattZoom = [view.center.longitude, view.center.latitude, view.zoom]
        //     updateBrowserURL()
        // }
        //adds the feature layer to the map.
        Pulse.prototype.addFeatureLayer = function () {
            var flURL = this.getDocumentElementValueById("fs-url");
            if (flURL != "") {
                this.featureLayer = new FeatureLayer({
                    url: flURL
                });
                this.map.removeAll();
                this.map.add(this.featureLayer);
                //overides ANY scale threshold added to feature layer.
                this.featureLayer.maxScale = 0;
                this.featureLayer.minScale = 100000000000;
                //rest call to get attribute minimum and maximum values.
                this.getFields(flURL);
                this.getDocumentElementById("fs-url").style.borderBottomColor = "green";
            }
            else {
                this.map.remove(this.featureLayer);
                this.getDocumentElementById("fs-url").style.borderBottomColor = "red";
            }
        };
        //populating selection drop down based on featurelayer.
        Pulse.prototype.getFields = function (flURL) {
            axios_1.default.get({
                url: flURL + "?f=json",
                type: "GET"
            }).then(function (FLfields) {
                var fieldsObj = JSON.parse(FLfields);
                this.getDocumentElementValueById("feature-layer-name").innerHTML = fieldsObj.name;
                this.updateExtent(fieldsObj.extent);
                this.select = this.getDocumentElementValueById('selection');
                if (this.select) {
                    this.select.innerHTML = '';
                }
                this.geometryType = fieldsObj.geometryType;
                this.symbolSwitcher(this.geometryType);
                for (var i = 0; i < fieldsObj.fields.length; i++) {
                    if (fieldsObj.fields[i].sqlType != "sqlTypeNVarchar") {
                        var opt = document.createElement('option');
                        opt = fieldsObj.fields[i].name;
                        opt.innerHTML = fieldsObj.fields[i].name;
                        if (i === 0 && this.updateField === true) {
                            opt = this.overRidingField;
                            opt.innerHTML = this.overRidingField;
                        }
                        if (this.updateField === true && fieldsObj.fields[i].name === this.overRidingField) {
                            opt = fieldsObj.fields[0].name;
                            opt.innerHTML = fieldsObj.fields[0].name;
                            this.updateField = false;
                        }
                        if (this.select) {
                            this.select.appendChild(opt);
                        }
                    }
                }
                this.updateBrowserURL();
            });
        };
        // private updateExtent(newExtent: Extent) {
        //     if (newExtent.spatialReference.wkid === 102100) {
        //         view.extent = newExtent
        //     }
        //     if (newExtent.spatialReference.wkid != 102100) {
        //         view.extent = {
        //             xmax: 20026375.71466102,
        //             xmin: -20026375.71466102,
        //             ymax: 9349764.174146919,
        //             ymin: -5558767.721795811
        //         }
        //     }
        // }
        Pulse.prototype.play = function () {
            //Stops any previously added animations in the frame
            this.stopAnimation();
            //There's an unknown issue caused by "ObjectID"
            //This is currently a workaround for it.
            if (this.getDocumentElementValueById("selection") === "OBJECTID") {
                if (this.getDocumentElementValueById("fs-url") != "") {
                    this.featureLayer = new FeatureLayer({
                        url: this.getDocumentElementValueById("fs-url")
                    });
                    this.map.removeAll();
                    this.map.add(this.featureLayer);
                }
            }
            //update with changed values.
            this.updateBrowserURL();
            //queries the current feature layer url and field to work out start and end frame.
            this.getMaxMin();
        };
        Pulse.prototype.getMaxMin = function () {
            var flURL = this.getDocumentElementValueById("fs-url");
            var field = this.getDocumentElementValueById("selection");
            axios_1.default.get({
                url: flURL + "/query",
                type: "GET",
                data: {
                    'f': 'pjson',
                    'outStatistics': '[{"statisticType":"min","onStatisticField":"' + field +
                        '", "outStatisticFieldName":"MinID"},{"statisticType":"max","onStatisticField":"' +
                        field + '", "outStatisticFieldName":"MaxID"}]'
                }
            }).then(function (data) {
                var dataJSONObj = JSON.parse(data);
                this.fieldToAnimate = field;
                this.startNumber(dataJSONObj.features[0].attributes.MinID);
                this.endNo = dataJSONObj.features[0].attributes.MaxID;
                //generate step number here too
                var difference = Math.abs(dataJSONObj.features[0].attributes.MinID - dataJSONObj.features[0].attributes.MaxID);
                var differencePerSecond = difference / this.getDocumentElementValueById("animation-time");
                this.stepNumber = differencePerSecond / this.setIntervalSpeed;
                this.startNo = dataJSONObj.features[0].attributes.MinID;
                this.animate(dataJSONObj.features[0].attributes.MinID);
                //adding empty frames at the start and end for fade in/out
                this.endNo += this.stepNumber * 40;
                this.startNo -= this.stepNumber * 2;
            });
        };
        Pulse.prototype.stopAnimation = function () {
            ;
            this.startNumber(0);
            this.stepNumber = null;
            this.fieldToAnimate = null;
            this.startNo = null;
            this.endNo = null;
            this.restarting = true;
        };
        Pulse.prototype.startNumber = function (value) {
            this.featureLayer.renderer = this.createRenderer(value);
        };
        // private animate(startValue) {
        //     var currentFrame = startValue
        //     var frame = function(timestamp) {
        //         if (restarting) {
        //             clearTimeout(intervalFunc);
        //             restating = false
        //         }
        //         currentFrame += stepNumber
        //         if (currentFrame > endNo) {
        //             currentFrame = startNo
        //         }
        //         startNumber(currentFrame)
        //         //animation loop.
        //         intervalFunc = setTimeout(function() {
        //             //stops it from overloading.
        //             requestAnimationFrame(frame)
        //         }, setIntervalSpeed)
        //     }
        //     //recusrive function, starting the animation.
        //     frame()
        //     return {
        //         remove: function() {
        //             animating = false
        //         }
        //     };
        // }
        // //CHANGE SYMBOLOGY TYPE HERE. (Point, Line or Polygon style)
        // private symbolSwitcher(geometryType) {
        //     //Depending on the feature layer currently added, the symbology will change here.
        //     //Supporting points, lines and polygons.
        //     if (geometryType === "esriGeometryPoint") {
        //         newSymbol = {
        //             type: "picture-marker",
        //             url: "images/PointIconImages/2.png",
        //             width: 20,
        //             height: 20
        //         }
        //         newType = 'simple'
        //     }
        //     if (geometryType === "esriGeometryPolyline") {
        //         newSymbol = {
        //             type: 'simple-line',
        //             width: 3,
        //             color: 'rgb(55, 55, 255)',
        //             opacity: 1
        //         }
        //         newType = 'simple'
        //     }
        //     if (geometryType === "esriGeometryPolygon") {
        //         newSymbol = {
        //             type: "simple-fill",
        //             color: "rgb(55, 55, 255)"
        //         }
        //         newType = 'simple'
        //     }
        // }
        Pulse.prototype.createRenderer = function (now) {
            var renderer = {
                type: this.newType,
                symbol: this.newSymbol,
                visualVariables: [{
                        type: 'opacity',
                        field: this.fieldToAnimate,
                        //stops control the fade out
                        stops: [{
                                value: now - this.stepNumber * 40,
                                opacity: 0.0
                                //Change this to 0.1 if you always want it on screen during animation
                            },
                            {
                                value: now - this.stepNumber * 20,
                                opacity: 0.3
                            },
                            {
                                value: now - this.stepNumber * 1,
                                opacity: 1
                            },
                            {
                                value: now,
                                opacity: 1
                            },
                            {
                                value: now + this.stepNumber * 2,
                                opacity: 0
                            }
                        ]
                    }]
            };
            return renderer;
        };
        return Pulse;
    }());
    exports.Pulse = Pulse;
});
//# sourceMappingURL=main.js.map