import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';
// import { Pulse } from '../Pulse/Pulse';
// import { PulseComponent } from '../Pulse/PulseComponent'
import { Col, Row, Form, Card, ListGroup } from 'react-bootstrap';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
import './MapComponent.scss'

@inject('appState')
@observer
export class MapComponent extends React.Component<{
    appState?: AppState,
    returnDataCallback: Function
}> {
    private mapNode = React.createRef<HTMLDivElement>()

    private mapView: MapView;
    private map: Map;
    // private pulse: Pulse;

    public componentDidMount() {
        this.map = new Map({
            basemap: "dark-gray-vector"
        })

        this.mapView = new MapView({
            container: this.mapNode.current,
            map: this.map,
            zoom: 3,
            center: [0, 0]
        });

        this.setState({
            "map": this.map,
            "mapView": this.mapView
        });

        // returning map and mapView back to parent to pass it on to PulseComponent
        this.props.returnDataCallback(this.map, this.mapView);

        // this.pulse = new Pulse(this.map, this.mapView);
    }

    public render() {
        // let key: number = 1; //Math.floor(Math.random()*100);
        return <div className="map" ref={this.mapNode}>
        {/* <PulseComponent key={key} /> */}
        </div>
    }

}