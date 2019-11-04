import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import './SetlistDetailsComponent.scss';
import { Pulse } from './Pulse';

@inject('appState')
@observer
export class SetlistDetailsComponent extends React.Component<{
    appState?: AppState
}> {
    setlistFmConnector: any;
    artist: React.RefObject<unknown>;

    constructor(props) {
        super(props);
    }

    public render() {
        let setlistDetailsNode = [];
        if (this.props.appState && this.props.appState.displaySetlists) {
            setlistDetailsNode = this.props.appState.displaySetlists.map((setlist: any) => {
                let detailsClass = "notCurrent";
                if (this.props.appState.recentSetlist && this.props.appState.recentSetlist.id === setlist.id) {
                    detailsClass = "current";
                }

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
                        <Card.Subtitle>{setlist.artist.name}</Card.Subtitle>
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