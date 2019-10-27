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

    constructor(props) {
        super(props);
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

    private extendPointLayerExtent(extent: Extent, geometry: Geometry): Extent {
        if (geometry.type=="point") {
            if (extent.xmax==0 && extent.xmin==0 && extent.ymax==0 && extent.ymin==0) {
                extent.xmax = geometry.x;
                extent.xmin = geometry.x;
                extent.ymax = geometry.y;
                extent.ymin = geometry.y;
            }
            else {
                if (geometry.y < extent.ymin) {
                    extent.ymin = geometry.y;
                }
                if (geometry.y > extent.ymax) {
                    extent.ymax = geometry.y;
                }
                if (geometry.x < extent.xmin) {
                    extent.xmin = geometry.x;
                }
                if (geometry.x > extent.xmax) {
                    extent.xmax = geometry.x;
                }
            }
        }
        return extent;
    }

    private venueGraphicsToFeatureLayer() {
        let fullExtent: Extent = new Extent();
        this.props.appState.venueGraphics.map((venueGraphic: Graphic) => {
            fullExtent = this.extendPointLayerExtent(fullExtent, venueGraphic.geometry);
        });

        let graphicsCollection = new Collection();
        graphicsCollection.addMany(this.props.appState.venueGraphics);

        const venuesFeatureLayer = new FeatureLayer({
            // create an instance of esri/layers/support/Field for each field object

            fields: [{
                  name: "OBJECTID",
                  alias: "objectId",
                  type: "oid"
            },
            {
                name: "eventDate",
                alias: "eventDate",
                type: "long"
            },
            {
                name: "id",
                alias: "id",
                type: "string"
            },
            {
                name: "info",
                alias: "info",
                type: "string"
            },
            {
                name: "url",
                alias: "url",
                type: "string"
            }],
            popupTemplate: {
              content: "<a href='{url}'></a>"
            },
            objectIdField: "OBJECTID",
            geometryType: "point",
            spatialReference: { wkid: 4326 },
            source: graphicsCollection,
            id: "venueFeatures",
            title: "Venues",
            fullExtent: fullExtent
        });

        if (this.pulse) {
            this.pulse.setFeatureLayer(venuesFeatureLayer, this.props.appState.fieldToAnimate, this.props.appState.fieldToAnimateMinValue, this.props.appState.fieldToAnimateMaxValue);
        }
    }

    public render() {
        let { map, mapView, config, displayNow } = this.props.appState;
        const { key } = this.props;

        if (map && mapView && !this.pulse) {
            this.pulse = new Pulse(map, mapView, config);
        }
        if (this.props.appState.venueGraphics && this.props.appState.venueGraphics.length>0 && this.props.appState.fieldToAnimate && this.props.appState.fieldToAnimateMinValue && this.props.appState.fieldToAnimateMaxValue) {
            this.venueGraphicsToFeatureLayer();
        }

        return (
            <Container>
                <Tabs defaultActiveKey="setlistfm" id="pulse-tab">
                    <Tab eventKey="setlistfm" title="Setlist.fm">
                        <SetlistFmComponent key={key}/>
                    </Tab>
                    <Tab eventKey="featureLayer" title="FeatureLayer">
                        <Row>
                            <Form.Control type="text" id="fs-url" placeholder="Enter a FeatureServer URL here" className="fs-url"/>
                            <div id="feature-layer-name">...</div>
                        </Row>
                        <Row>
                            Select attribute to animate
                            <Form.Control as="select" id="selection">
                                <option></option>
                            </Form.Control>
                            for
                            <Form.Control type="text" id="animation-time" placeholder="Enter duration in seconds here" className="animation-time"/> seconds
                        </Row>
                    </Tab>
                </Tabs>
                <Button variant="light" id="play">&#9658;</Button>
                <Button variant="light" id="stop">&#9632;</Button>
                <Badge variant="info" id="displayNow">{displayNow}</Badge>
            </Container>
        );
    }

}