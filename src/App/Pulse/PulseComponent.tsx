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
        let { map, mapView } = this.props.appState;
        let fullExtent: Extent = new Extent();
        this.props.appState.venueGraphics.map((venueGraphic: Graphic) => {
            fullExtent = this.extendPointLayerExtent(fullExtent, venueGraphic.geometry);
        });

        const venuesFeatureLayer = new FeatureLayer({
            // create an instance of esri/layers/support/Field for each field object

            fields: [{
                name: "eventDate",
                alias: "eventDate",
                type: "integer"
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
            objectIdField: "ObjectID",
            geometryType: "point",
            spatialReference: { wkid: 4326 },
            source: this.props.appState.venueGraphics,  //  an array of graphics with geometry and attributes
                              // popupTemplate and symbol are not required in each feature
                              // since those are handled with the popupTemplate and
                              // renderer properties of the layer
            // popupTemplate: pTemplate,
            // renderer: uvRenderer,  // UniqueValueRenderer based on `type` attribute
            id: "venueFeatures",
            title: "Venues",
            fullExtent: fullExtent
        });

        if (this.pulse) {
            this.pulse.setFeatureLayer(venuesFeatureLayer, this.props.appState.fieldToAnimate, this.props.appState.fieldToAnimateMinValue, this.props.appState.fieldToAnimateMaxValue);
        }
        map.removeAll();
        map.add(venuesFeatureLayer);
        mapView.goTo(venuesFeatureLayer.fullExtent);
    }

    public render() {
        let { map, mapView, config } = this.props.appState;
        const {key} = this.props;

        if (map && mapView && !this.pulse) {
            this.pulse = new Pulse(map, mapView, config);
        }
        if (this.props.appState.venueGraphics && this.props.appState.venueGraphics.length>0 && this.props.appState.fieldToAnimate && this.props.appState.fieldToAnimateMinValue && this.props.appState.fieldToAnimateMaxValue) {
            console.log("venueGraphicsToFeatureLayer");
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
                <Badge variant="info" id="displayNow"></Badge>
            </Container>
        );
    }

}