import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
import './MapComponent.scss'

@inject('appState')
@observer
export class MapComponent extends React.Component<{
    appState?: AppState
}> {
    private mapNode = React.createRef<HTMLDivElement>()

    private mapView: MapView;
    private map: Map;

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
        this.mapView.when(() => {
            this.props.appState.map = this.map;
            this.props.appState.mapView = this.mapView;
        });
    }

    public render() {
        return <div className="map" ref={this.mapNode}></div>
    }

}