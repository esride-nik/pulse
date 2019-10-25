import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import { observable } from 'mobx';
import { SetlistFmConnector } from "./SetlistFmConnector";
import { SetlistFmQuery } from './Interfaces';

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
import './SetlistFmComponent.scss';

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
        let { config } = props.appState;

        this.artist = React.createRef();

        this.setlistFmConnector = new SetlistFmConnector(config.setlistFm);
    }

    componentDidMount() {
        this.artist.current.value= "Snippet Upper Laser";
        this.artist.current.focus();
    }

    private handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.buildSetlistFmQuery();
        }
    }

    private buildSetlistFmQuery = () => {
        let query: SetlistFmQuery = {};
        if (this.artist.current.value && this.artist.current.value.length>1) {
            query.artist = this.artist.current.value;
        }
        this.setlistFmConnector.querySetlistFmData(query);
    }

    public render() {
        return (
            <Container>
                <Row>
                    <Form.Control type="text" id="artist" placeholder="Enter an artist name" className="artist" onKeyDown={this.handleKeyDown} ref={this.artist}/>
                </Row>
                <Row>
                    <Button variant="light" id="setlist" onClick={this.buildSetlistFmQuery}>&#9636;</Button>
                </Row>
                <Row>
                    <Badge variant="info" id="displayNow"></Badge>
                </Row>
            </Container>
        );
    }

}