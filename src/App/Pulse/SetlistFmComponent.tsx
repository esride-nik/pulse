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
    setFeatureLayer: Function,
    stopAnimation: Function
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
        this.props.stopAnimation();
        
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

/*

* add more setlist attributes (one setlist == one gig, => can have several sets)
* add SetlistComponent that renders those attributes. pass zoomToGig() function into this component
* detailed view of setlist offers songs

{id: "4b9c7f42", versionId: "301314f", eventDate: "29-09-2019", lastUpdated: "2019-09-29T23:35:43.000+0000", artist: {…}, …}
artist: {mbid: "3cd7b958-b101-49cc-98fe-4a9d99edb03e", name: "Black Peaks", sortName: "Black Peaks", disambiguation: "UK aggressive hardcore, post rock, formerly Shrine", url: "https://www.setlist.fm/setlists/black-peaks-6bd89236.html"}
eventDate: "29-09-2019"
id: "4b9c7f42"
info: "Played without Will Gardner due to illness"
lastUpdated: "2019-09-29T23:35:43.000+0000"
sets: {set: Array(2)}
url: "https://www.setlist.fm/setlist/black-peaks/2019/brighton-electric-brighton-england-4b9c7f42.html"
venue: {id: "3bd4b464", name: "Brighton Electric", city: {…}, url: "https://www.setlist.fm/venue/brighton-electric-brighton-england-3bd4b464.html"}
versionId: "301314f"
__proto__: Object

*/

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
            <Row className="setlistFmForm">
                <Col>
                    <Form.Control type="text" id="artist" placeholder="Enter an artist name" className="artist" onKeyDown={this.handleKeyDown} onBlur={this.querySetlists} ref={this.artist}/>
                </Col>
                <Col>
                    <Button variant="light" id="setlist" onClick={this.querySetlists}>&#9636;</Button>
                </Col>
            </Row>
            {/* <Row>
                <ListGroup>
                    <ListGroup.Item>Cras     justo odio</ListGroup.Item>
                    <ListGroup.Item>Dapibus ac facilisis in</ListGroup.Item>
                    <ListGroup.Item>Morbi leo risus</ListGroup.Item>
                    <ListGroup.Item>Porta ac consectetur ac</ListGroup.Item>
                    <ListGroup.Item>Vestibulum at eros</ListGroup.Item>
                </ListGroup>
            </Row> */}
            </Container>
        );
    }

}