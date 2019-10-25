import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Pulse } from './Pulse';
import { SetlistFmComponent } from './SetlistFmComponent';
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

    constructor(props) {
        super(props);
    }

    public render() {
        let { map, mapView, config } = this.props.appState;
        const {key} = this.props;

        if (map && mapView && !this.pulse) {
            this.pulse = new Pulse(map, mapView, config);
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