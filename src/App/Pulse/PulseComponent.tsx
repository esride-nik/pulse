import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Pulse } from './Pulse';
import { SetlistFmComponent } from './SetlistFmComponent';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import { observable } from 'mobx';
import Map from 'esri/Map';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
import './PulseComponent.scss';
import Extent from 'esri/geometry/Extent';
import Graphic from 'esri/Graphic';
import Geometry from 'esri/geometry/Geometry';
import FeatureLayer from 'esri/layers/FeatureLayer';
import Collection, { isCollection } from 'esri/core/Collection';

@inject('appState')
@observer
export class PulseComponent extends React.Component<{
    appState?: AppState,
    key: number
}> {
    private pulse: Pulse;
    map: Map;
    selection: React.RefObject<unknown>;
    fsurl: React.RefObject<unknown>;
    animationTime: React.RefObject<unknown>;

    constructor(props) {
        super(props);
        this.selection = React.createRef();
        this.fsurl = React.createRef();
        this.animationTime = React.createRef();
    }

    private play = () => {
        //Stops any previously added animations in the frame
        this.pulse.stopAnimation();

        //There's an unknown issue caused by "ObjectID"
        //This is currently a workaround for it.
        if(this.selection.current.value === "OBJECTID"){
            if (this.fsurl.current.value != "") {
                this.pulse.featureLayer = new FeatureLayer({
                    url: this.fsurl.current.value
                });
                this.map.removeAll()
                this.map.add(this.pulse.featureLayer)
            }
        }

        //update with changed values.
        this.pulse.updateBrowserURL();

        this.calculateParametersAndStartAnimation(this.animationTime.current.value);
    }

    private calculateParametersAndStartAnimation = (animationTime: number) => {
        //generate step number here too
        let difference = Math.abs(this.pulse.startNo - this.pulse.endNo);
        let differencePerSecond = difference / animationTime;
        this.pulse.stepNumber = differencePerSecond / this.pulse.setIntervalSpeed;
        this.pulse.animation = this.animate(this.pulse.startNo);
        
        //adding empty frames at the start and end for fade in/out
        this.pulse.orgEndNo = this.pulse.endNo;
        this.pulse.orgStartNo = this.pulse.startNo;
        this.pulse.endNo += this.pulse.stepNumber * 40;
        this.pulse.startNo -= this.pulse.stepNumber * 2;

        this.pulse.setRenderer(this.pulse.startNo);
    }

    private animate(startValue: number) {
        this.pulse.animating = true;
        let currentFrame = startValue;

        let frame = () => {
            if (this.pulse.restarting) {
                clearTimeout(this.pulse.intervalFunc);
                this.pulse.restarting = false;
            }

            currentFrame += this.pulse.stepNumber;
            
            if (currentFrame > this.pulse.endNo) {
                currentFrame = this.pulse.startNo;
            }

            let displayNow: number = this.displayNow(currentFrame, this.pulse.orgStartNo, this.pulse.orgEndNo);
            this.props.appState.displayNow = this.pulse.fieldToAnimate + " " + displayNow.toString();
            this.pulse.setRenderer(currentFrame);

            //animation loop.
            if (this.pulse.animating) {
                this.pulse.intervalFunc = setTimeout(function() {
                    //stops it from overloading.
                    requestAnimationFrame(frame);
                }, this.pulse.setIntervalSpeed);
            }
        }

        // recursive function, starting the animation.
        frame();

        return {
            remove: () => {
                this.pulse.animating = false;
            }
        };
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

    private setPulseFeatureLayerUnchanged() {
        this.props.appState.pulseFeatureLayerChanged = false;
    }

    public render() {
        let { map, mapView, config, displayNow } = this.props.appState;
        const { key } = this.props;

        if (map && mapView && !this.pulse) {
            this.pulse = new Pulse(map, mapView, config);
        }
        if (this.props.appState.pulseFeatureLayerChanged) {
            if (this.pulse) {
                this.pulse.setFeatureLayer(this.props.appState.pulseFeatureLayer, this.props.appState.fieldToAnimate, this.props.appState.fieldToAnimateMinValue, this.props.appState.fieldToAnimateMaxValue);
            }
            this.setPulseFeatureLayerUnchanged();
        }

        return (
            <Container>
                <Tabs defaultActiveKey="setlistfm" id="pulse-tab">
                    <Tab eventKey="setlistfm" title="Setlist.fm">
                        <SetlistFmComponent key={key}/>
                    </Tab>
                    <Tab eventKey="featureLayer" title="FeatureLayer">
                        <Row>
                            <Form.Control type="text" id="fs-url" placeholder="Enter a FeatureServer URL here" className="fs-url" ref={this.fsurl}/>
                            <div id="feature-layer-name">...</div>
                        </Row>
                        <Row>
                            Select attribute to animate
                            <Form.Control as="select" id="selection" ref={this.selection}>
                                <option></option>
                            </Form.Control>
                        </Row>
                    </Tab>
                </Tabs>

                Animation time <Form.Control type="text" id="animation-time" placeholder="Enter duration in seconds here" className="animation-time" ref={this.animationTime}/> seconds

                <Button variant="light" id="play" onClick={this.play}>&#9658;</Button>
                <Button variant="light" id="stop">&#9632;</Button>
                <Badge variant="info" id="displayNow">{displayNow}</Badge>
            </Container>
        );
    }

}