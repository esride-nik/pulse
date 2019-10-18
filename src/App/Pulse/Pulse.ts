import Map = require("esri/Map");
import MapView = require("esri/views/MapView");
import FeatureLayer = require("esri/layers/FeatureLayer");
import VectorTileLayer = require("esri/layers/VectorTileLayer");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import watchUtils = require("esri/core/watchUtils");
import webMercatorUtils = require("esri/geometry/support/webMercatorUtils");
import Point = require("esri/geometry/Point");
import dom = require("dojo/dom");
import { Extent } from "esri/geometry";
import { Renderer } from "esri/renderers";
// import axios from 'axios';

export class Pulse {
// function(Map, MapView, FeatureLayer, VectorTileLayer, SimpleLineSymbol, watchUtils, webMercatorUtils, Point, dom) {
    //global vars
    private mapLongLatZoom = [0, 0, 1] //default
    private endNo: any; //highest number in the attribute
    private startNo: any; //lowest number in attribute
    private fieldToAnimate: any; //attribute selected 
    private stepNumber: any; //increment value
    private setIntervalSpeed = 16.6 //refresh speed in ms
    private restarting = false //flag to control removing animation 
    private updateField = false //check for attribute change
    private intervalFunc: any; //animation interval name
    private overRidingField: any; //casts url field as no.1 selection in attribute selector
    private mapView: MapView;
    private map: Map;
    private featureLayer: FeatureLayer;
    private select: HTMLElement | null;

    //for recasting global symbols
    private geometryType: any; //the geometry type of the feature
    private newSymbol: Symbol;
    private newType: any;
    private config: any;

    public constructor(map: Map, mapView: MapView, config: any) {
        this.map = map;
        this.mapView = mapView;
        this.config = config;
        this.initalise();
    }
    
    private initalise = () => {

        //event listeners
        this.addEventListenerToDocumentElementValueById("play", "click", this.play);
        this.addEventListenerToDocumentElementValueById("fs-url", "blur", this.addFeatureLayer);
        this.addEventListenerToDocumentElementValueById("fs-url", "change", (evt: any) => this.addFeatureLayer);
    
        //check URL for paramaters, if there's some. Add it in.
        var browserURL = window.location.search
        if (browserURL != "") {
            this.updateField = true;
            browserURL = browserURL.replace("?", '');
            var partsOfStr = browserURL.split(',');
            // this.getDocumentElementById("fs-url").value = partsOfStr[0];
            // this.overRidingField = partsOfStr[1];
            // this.getDocumentElementById("animation-time").value = partsOfStr[2];
            // this.mapLongLatZoom = [parseInt(partsOfStr[3]), parseInt(partsOfStr[4]), parseInt(partsOfStr[5])];
    
        } else {
            this.defaultService();
        }

        this.mapView.when(() => {
            this.mapView.watch("stationary", this.updateMapLongLat);
            
            var pt = new Point({
                longitude: this.mapLongLatZoom[0],
                latitude: this.mapLongLatZoom[1]
              });
    
            this.mapView.goTo({
                target: pt,
                zoom: this.mapLongLatZoom[2]
            })
        })
        //once feature layer url has been set, now add it to the map.
        // addFeatureLayer()
    }

    private addEventListenerToDocumentElementValueById(elementId: string, eventName: string, eventListener: EventListener) {
        let element: HTMLInputElement = <HTMLInputElement>document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventName, eventListener);
        }
    }

    private getDocumentElementById(elementId: string) {
        let element: HTMLInputElement = <HTMLInputElement>document.getElementById(elementId);
        return element;
    }

    private getDocumentElementValueById(elementId: string) {
        let element: HTMLInputElement = <HTMLInputElement>document.getElementById(elementId);
        return element ? element.value : "";
    }

    //if there's no parameters, then add these in as a default.
    private defaultService() {
        this.getDocumentElementById("fs-url").value = this.config.defaultService;
        this.getDocumentElementById("animation-time").value = "10";
    }

    //this generates a new, sharable url link.
    private updateBrowserURL() {
        history.pushState({
            id: 'homepage'
        }, 'Home', '?' + this.getDocumentElementValueById("fs-url") + ',' + this.getDocumentElementValueById("selection") + ',' + this.getDocumentElementValueById("animation-time") + ',' + this.mapLongLatZoom);
    }

    //when map moves, update url.
    private updateMapLongLat = () => {
        if (this.mapView && this.mapView.center) {
            this.mapLongLatZoom = [this.mapView.center.longitude, this.mapView.center.latitude, this.mapView.zoom];
        }
        this.updateBrowserURL();
    }

    //adds the feature layer to the map.
    private addFeatureLayer(evt: any) {
        var flURL = <HTMLInputElement>document.getElementById("fs-url");
        // var flURL = this.getDocumentElementValueById("fs-url");

        if (flURL != "") {
            this.featureLayer = new FeatureLayer({
                url: flURL
            });
            this.map.removeAll()
            this.map.add(this.featureLayer)

            //overides ANY scale threshold added to feature layer.
            this.featureLayer.maxScale = 0 
            this.featureLayer.minScale = 100000000000 

            //rest call to get attribute minimum and maximum values.
            this.getFields(flURL)

            this.getDocumentElementById("fs-url").style.borderBottomColor = "green"
        } else {
            this.map.remove(this.featureLayer)
            this.getDocumentElementById("fs-url").style.borderBottomColor = "red"
        }

    }

    //populating selection drop down based on featurelayer.
    private getFields(flURL: string) {
        console.log("REST call 1");
        // axios.get({
        //     url: flURL + "?f=json",
        //     type: "GET"
        // }).then(function(FLfields: any) {
        //     var fieldsObj = JSON.parse(FLfields)
        //     this.getDocumentElementValueById("feature-layer-name").innerHTML = fieldsObj.name
        //     this.updateExtent(fieldsObj.extent)
        //     this.select = this.getDocumentElementValueById('selection')
        //     if (this.select) {
        //         this.select.innerHTML = ''
        //     }

        //     this.geometryType = fieldsObj.geometryType
        //     this.symbolSwitcher(this.geometryType)

        //     for (let i = 0; i < fieldsObj.fields.length; i++) {
        //         if (fieldsObj.fields[i].sqlType != "sqlTypeNVarchar") {

        //             var opt = document.createElement('option')
        //             opt = fieldsObj.fields[i].name
        //             opt.innerHTML = fieldsObj.fields[i].name

        //             if (i === 0 && this.updateField === true) {
        //                 opt = this.overRidingField
        //                 opt.innerHTML = this.overRidingField
        //             }

        //             if (this.updateField === true && fieldsObj.fields[i].name === this.overRidingField) {
        //                 opt = fieldsObj.fields[0].name
        //                 opt.innerHTML = fieldsObj.fields[0].name
        //                 this.updateField = false
        //             }

        //             if (this.select) {
        //                 this.select.appendChild(opt)
        //             }
        //         }

        //     }
        //     this.updateBrowserURL();
        // });
    }

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

    private play(){
        //Stops any previously added animations in the frame
        this.stopAnimation()

        //There's an unknown issue caused by "ObjectID"
        //This is currently a workaround for it.
        if(this.getDocumentElementValueById("selection") === "OBJECTID"){
            if (this.getDocumentElementValueById("fs-url") != "") {
                this.featureLayer = new FeatureLayer({
                    url: this.getDocumentElementValueById("fs-url")
                });
                this.map.removeAll()
                this.map.add(this.featureLayer)
            }
        }

        //update with changed values.
        this.updateBrowserURL();

        //queries the current feature layer url and field to work out start and end frame.
        this.getMaxMin();
    }

    private getMaxMin() {
        var flURL = this.getDocumentElementValueById("fs-url")
        var field = this.getDocumentElementValueById("selection")
        console.log("REST call 2");

//         axios.get({
//             url: flURL + "/query",
//             type: "GET",
//             data: {
//                 'f': 'pjson',
//                 'outStatistics': '[{"statisticType":"min","onStatisticField":"' + field +
//                     '", "outStatisticFieldName":"MinID"},{"statisticType":"max","onStatisticField":"' +
//                     field + '", "outStatisticFieldName":"MaxID"}]'
//             }
//         }).then(function(data: string) {
//             var dataJSONObj = JSON.parse(data)
// ;
//             this.fieldToAnimate = field;
//             this.startNumber(dataJSONObj.features[0].attributes.MinID);
//             this.endNo = dataJSONObj.features[0].attributes.MaxID;

//             //generate step number here too
//             var difference = Math.abs(dataJSONObj.features[0].attributes.MinID - dataJSONObj.features[0].attributes.MaxID);
//             var differencePerSecond = difference / this.getDocumentElementValueById("animation-time");
//             this.stepNumber = differencePerSecond / this.setIntervalSpeed;
//             this.startNo = dataJSONObj.features[0].attributes.MinID;
//             this.animate(dataJSONObj.features[0].attributes.MinID);

//             //adding empty frames at the start and end for fade in/out
//             this.endNo += this.stepNumber * 40;
//             this.startNo -= this.stepNumber * 2;
//         });

    }

    private stopAnimation() {;
        this.startNumber(0);
        this.stepNumber = null;
        this.fieldToAnimate = null;
        this.startNo = null;
        this.endNo = null
        this.restarting = true;
    }

    private startNumber(value: number) {
        this.featureLayer.renderer = this.createRenderer(value);
    }

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

    private createRenderer(now: number): any {
        let renderer = {
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
    }
}