import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';
import React from 'react';
import { Pulse } from './Pulse';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import { observable } from 'mobx';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
import './PulseComponent.scss';

@inject('appState')
@observer
export class PulseComponent extends React.Component<{
    appState?: AppState,
    key: number
}> {
    private pulse: Pulse;

    @observable
    private zoom: number;

    constructor(props) {
        super(props);
    }

    public render() {
        let { map, mapView, config } = this.props.appState;
        const {key} = this.props;

        if (map && mapView && !this.pulse) {
            this.pulse = new Pulse(map, mapView, config);
            mapView.watch("zoom", ((e) => {
                this.zoom = mapView.zoom;
            }))
        }

        return (
            <Container>
                <Tabs defaultActiveKey="setlistfm" id="pulse-tab">
                    <Tab eventKey="setlistfm" title="Setlist.fm">
                        <Row>
                            <Form.Control type="text" id="artistname" placeholder="Enter an artist name" className="artistname"/>
                        </Row>
                        <Row>
                            <Button variant="light" id="setlist">&#9636;</Button>
                        </Row>
                        <Row>
                            <Badge variant="info" id="displayNow"></Badge>
                        </Row>
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
                        <Row>
                            <Button variant="light" id="play">&#9658;</Button>
                            <Button variant="light" id="stop">&#9632;</Button>
                        </Row>
                        <Row>
                            <Badge variant="info" id="displayNow"></Badge>
                        </Row>
                    </Tab>
                </Tabs>
            </Container>
        );
    }

}