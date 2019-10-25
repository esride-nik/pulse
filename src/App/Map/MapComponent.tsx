import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';
import './MapComponent.scss';
import Graphic from 'esri/Graphic';
import { Extent, Point, Geometry } from 'esri/geometry';
import FeatureLayer from 'esri/layers/FeatureLayer';

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

    private venueGraphicsToFeatureLayer() {
        console.log("MapComponent adding Graphics", this.props.appState.venueGraphics);

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
        this.map.removeAll();
        this.map.add(venuesFeatureLayer);
        this.mapView.goTo(venuesFeatureLayer.fullExtent);
    }

    public render() {
        if (this.props.appState.venueGraphics && this.props.appState.venueGraphics.length>0) {
            this.venueGraphicsToFeatureLayer();
        }

        return <div className="map" ref={this.mapNode}></div>
    }
}