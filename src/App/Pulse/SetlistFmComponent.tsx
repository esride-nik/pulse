import { observer, inject } from 'mobx-react';
import { AppState } from '../States/AppState';
import React from 'react';
import { Container, Col, Row, Form, Card, ListGroup, Alert, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import { observable } from 'mobx';
import { SetlistFmConnector } from "./SetlistFmConnector";

// import { cssMapToString } from 'esrich.web.common.react/utils/tsxUtils';
import './SetlistFmComponent.scss';

@inject('appState')
@observer
export class SetlistFmComponent extends React.Component<{
    appState?: AppState,
    key: number
}> {
    setlistFmConnector: any;

    constructor(props) {
        super(props);
        let { config } = props.appState;
        this.setlistFmConnector = new SetlistFmConnector(config.setlistFm);
    }

    private handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.setlistFmConnector.getDataAxios(e);
        }
      }

    public render() {
        return (
            <Container>
                <Row>
                    <Form.Control type="text" id="artistname" placeholder="Enter an artist name" className="artistname" onKeyDown={this.handleKeyDown}/>
                </Row>
                <Row>
                    <Button variant="light" id="setlist" onClick={this.setlistFmConnector.getDataAxios}>&#9636;</Button>
                </Row>
                <Row>
                    <Badge variant="info" id="displayNow"></Badge>
                </Row>
            </Container>
        );
    }

}