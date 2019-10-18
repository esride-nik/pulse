import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';
import React from 'react';
import { Pulse } from './Pulse';
import { Col, Row, Form, Card, ListGroup, Alert } from 'react-bootstrap';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
// import './PulseComponent.scss'

@inject('appState')
@observer
export class PulseComponent extends React.Component<{
    appState?: AppState,
    map: Map,
    mapView: MapView,
    key: number
}> {
    private pulse: Pulse;
    
    constructor(props) {
        super(props);
    }

    public render() {
        let { map, mapView } = this.props;

        console.log("PulseComponent", map, mapView);

        if (map && mapView && !this.pulse) {
            this.pulse = new Pulse(map, mapView);
        }

        const {key} = this.props;
        // return <Alert key={key} variant="light">alkfd</Alert>
        return <div>nag {key}</div>
    }

}