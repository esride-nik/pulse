import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Pulse } from './Pulse';
import { SetlistFmComponent } from './SetlistFmComponent';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge, FormControl } from 'react-bootstrap';
import { observable } from 'mobx';
import Map from 'esri/Map';
import axios from 'axios';
import './PulseComponent.scss';
import FeatureLayer from 'esri/layers/FeatureLayer';
import Extent from 'esri/geometry/Extent';
import Point from 'esri/geometry/Point';
import { Knob } from 'react-rotary-knob';

import { SetlistDetailsComponent } from './SetlistDetailsComponent';
import Graphic from 'esri/Graphic';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import Polyline from 'esri/geometry/Polyline';
import geometryEngineAsync from 'esri/geometry/geometryEngineAsync';
import TimeSlider from 'esri/widgets/TimeSlider';
import TimeInterval from 'esri/TimeInterval';
import SceneView from 'esri/views/SceneView';

const venueFeaturesLayerId = "venueFeatures";

interface PulseComponentProps {
    appState?: AppState,
    key: number
};

@inject('appState')
@observer
export class PulseComponent extends React.Component<PulseComponentProps> {
    private map: Map;
    private view: SceneView;

    private selection: React.RefObject<unknown>;
    private flUrl: React.RefObject<unknown>;
    private flName: React.RefObject<unknown>;
    private animationSpeed: React.RefObject<unknown>;

    private animation: { remove: () => void; };
    private restarting = false //flag to control removing animation 
    private updateField = false //check for attribute change
    private overRidingField: any; //casts url field as no.1 selection in attribute selector
    private mapLongLatZoom: number[];
    private animating: boolean = false;
    private intervalFunc: any; //animation interval name
    private intervalSpeed: number;
    private animationTime: number;
    
    @observable
    private flNameString: string = "";
    lastSetlist: any;
    connectionsLayer: GraphicsLayer;
    setlistPathsGraphics: Graphic[] = [];
    pulseMode: string;
    timeSlider: TimeSlider;

    constructor(props: PulseComponentProps) {
        super(props);

        this.selection = React.createRef();
        this.flUrl = React.createRef();
        this.flName = React.createRef();
        this.animationSpeed = React.createRef();
    }

    public componentDidMount() {
        this.map = this.props.appState.map;
        this.view = this.props.appState.view;
        this.initPulse();

        this.mapLongLatZoom = this.props.appState.config.defaultMapLongLatZoom;
        this.intervalSpeed = this.props.appState.config.defaultIntervalSpeed;
        this.props.appState.automaticZoom = true;
    }

    private setAnimationSpeed = (a: any) => {
        let { startNo, endNo } = this.props.appState;

        this.animationSpeed.current.value = a.toFixed(0);
        this.animationTime = 100-this.animationSpeed.current.value;
        this.generateStepNumber(startNo, endNo);
    }

    private initPulse = () => {
        //check URL for paramaters, if there's some. Add it in.
        var browserURL = window.location.search
        if (browserURL != "") {
            this.updateField = true;
            browserURL = browserURL.replace("?", '');
            var partsOfStr = browserURL.split(',');
            this.flUrl.current.value = partsOfStr[0];
            this.overRidingField = partsOfStr[1];
            this.animationSpeed.current.value = partsOfStr[2];
            this.mapLongLatZoom = [parseInt(partsOfStr[3]), parseInt(partsOfStr[4]), parseInt(partsOfStr[5])];

        } else {
            this.flUrl.current.value = this.props.appState.config.defaultService;
        }

        this.connectionsLayer = new GraphicsLayer({
            id: "connectionsLayer"
        });
        this.map.add(this.connectionsLayer);

        this.view.when(() => {
            this.view.watch("stationary", this.updateMapLongLat);

            var pt = new Point({
                longitude: this.mapLongLatZoom[0],
                latitude: this.mapLongLatZoom[1]
            });

            this.view.goTo({
                target: pt,
                zoom: this.mapLongLatZoom[2]
            })

            this.timeSlider = new TimeSlider({
                view: this.view,
                stops: {
                    interval: new TimeInterval({
                        "unit": "days",
                        "value": 1
                    })
                },
                mode: "cumulative-from-start"
            });
            this.view.ui.add(this.timeSlider, "bottom-right");
        })
    }

    private play = () => {
        //Stops any previously added animations in the frame
        this.stopAnimation();
        
        this.animationTime = 100-this.animationSpeed.current.value;

        //There's an unknown issue caused by "ObjectID"
        //This is currently a workaround for it.
        if (this.selection.current.value === "OBJECTID") {
            if (this.flUrl.current.value != "") {
                this.props.appState.pulseFeatureLayer = new FeatureLayer({
                    url: this.flUrl.current.value
                });
                this.map.findLayerById("")
                this.map.add(this.props.appState.pulseFeatureLayer)
            }
        }

        this.updateBrowserURL();
        this.calculateParametersAndStartAnimation();
    }

    public stopAnimation = () => {
        if (this.animation) {
            this.animation.remove();
        }
        // this.setRenderer(0);
        this.props.appState.stepNumber = null;
        this.restarting = true;
        this.props.appState.displayNow = "";
    }

    private generateStepNumber(startNo: number, endNo: number) {
        let difference = Math.abs(startNo - endNo);
        let differencePerSecond = difference / this.animationTime;
        let stepNumber = differencePerSecond / this.intervalSpeed;
        this.props.appState.stepNumber = stepNumber
    }

    private calculateParametersAndStartAnimation = () => {
        let { startNo, endNo } = this.props.appState;
        this.generateStepNumber(startNo, endNo);

        //adding empty frames at the start and end for fade in/out
        this.props.appState.orgEndNo = endNo;
        this.props.appState.orgStartNo = startNo;
        endNo += this.props.appState.stepNumber * 40;
        startNo -= this.props.appState.stepNumber * 2;

        this.animation = this.animate(startNo);
    }

    public setRenderer = (value: number) => {
        if (this.props.appState.pulseFeatureLayer) {
            this.props.appState.pulseFeatureLayer.renderer = Pulse.createRenderer(value, this.props.appState.pulseFeatureLayerSymbol, this.props.appState.fieldToAnimate, this.props.appState.stepNumber);
        }
    }

    private setCurrentSetlists(now: number) {
        if (now && this.props.appState.setlists.length>0) {
            let setlistsBeforeNow = this.props.appState.setlists.filter((setlist) => {
                let floorNow = Math.floor(now);
                if (setlist.eventDate<=floorNow) {
                    return setlist;
                }
            });
            this.props.appState.displaySetlists = setlistsBeforeNow; //.slice(0, this.props.appState.config.setlistFmConnector.displayNumberOfSetlists+1);
            if (setlistsBeforeNow.length>0) {
                const reducer = (max, cur) => Math.max( max, cur );
                let eventDateBeforeNow = setlistsBeforeNow.map((setlist) => setlist.eventDate).reduce(reducer, -Infinity);
                this.props.appState.recentSetlist = setlistsBeforeNow.filter((setlist) => setlist.eventDate===eventDateBeforeNow)[0];
            }
            let setlistsAfterNow = this.props.appState.setlists.filter((setlist) => {
                let floorNow = Math.floor(now);
                if (setlist.eventDate>floorNow) {
                    return setlist;
                }
            });
            if (setlistsAfterNow.length>0) {
                const reducer = (max, cur) => Math.min( max, cur );
                let eventDateAfterNow = setlistsAfterNow.map((setlist) => setlist.eventDate).reduce(reducer, Infinity);
                this.props.appState.nextSetlist = setlistsAfterNow.filter((setlist) => setlist.eventDate===eventDateAfterNow)[0];
            }
        }
    }

    private animate = (startValue: number) => {
        this.animating = true;
        this.props.appState.currentFrame = startValue;

        let frame = () => {
            if (this.restarting) {
                clearTimeout(this.intervalFunc);
                this.restarting = false;
            }

            this.props.appState.currentFrame += this.props.appState.stepNumber;
            this.setCurrentSetlists(this.props.appState.currentFrame);

            this.timeSlider.values = [
                new Date(this.props.appState.currentFrame)
            ];

            if (this.props.appState.currentFrame > this.props.appState.endNo) {
                this.props.appState.currentFrame = this.props.appState.startNo;
            }

            //animation loop.
            if (this.animating) {
                this.setRenderer(this.props.appState.currentFrame);
                if (this.props.appState.fieldToAnimate == this.props.appState.config.setlistFmConnector.setlistDateField) {
                    this.props.appState.displayNow = this.props.appState.nls["now"] + ": " 
                        + Pulse.adjustAndFormatDate(this.props.appState.currentFrame, this.props.appState.orgStartNo, this.props.appState.orgEndNo);
                }
                else {
                    this.props.appState.displayNow = this.props.appState.fieldToAnimate + ": " 
                        + Pulse.adjustCurrentFrame(this.props.appState.currentFrame, this.props.appState.orgStartNo, this.props.appState.orgEndNo);
                }
                this.intervalFunc = setTimeout(function () {
                    //stops it from overloading.
                    requestAnimationFrame(frame);
                }, this.intervalSpeed);
            }
        }

        // recursive function, starting the animation.
        frame();

        return {
            remove: () => {
                this.animating = false;
            }
        };
    }

    //this generates a new, sharable url link.
    public updateBrowserURL() {
        // history.pushState({
        //     id: 'homepage'
        // }, 'Home', '?' + this.getDocumentElementValueById("fs-url") + ',' + this.getDocumentElementValueById("selection") + ',' + this.getDocumentElementValueById("animation-time") + ',' + this.mapLongLatZoom);
    }

    //when map moves, update url.
    private updateMapLongLat = () => {
        // if (this.mapView && this.mapView.center) {
        //     this.mapLongLatZoom = [this.mapView.center.longitude, this.mapView.center.latitude, this.mapView.zoom];
        // }
        // this.updateBrowserURL();
    }

    public setSetlistFmFeatureLayer = (featureLayer: FeatureLayer, fieldToAnimate: string, fieldToAnimateMinValue: number, fieldToAnimateMaxValue: number) => {
        this.pulseMode = "setlistFm";
        this.animationTime = 100-this.animationSpeed.current.value;
        this.map.remove(this.map.findLayerById(venueFeaturesLayerId));
        this.map.add(this.props.appState.pulseFeatureLayer);
        this.view.goTo(this.props.appState.pulseFeatureLayer.fullExtent);
        this.props.appState.pulseSourceLoaded = true;
        this.props.appState.pulseFeatureLayerSymbol = Pulse.symbolSwitcher(featureLayer.geometryType);
        this.setRenderer(this.props.appState.startNo);
        this.timeSlider.fullTimeExtent = featureLayer.timeInfo.fullTimeExtent;
    }

    private changeFieldSelection = () => {
        this.stopAnimation();
        this.props.appState.fieldToAnimate = this.selection.current.value;
        this.getMaxMinFromFeatureLayerField(this.flUrl.current.value);
    }

    private updateExtent(newExtent: Extent) {
        if (newExtent.spatialReference.wkid === 102100) {
            this.view.extent = newExtent
        }
        if (newExtent.spatialReference.wkid != 102100) {
            this.view.extent = {
                xmax: 20026375.71466102,
                xmin: -20026375.71466102,
                ymax: 9349764.174146919,
                ymin: -5558767.721795811
            } as Extent;
        }
    }

    //populating selection drop down based on featurelayer.
    private getFields(flURL: string) {
        axios.get(flURL + "?f=json").then((flResponse: any) => {
            var flData = flResponse.data;
            this.flName.current.value = flData.name;
            this.flNameString = flData.name;
            this.updateExtent(flData.extent);
            this.selection.current.value = "";
            let symbol = Pulse.symbolSwitcher(flData.geometryType);

            for (let i = 0; i < flData.fields.length; i++) {
                let field = flData.fields[i];
                if (field.sqlType != "sqlTypeNVarchar" && field.type != "esriFieldTypeString") {
                    var opt = document.createElement('option');
                    opt.value = field.name;
                    opt.innerHTML = field.name;

                    if (i === 0 && this.updateField === true) {
                        opt.value = this.overRidingField;
                        opt.innerHTML = this.overRidingField;
                    }

                    if (this.updateField === true && field.name === this.overRidingField) {
                        opt.value = flData.fields[0].name;
                        opt.innerHTML = flData.fields[0].name;
                        this.updateField = false;
                    }

                    // TODO: What's the right way to programmatically add options to a Bootstrap Select Form.Control?
                    let selectNode = Pulse.getDocumentElementById("selection");
                    if (selectNode) {
                        selectNode.appendChild(opt);
                    }
                }
            }

            // select first option
            this.selection.current.value = flData.fields[0].name;

            this.changeFieldSelection();
            this.updateBrowserURL();
        });
    }

    private getMaxMinFromFeatureLayerField = (flURL: string) => {
        axios.get(flURL + "/query", {
            params: {
                'f': 'pjson',
                'outStatistics': '[{"statisticType":"min","onStatisticField":"' + this.props.appState.fieldToAnimate +
                    '", "outStatisticFieldName":"MinID"},{"statisticType":"max","onStatisticField":"' +
                    this.props.appState.fieldToAnimate + '", "outStatisticFieldName":"MaxID"}]'
            }
        }).then((queryResponse: any) => {
            let responseData = queryResponse.data;
            this.props.appState.startNo = responseData.features[0].attributes.MinID;
            this.props.appState.endNo = responseData.features[0].attributes.MaxID;
        });
    }

    private setFeatureLayerFromUrl = () => {
        this.stopAnimation();
        this.mapLongLatZoom = this.props.appState.config.defaultMapLongLatZoom;
        this.connectionsLayer.removeAll();
        this.pulseMode = "featureLayer";

        if (this.flUrl.current.value != "") {
            this.props.appState.pulseFeatureLayer = new FeatureLayer({
                url: this.flUrl.current.value
            });
            this.map.remove(this.map.findLayerById(venueFeaturesLayerId));
            this.map.add(this.props.appState.pulseFeatureLayer);
            this.props.appState.pulseFeatureLayerSymbol = Pulse.symbolSwitcher(this.props.appState.pulseFeatureLayer.geometryType);

            //overides ANY scale threshold added to feature layer.
            this.props.appState.pulseFeatureLayer.maxScale = 0;
            this.props.appState.pulseFeatureLayer.minScale = 100000000000;

            //rest call to get attribute minimum and maximum values.
            this.getFields(this.flUrl.current.value);
            this.setRenderer(this.props.appState.startNo);

            this.props.appState.pulseSourceLoaded = true;

            // TODO: remove getDocumentElementById
            Pulse.getDocumentElementById("fs-url").style.borderBottomColor = "green";
        } else {
            this.map.remove(this.props.appState.pulseFeatureLayer);
            Pulse.getDocumentElementById("fs-url").style.borderBottomColor = "red";
        }
    }

    private toggleZoom = () => {
        this.props.appState.automaticZoom = !this.props.appState.automaticZoom;
    }


    public render() {
        let { displayNow } = this.props.appState;
        const { key } = this.props;
        
        let disabled = false;
        if (!this.props.appState.pulseSourceLoaded) {
            disabled = true;
        }
        
        let zoomDisabled = false;
        if (!this.props.appState.pulseSourceLoaded || this.pulseMode !== "setlistFm") {
            zoomDisabled = true;
        }

        let zoomOnOff = "outline-secondary";
        if (this.props.appState.automaticZoom) {
            zoomOnOff = "secondary";
        }

        let playOnOff = "outline-secondary";
        if (this.animating) {
            playOnOff = "secondary";
        }

        let stopOnOff = "outline-secondary";
        if (!this.animating) {
            stopOnOff = "secondary";
        }

        if (!this.lastSetlist) {
            this.lastSetlist = this.props.appState.recentSetlist;
        }
        if (this.lastSetlist != this.props.appState.recentSetlist) {
            if (this.props.appState.recentSetlist && this.props.appState.pulseFeatureLayer) {
                let nextSetlistLocationQueryParams = this.props.appState.pulseFeatureLayer.createQuery();
                nextSetlistLocationQueryParams.where = "OBJECTID = " + this.lastSetlist.OBJECTID + " OR OBJECTID = " + this.props.appState.recentSetlist.OBJECTID;
                nextSetlistLocationQueryParams.where += this.props.appState.recentSetlist.OBJECTID!=this.props.appState.nextSetlist.OBJECTD ? " OR OBJECTID = " + this.props.appState.nextSetlist.OBJECTID : "";
                this.props.appState.pulseFeatureLayer.queryFeatures(nextSetlistLocationQueryParams).then((res: any) => {
                    if (res.features.length>0) {
                        let setlistPoints: Point[] = res.features.map((feature: Graphic) => feature.geometry);
                        let setlistPaths = setlistPoints.map((setlistPoint: Point) => [setlistPoint.x, setlistPoint.y]);

                        let alpha = 1;
                        let color = [
                            this.props.appState.config.setlistFmConnector.displayConnectionsColor[0],
                            this.props.appState.config.setlistFmConnector.displayConnectionsColor[1],
                            this.props.appState.config.setlistFmConnector.displayConnectionsColor[2],
                            alpha
                        ];
                        let symbol = {
                            type: "simple-line",
                            style: "short-dot",
                            cap: "round",
                            join: "bevel",
                            miterLimit: 30,
                            width: 1,
                            color: color
                          }
                        this.setlistPathsGraphics.push(new Graphic({
                            geometry: new Polyline({
                                paths: [setlistPaths]
                            }),
                            symbol: symbol
                        }));
                        if (this.setlistPathsGraphics.length>this.props.appState.config.setlistFmConnector.displayNumberOfConnections) {
                            this.setlistPathsGraphics = this.setlistPathsGraphics.slice(this.setlistPathsGraphics.length-this.props.appState.config.setlistFmConnector.displayNumberOfConnections);
                        }
                        let alphaCounter = 1;
                        this.setlistPathsGraphics = this.setlistPathsGraphics.map((setlistPathGraphic: Graphic) => {
                            setlistPathGraphic.symbol.color.a = alpha/this.setlistPathsGraphics.length*alphaCounter;
                            alphaCounter++;
                            return setlistPathGraphic;
                        });
                        this.connectionsLayer.removeAll();
                        this.connectionsLayer.addMany(this.setlistPathsGraphics);
                        if (this.props.appState.automaticZoom) {
                            // buffer does not work with polyline!
                            geometryEngineAsync.geodesicBuffer(setlistPoints, 100, "kilometers", true).then((setlistPathsGraphicBuffer: any) => {
                                this.view.goTo({
                                    target: setlistPathsGraphicBuffer,
                                    heading: 0
                                });
                            });
                        }
                    }
                });
            }
            this.lastSetlist = this.props.appState.recentSetlist;
        }

        return (
            <Container>
                <div className="pulseTop">
                    <Tabs defaultActiveKey="setlistfm" id="pulse-tab">
                        <Tab eventKey="setlistfm" title="Setlist.fm">
                            <SetlistFmComponent key={key} setFeatureLayer={this.setSetlistFmFeatureLayer} stopAnimation={this.stopAnimation} />
                        </Tab>
                        <Tab eventKey="featureLayer" title="FeatureLayer">
                            <Row>
                                <Form.Label id="feature-layer-name" ref={this.flName}>{this.flNameString}</Form.Label>
                                <Form.Control type="text" id="fs-url" placeholder="Enter a FeatureServer URL here" className="fs-url" ref={this.flUrl} onBlur={this.setFeatureLayerFromUrl} />
                            </Row>
                            <Row>
                                Select attribute to animate
                                <Form.Control as="select" id="selection" ref={this.selection} onChange={this.changeFieldSelection}>
                                    <option></option>
                                </Form.Control>
                            </Row>
                        </Tab>
                    </Tabs>

                    <Row className="extra-tab controlBtns">
                        <Button variant={playOnOff} id="play" onClick={this.play} disabled={disabled}>&#9658;</Button>
                        <Button variant={stopOnOff} id="stop" onClick={this.stopAnimation} disabled={disabled}>&#9632;</Button>
                        <Button variant={zoomOnOff} id="zoom" onClick={this.toggleZoom} disabled={zoomDisabled}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" className="svg-icon"><path d="M20 20h12v3h-6.915L32 29.723v2.109l-.168.168h-2.117L23 25.09V32h-3V20zM0 23h6.915L0 29.723v2.109L.168 32h2.117L9 25.09V32h3V20H0v3zM9 6.91L2.285 0H.168L0 .168v2.109L6.915 9H0v3h12V0H9v6.91zM32 .168L31.832 0h-2.117L23 6.91V0h-3v12h12V9h-6.915L32 2.277V.168z"/></svg></Button>
                        <Knob onChange={this.setAnimationSpeed} unlockDistance={20} min={0} max={100} defaultValue={this.props.appState.config.defaultAnimationTime} ref={this.animationSpeed} fill="#69dcff"/>
                        <Form.Control type="text" id="animation-time" className="animation-time" readOnly defaultValue={this.props.appState.config.defaultAnimationTime} ref={this.animationSpeed} />
                    </Row>

                    {/* <Badge variant="dark" id="displayNow">{displayNow}</Badge> */}
                </div>
                <SetlistDetailsComponent />
            </Container>
        );
    }

}