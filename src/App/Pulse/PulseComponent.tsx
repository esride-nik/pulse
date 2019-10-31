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

interface PulseComponentProps {
    appState?: AppState,
    key: number
};

@inject('appState')
@observer
export class PulseComponent extends React.Component<PulseComponentProps> {
    private map: Map;
    private mapView: __esri.MapView;

    private selection: React.RefObject<unknown>;
    private flUrl: React.RefObject<unknown>;
    private flName: React.RefObject<unknown>;
    private animationSpeed: React.RefObject<unknown>;

    private orgEndNo: number;
    private orgStartNo: number;
    private animation: { remove: () => void; };
    private restarting = false //flag to control removing animation 
    private updateField = false //check for attribute change
    private overRidingField: any; //casts url field as no.1 selection in attribute selector
    private mapLongLatZoom: number[];
    private animating: boolean;
    private intervalFunc: any; //animation interval name
    private intervalSpeed: number;
    private animationTime: number;
    
    @observable
    private flNameString: string = "";

    constructor(props: PulseComponentProps) {
        super(props);

        this.selection = React.createRef();
        this.flUrl = React.createRef();
        this.flName = React.createRef();
        this.animationSpeed = React.createRef();
    }

    public componentDidMount() {
        this.map = this.props.appState.map;
        this.mapView = this.props.appState.mapView;
        this.initPulse();

        this.mapLongLatZoom = this.props.appState.config.defaultMapLongLatZoom;
        this.intervalSpeed = this.props.appState.config.defaultIntervalSpeed;
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
                this.map.removeAll()
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
        this.orgEndNo = endNo;
        this.orgStartNo = startNo;
        endNo += this.props.appState.stepNumber * 40;
        startNo -= this.props.appState.stepNumber * 2;

        this.animation = this.animate(startNo);
    }

    public setRenderer = (value: number) => {
        if (this.props.appState.pulseFeatureLayer) {
            this.props.appState.pulseFeatureLayer.renderer = Pulse.createRenderer(value, this.props.appState.pulseFeatureLayerSymbol, this.props.appState.fieldToAnimate, this.props.appState.stepNumber);
        }
    }

    private animate = (startValue: number) => {
        this.animating = true;
        let currentFrame = startValue;

        let frame = () => {
            if (this.restarting) {
                clearTimeout(this.intervalFunc);
                this.restarting = false;
            }

            currentFrame += this.props.appState.stepNumber;

            if (currentFrame > this.props.appState.endNo) {
                currentFrame = this.props.appState.startNo;
            }

            //animation loop.
            if (this.animating) {
                this.setRenderer(currentFrame);
                if (this.props.appState.fieldToAnimate == this.props.appState.config.setlistFmConnector.setlistDateField) {
                    this.props.appState.displayNow = this.props.appState.nls[this.props.appState.fieldToAnimate] + ": " + Pulse.adjustAndFormatDate(currentFrame, this.orgStartNo, this.orgEndNo);
                }
                else {
                    this.props.appState.displayNow = this.props.appState.fieldToAnimate + ": " + Pulse.adjustCurrentFrame(currentFrame, this.orgStartNo, this.orgEndNo);
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
        this.animationTime = 100-this.animationSpeed.current.value;
        this.map.removeAll();
        this.map.add(this.props.appState.pulseFeatureLayer);
        this.mapView.goTo(this.props.appState.pulseFeatureLayer.fullExtent);
        this.props.appState.pulseSourceLoaded = true;
        this.props.appState.pulseFeatureLayerSymbol = Pulse.symbolSwitcher(featureLayer.geometryType);
        this.setRenderer(this.props.appState.startNo);
    }

    private changeFieldSelection = () => {
        this.stopAnimation();
        this.props.appState.fieldToAnimate = this.selection.current.value;
        this.getMaxMinFromFeatureLayerField(this.flUrl.current.value);
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

        if (this.flUrl.current.value != "") {
            this.props.appState.pulseFeatureLayer = new FeatureLayer({
                url: this.flUrl.current.value
            });
            this.map.removeAll();
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


    public render() {
        let { displayNow } = this.props.appState;
        const { key } = this.props;

        let disabled = false;
        if (!this.props.appState.pulseSourceLoaded) {
            disabled = true;
        }

        return (
            <Container>
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

                <Button variant="light" id="play" onClick={this.play} disabled={disabled}>&#9658;</Button>
                <Button variant="light" id="stop" onClick={this.stopAnimation} disabled={disabled}>&#9632;</Button>

                <Row className="extra-tab">
                    <Col className="extra-tab-label">
                        Animation speed
                    </Col>
                    <Col>
                        <Knob onChange={this.setAnimationSpeed} unlockDistance={20} min={0} max={100} defaultValue={this.props.appState.config.defaultAnimationTime} ref={this.animationSpeed} />
                    </Col>
                    <Col className="extra-tab-value">
                        <Form.Control type="text" id="animation-time" className="animation-time" readOnly defaultValue={this.props.appState.config.defaultAnimationTime} ref={this.animationSpeed} />
                    </Col>
                </Row>

                <Badge variant="info" id="displayNow">{displayNow}</Badge>
            </Container>
        );
    }

}