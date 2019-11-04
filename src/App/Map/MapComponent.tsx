import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import Map from 'esri/Map';
import './MapComponent.scss';
import SceneView from 'esri/views/SceneView';

@inject('appState')
@observer
export class MapComponent extends React.Component<{
    appState?: AppState
}> {
    private mapNode = React.createRef<HTMLDivElement>()

    private view: SceneView;
    private map: Map;

    public componentDidMount() {
        this.map = new Map({
            basemap: "dark-gray-vector"
        })

        this.view = new SceneView({
            container: this.mapNode.current,
            map: this.map,
            zoom: 3,
            center: [0, 0]
        });

        this.props.appState.map = this.map;
        this.props.appState.view = this.view;
    }

    public render() {
        return <div className="map" ref={this.mapNode}></div>
    }
}