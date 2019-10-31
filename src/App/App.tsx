import * as React from 'react';
import { hot } from 'react-hot-loader/root';
import DevTools from 'mobx-react-devtools';
import './App.scss';
import { inject, observer } from 'mobx-react';
import { AppState } from './States/AppState';
import { computed, observable, action } from 'mobx';
import { MapComponent } from './Map/MapComponent';
import { PulseComponent } from './Pulse/PulseComponent';
import { Container, Col, Row, Form, Card, ListGroup, Alert } from 'react-bootstrap';

@inject('appState')
@observer
class App extends React.Component<{
    appState?: AppState
}> {
    constructor(props) {
        super(props);
    }

    public componentDidMount() {
        this.props.appState.pulseSourceLoaded = false;
    }

    @computed
    public get nls() {
        return this.props.appState.nls
    }

    public render() {
        let key=1;
        return (
            <Container className={"app"}>
                <Row className={"app"}>
                    <Col className={"mapCol"}>
                        <MapComponent />
                    </Col>
                    <Col className={"pulseCol"} xs={3}>
                        <PulseComponent key={key}/>
                    </Col>
                    {/* {process.env.NODE_ENV === 'development' ? <DevTools /> : null} */}
                </Row>
            </Container>
        )
    }
}

export default hot(App)
