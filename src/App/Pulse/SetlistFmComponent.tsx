import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import { observable } from 'mobx';
import { SetlistFmQuery } from './Interfaces';
import axios from 'axios';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
import './SetlistFmComponent.scss';
import Graphic from 'esri/Graphic';
import { Point, Extent, Geometry } from 'esri/geometry';
import Collection from 'esri/core/Collection';
import FeatureLayer from 'esri/layers/FeatureLayer';

@inject('appState')
@observer
export class SetlistFmComponent extends React.Component<{
    appState?: AppState,
    key: number,
    setFeatureLayer: Function
}> {
    setlistFmConnector: any;
    artist: React.RefObject<unknown>;

    constructor(props) {
        super(props);
        this.artist = React.createRef();
    }

    componentDidMount() {
        // ToDo: get recent artists from setlist.fm and randomly select one as default value?
        this.artist.current.value = "Black Peaks";
        this.artist.current.focus();
    }

    private handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.querySetlists();
        }
    }

    private buildSetlistFmQuery = (): SetlistFmQuery => {
        let query: SetlistFmQuery = {};
        if (this.artist.current.value && this.artist.current.value.length>1) {
            query.artistName = this.artist.current.value;
        }
        return query;
    }
    
    private reformatSetlistFmDate(setlistFmDate: string) {
        return setlistFmDate.substr(6,4) + "-" + setlistFmDate.substr(3,2) + "-" + setlistFmDate.substr(0,2);
    }

    public querySetlists = () => {
        const { apiKey, baseUrl, setlists } = this.props.appState.config.setlistFmConnector;

        let query = this.buildSetlistFmQuery();

        let url = baseUrl + setlists + query.artistName;
        let options = 
            { 
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            };

        let objectId = 0;
        axios.get(url, options).then((response: any) => {
            if (response.data && response.data.setlist) {
                let graphics: Graphic[] = [];
                response.data.setlist.map((setlist: any) => {
                    let venueLocation: Point;
                    if (setlist.venue && setlist.venue.city && setlist.venue.city.coords) {
                        venueLocation = new Point({
                            x: setlist.venue.city.coords.long,
                            y: setlist.venue.city.coords.lat,
                            spatialReference: {
                                wkid: 4326
                            }
                        });
                    }

                    let attInfo = setlist.info ? setlist.info : "";
                    let attributes = {
                        "url": setlist.url,
                        "OBJECTID": objectId,
                        "eventDate": Date.parse(this.reformatSetlistFmDate(setlist.eventDate)),
                        "id": setlist.id,
                        "info": attInfo,
                    }
                    graphics.push(new Graphic({
                        attributes: attributes,
                        geometry: venueLocation
                    }));
                    objectId++;
                });
                this.venueGraphicsToFeatureLayer(graphics);
            }
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

    private venueGraphicsToFeatureLayer(venueGraphics: Graphic[]) {
        let fullExtent: Extent = new Extent();
        venueGraphics.map((venueGraphic: Graphic) => {
            fullExtent = this.extendPointLayerExtent(fullExtent, venueGraphic.geometry);
        });

        let graphicsCollection = new Collection();
        graphicsCollection.addMany(venueGraphics);

        const venuesFeatureLayer = new FeatureLayer({
            // create an instance of esri/layers/support/Field for each field object

            fields: [{
                  name: "OBJECTID",
                  alias: "objectId",
                  type: "oid"
            },
            {
                name: "eventDate",
                alias: "eventDate",
                type: "long"
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
            popupTemplate: {
              content: "<a href='{url}'></a>"
            },
            objectIdField: "OBJECTID",
            geometryType: "point",
            spatialReference: { wkid: 4326 },
            source: graphicsCollection,
            id: "venueFeatures",
            title: "Venues",
            fullExtent: fullExtent
        });

        let eventDates: number[] = venueGraphics.map((graphic: Graphic) => graphic.attributes.eventDate);
        this.props.appState.startNo = Math.min(...eventDates);
        this.props.appState.endNo = Math.max(...eventDates);
        this.props.appState.fieldToAnimate = "eventDate";
        this.props.appState.pulseFeatureLayer = venuesFeatureLayer;
        
        this.props.setFeatureLayer(this.props.appState.pulseFeatureLayer, this.props.appState.fieldToAnimate, this.props.appState.startNo, this.props.appState.endNo);
    }

    public render() {
        return (
            <Container>
                <Row>
                    <Form.Control type="text" id="artist" placeholder="Enter an artist name" className="artist" onKeyDown={this.handleKeyDown} onBlur={this.querySetlists} ref={this.artist}/>
                </Row>
                <Row>
                    <Button variant="light" id="setlist" onClick={this.querySetlists}>&#9636;</Button>
                </Row>
            </Container>
        );
    }

}