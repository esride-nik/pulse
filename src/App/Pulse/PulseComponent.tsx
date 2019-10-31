import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Pulse } from './Pulse';
import { SetlistFmComponent } from './SetlistFmComponent';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge, FormControl } from 'react-bootstrap';
import { observable } from 'mobx';
import Map from 'esri/Map';
import axios from 'axios';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
import './PulseComponent.scss';
import FeatureLayer from 'esri/layers/FeatureLayer';
import Extent from 'esri/geometry/Extent';
import Point from 'esri/geometry/Point';

const defaultMapLongLatZoom = [0, 0, 1];
const setIntervalSpeed = 16.6; //refresh speed in ms

interface PulseComponentProps {
    appState?: AppState,
    key: number
};

@inject('appState')
@observer
export class PulseComponent extends React.Component<PulseComponentProps> {
    private pulse: Pulse;
    private map: Map;
    private mapView: __esri.MapView;

    private selection: React.RefObject<FormControl>;
    private flUrl: React.RefObject<unknown>;
    private flName: React.RefObject<unknown>;
    private animationTime: React.RefObject<unknown>;

    private orgEndNo: number;
    private orgStartNo: number;
    private startNo: number;
    private endNo: number;
    private animation: { remove: () => void; };
    private restarting = false //flag to control removing animation 
    private updateField = false //check for attribute change
    private overRidingField: any; //casts url field as no.1 selection in attribute selector
    private mapLongLatZoom: number[];
    private animating: boolean;


    constructor(props: PulseComponentProps) {
        super(props);

        this.selection = React.createRef();
        this.flUrl = React.createRef();
        this.flName = React.createRef();
        this.animationTime = React.createRef();
    }

    private componentDidMount() {
        this.map = this.props.appState.map;
        this.mapView = this.props.appState.mapView;
        this.initPulse();

        this.mapLongLatZoom = defaultMapLongLatZoom;
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
            this.animationTime.current.value = partsOfStr[2];
            this.mapLongLatZoom = [parseInt(partsOfStr[3]), parseInt(partsOfStr[4]), parseInt(partsOfStr[5])];
    
        } else {
            // this.defaultService();
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
    }

    //if there's no parameters, then add these in as a default.
    private defaultService() {
        this.flUrl.current.value = this.props.appState.config.defaultService;
        this.animationTime.current.value = "10";
    }

    private play = () => {
        //Stops any previously added animations in the frame
        this.stopAnimation();

        //There's an unknown issue caused by "ObjectID"
        //This is currently a workaround for it.
        if(this.selection.current.value === "OBJECTID"){
            if (this.flUrl.current.value != "") {
                this.props.appState.pulseFeatureLayer = new FeatureLayer({
                    url: this.flUrl.current.value
                });
                this.map.removeAll()
                this.map.add(this.props.appState.pulseFeatureLayer)
            }
        }

        this.updateBrowserURL();
        this.calculateParametersAndStartAnimation(this.animationTime.current.value);
    }

    public stopAnimation = () => {
        if (this.animation) {
            this.animation.remove();
        }
        this.setRenderer(0);
        this.props.appState.stepNumber = null;
        this.restarting = true;
    }

    private calculateParametersAndStartAnimation = (animationTime: number) => {
        //generate step number here too
        let difference = Math.abs(this.startNo - this.endNo);
        let differencePerSecond = difference / animationTime;
        this.props.appState.stepNumber = differencePerSecond / setIntervalSpeed;
        this.animation = this.animate(this.startNo);
        
        //adding empty frames at the start and end for fade in/out
        this.orgEndNo = this.endNo;
        this.orgStartNo = this.startNo;
        this.endNo += this.props.appState.stepNumber * 40;
        this.startNo -= this.props.appState.stepNumber * 2;

        this.setRenderer(this.startNo);
    }
    
    public setRenderer = (value: number) => {
        this.props.appState.pulseFeatureLayer.renderer = Pulse.createRenderer(value, this.props.appState.pulseFeatureLayerSymbol, this.props.appState.fieldToAnimate, this.props.appState.stepNumber);
    }

    private animate(startValue: number) {
        this.animating = true;
        let currentFrame = startValue;

        let frame = () => {
            if (this.restarting) {
                clearTimeout(this.pulse.intervalFunc);
                this.restarting = false;
            }

            currentFrame += this.props.appState.stepNumber;
            
            if (currentFrame > this.endNo) {
                currentFrame = this.startNo;
            }

            let displayNow: number = this.displayNow(currentFrame, this.orgStartNo, this.orgEndNo);
            this.props.appState.displayNow = this.props.appState.fieldToAnimate + " " + displayNow.toString();
            this.setRenderer(currentFrame);

            //animation loop.
            if (this.animating) {
                this.pulse.intervalFunc = setTimeout(function() {
                    //stops it from overloading.
                    requestAnimationFrame(frame);
                }, setIntervalSpeed);
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

    private displayNow(currentFrame: number, orgStartNo: number, orgEndNo: number) {
        let displayNow: number = Math.round(currentFrame);
        if (Math.round(currentFrame) < orgStartNo) {
            displayNow = orgStartNo;
        }
        else if (Math.round(currentFrame) > orgEndNo) {
            displayNow = orgEndNo;
        }
        return displayNow;
    }

    public setFeatureLayer = (featureLayer: FeatureLayer, fieldToAnimate: string, fieldToAnimateMinValue: number, fieldToAnimateMaxValue: number) => {
        this.map.removeAll();
        this.map.add(this.props.appState.pulseFeatureLayer);
        this.mapView.goTo(this.props.appState.pulseFeatureLayer.fullExtent);
        // this.fieldToAnimate = fieldToAnimate;
        // this.startNo = fieldToAnimateMinValue;
        // this.endNo = fieldToAnimateMaxValue;
        this.props.appState.pulseFeatureLayerSymbol = Pulse.symbolSwitcher(featureLayer.geometryType);
    }


    private changeFieldSelection = () => {
        // TODO: query the current feature layer url and field to work out start and end frame.
        this.props.appState.fieldToAnimate = this.selection.current.value;
    }

    private updateExtent(newExtent: Extent) {
        if (newExtent.spatialReference.wkid === 102100) {
            this.mapView.extent = newExtent
        }
        if (newExtent.spatialReference.wkid != 102100) {
            this.mapView.extent = {
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

                    // TODO: how to add select option
                    if (this.selection) {
                        this.selection.appendChild(opt);
                    }
                }
            }
            this.changeFieldSelection();
            this.getMaxMinFromFeatureLayer(flURL);
            this.updateBrowserURL();
        });
    }

    private getMaxMinFromFeatureLayer = (flURL: string) => {
        axios.get(flURL + "/query", {
            params: {
                'f': 'pjson',
                'outStatistics': '[{"statisticType":"min","onStatisticField":"' + this.fieldToAnimate +
                    '", "outStatisticFieldName":"MinID"},{"statisticType":"max","onStatisticField":"' +
                    this.props.appState.fieldToAnimate + '", "outStatisticFieldName":"MaxID"}]'
            }
          }).then((queryResponse: any) => {
            let responseData = queryResponse.data;
            this.startNo = responseData.features[0].attributes.MinID;
            this.endNo = responseData.features[0].attributes.MaxID;
        });
    }

    private addFeatureLayer = () => {
        this.changeFieldSelection();

        if (this.flUrl.current.value != "") {
            this.props.appState.pulseFeatureLayer = new FeatureLayer({
                url: this.flUrl.current.value
            });
            this.map.removeAll();
            this.map.add(this.props.appState.pulseFeatureLayer);

            //overides ANY scale threshold added to feature layer.
            this.props.appState.pulseFeatureLayer.maxScale = 0; 
            this.props.appState.pulseFeatureLayer.minScale = 100000000000 ;

            //rest call to get attribute minimum and maximum values.
            this.getFields(this.flUrl.current.value);

            // TODO: remove getDocumentElementById
            Pulse.getDocumentElementById("fs-url").style.borderBottomColor = "green";
        } else {
            this.map.remove(this.props.appState.pulseFeatureLayer);
            Pulse.getDocumentElementById("fs-url").style.borderBottomColor = "red";
        }
    }
    


    public render() {
        let { map, mapView, config, displayNow } = this.props.appState;
        const { key } = this.props;

        // if (this.props.appState.pulseFeatureLayerChanged) {
        //     this.setFeatureLayer(this.props.appState.pulseFeatureLayer, this.props.appState.fieldToAnimate, this.props.appState.fieldToAnimateMinValue, this.props.appState.fieldToAnimateMaxValue);
        //     this.setPulseFeatureLayerUnchanged();
        // }

        return (
            <Container>
                <Tabs defaultActiveKey="setlistfm" id="pulse-tab">
                    <Tab eventKey="setlistfm" title="Setlist.fm">
                        <SetlistFmComponent key={key} setFeatureLayer={this.setFeatureLayer}/>
                    </Tab>
                    <Tab eventKey="featureLayer" title="FeatureLayer">
                        <Row>
                            <Form.Control type="text" id="fs-url" placeholder="Enter a FeatureServer URL here" className="fs-url" ref={this.flUrl} onBlur={this.addFeatureLayer}/>
                            <Form.Label id="feature-layer-name" ref={this.flName}>...</Form.Label>
                        </Row>
                        <Row>
                            Select attribute to animate
                            <Form.Control as="select" id="selection" ref={this.selection} onChange={this.changeFieldSelection}>
                                <option></option>
                            </Form.Control>
                        </Row>
                    </Tab>
                </Tabs>

                Animation time <Form.Control type="text" id="animation-time" placeholder="Enter duration in seconds here" className="animation-time" ref={this.animationTime}/> seconds

                <Button variant="light" id="play" onClick={this.play}>&#9658;</Button>
                <Button variant="light" id="stop" onClick={this.stopAnimation}>&#9632;</Button>
                <Badge variant="info" id="displayNow">{displayNow}</Badge>
            </Container>
        );
    }

}