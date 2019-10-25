import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import './MapComponent.scss';
import Graphic from 'esri/Graphic';
import { Extent, Point, Geometry } from 'esri/geometry';

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

    public render() {
        console.log("Map Component", this.props.appState.venueFeatures);

        if (this.props.appState.venueFeatures && this.props.appState.venueFeatures.length>0) {
            let venueGraphicsLayer = new GraphicsLayer({
                id: "venueFeatures",
                title: "Venues"
            });
            let fullExtent: Extent = new Extent();
            this.props.appState.venueFeatures.map((venueFeature: Graphic) => {
                venueGraphicsLayer.graphics.push(venueFeature);
                fullExtent = this.extendPointLayerExtent(fullExtent, venueFeature.geometry);
            });
            venueGraphicsLayer.fullExtent = fullExtent;
            this.map.remove(this.map.findLayerById("venueFeatures"));
            this.map.add(venueGraphicsLayer);
            this.mapView.goTo(venueGraphicsLayer.fullExtent);
        }

        return <div className="map" ref={this.mapNode}></div>
    }

}