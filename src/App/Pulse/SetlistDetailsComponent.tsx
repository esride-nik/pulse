import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import './SetlistDetailsComponent.scss';
import { Pulse } from './Pulse';

@inject('appState')
@observer
export class SetlistDetailsComponent extends React.Component<{
    appState?: AppState,
    recentSetlist: any
}> {
    setlistFmConnector: any;
    artist: React.RefObject<unknown>;

    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    public render() {
        let setlistDetailsNode;
        if (this.props.appState && this.props.appState.setlists) {
            setlistDetailsNode = this.props.appState.setlists.map((setlist: any) => {
                let detailsClass = "notCurrent";
                if (this.props.recentSetlist.id === setlist.id) {
                    detailsClass = "current";
                }


        /*
                {
                    "id": "3b9c4494",
                    "versionId": "7b0e1278",
                    "eventDate": "08-10-2019",
                    "lastUpdated": "2019-10-13T16:48:27.000+0000",
                    "artist": {
                        "mbid": "63aa26c3-d59b-4da4-84ac-716b54f1ef4d",
                        "name": "Tame Impala",
                        "sortName": "Tame Impala",
                        "disambiguation": "",
                        "url": "https://www.setlist.fm/setlists/tame-impala-53d727d9.html"
                    },
                    "venue": {
                        "id": "3d3fd5f",
                        "name": "Mission Ballroom",
                        "city": {
                            "id": "5419384",
                            "name": "Denver",
                            "state": "Colorado",
                            "stateCode": "CO",
                            "coords": {
                                "lat": 39.7391536,
                                "long": -104.9847034
                            },
                            "country": {
                                "code": "US",
                                "name": "United States"
                            }
                        },
                        "url": "https://www.setlist.fm/venue/mission-ballroom-denver-co-usa-3d3fd5f.html"
                    },
                    "sets": {
                        "set": [
                        ]
                    },
                    "url": "https://www.setlist.fm/setlist/tame-impala/2019/mission-ballroom-denver-co-3b9c4494.html"
                },
                */

                let cityAndCountry = "";
                cityAndCountry += setlist.venue.city ? setlist.venue.city.name : "";
                cityAndCountry += setlist.venue.city && setlist.venue.city.stateCode.length>0 ? ", "+setlist.venue.city.stateCode : "";
                cityAndCountry += setlist.venue.city && setlist.venue.city.country && setlist.venue.city.country.code.length>0 ? ", "+setlist.venue.city.country.code : "";

                let setlistInfo = "";
                if (setlist.info.length>0) {
                    setlistInfo = setlist.info + "\n";
                }
                
                return <Card className={detailsClass} key={setlist.id}>
                    {/* <Card.Img variant="top" src="holder.js/100px180" /> */}
                    <Card.Body>
                        <Card.Title>{Pulse.adjustAndFormatDate(setlist.eventDate, this.props.appState.orgStartNo, this.props.appState.orgEndNo)} | {cityAndCountry} | {setlist.venue.name}</Card.Title>
                        {/* <Card.Subtitle></Card.Subtitle> */}
                        <Card.Text>
                            {setlistInfo}
                        </Card.Text>
                        <Card.Link href="{setlist.url}">{cityAndCountry}</Card.Link>
                        {/* <Button variant="primary" onClick={this.props.zoomTo} objectId={setlist.OBJECTID}>Zoom</Button> */}
                    </Card.Body>
                </Card>
            }
        )};

        return (
            <Container className="setlistDetails">
                {setlistDetailsNode}
            </Container>
        );
    }

}