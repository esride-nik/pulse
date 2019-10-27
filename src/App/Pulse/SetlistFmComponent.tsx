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
                this.props.appState.venueGraphics = graphics;
                let eventDates: number[] = graphics.map((graphic: Graphic) => graphic.attributes.eventDate);
                this.props.appState.fieldToAnimateMinValue = Math.min(...eventDates);
                this.props.appState.fieldToAnimateMaxValue = Math.max(...eventDates);
                this.props.appState.fieldToAnimate = "eventDate";
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
            </Container>
        );
    }

}