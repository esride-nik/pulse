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
import { Point } from 'esri/geometry';

@inject('appState')
@observer
export class SetlistFmComponent extends React.Component<{
    appState?: AppState,
    key: number
}> {
    setlistFmConnector: any;
    artist: React.RefObject<unknown>;

    constructor(props) {
        super(props);
        this.artist = React.createRef();
    }

    componentDidMount() {
        this.artist.current.value = "Black Peaks";
        this.artist.current.focus();
    }

    private handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.querySetlists();
        }
    }

    private buildQuery = (): SetlistFmQuery => {
        let query: SetlistFmQuery = {};
        if (this.artist.current.value && this.artist.current.value.length>1) {
            query.artistName = this.artist.current.value;
        }
        return query;
    }

    public querySetlists = () => {
        const { apiKey, baseUrl, setlists } = this.props.appState.config.setlistFmConnector;

        let query = this.buildQuery();

        let url = baseUrl + setlists + query.artistName;
        let options = 
            { 
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            };

        axios.get(url, options).then((response: any) => {
            console.log("Setlists response", response.data);
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
                    graphics.push(new Graphic({
                        attributes: setlist,
                        geometry: venueLocation,
                        symbol: {
                            type: "picture-marker",
                            url:
                              "https://arcgis.github.io/arcgis-samples-javascript/sample-data/cat3.png",
                            width: 46,
                            height: 46
                        }
                    }));
                });
                this.props.appState.venueGraphics = graphics;
            }
        });
    }

    public render() {
        return (
            <Container>
                <Row>
                    <Form.Control type="text" id="artist" placeholder="Enter an artist name" className="artist" onKeyDown={this.handleKeyDown} ref={this.artist}/>
                </Row>
                <Row>
                    <Button variant="light" id="setlist" onClick={this.querySetlists}>&#9636;</Button>
                </Row>
                <Row>
                    <Badge variant="info" id="displayNow"></Badge>
                </Row>
            </Container>
        );
    }

}