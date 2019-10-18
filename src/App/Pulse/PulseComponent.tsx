import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';
import React from 'react';
import { Pulse } from './Pulse';
import { Col, Row, Form, Card, ListGroup, Alert } from 'react-bootstrap';
import { observable } from 'mobx';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
// import './PulseComponent.scss'

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
        let { map, mapView } = this.props.appState;
        const {key} = this.props;

        if (map && mapView && !this.pulse) {
            this.pulse = new Pulse(map, mapView);
            mapView.watch("zoom", ((e) => {
                this.zoom = mapView.zoom;
            }))
        }

        return <Alert>allalala {this.zoom}</Alert>
    }

}