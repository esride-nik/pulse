import * as React from 'react'
import { hot } from 'react-hot-loader/root'
import DevTools from 'mobx-react-devtools'
import './App.scss'
import { inject, observer } from 'mobx-react'
import { AppState } from './States/AppState'
import { computed, observable, action } from 'mobx'
import { MapComponent } from './Map/MapComponent'
import { PulseComponent } from './Pulse/PulseComponent'
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';

declare var process

@inject('appState')
@observer
class App extends React.Component<{
    appState?: AppState
}> {
    @observable
    private map: Map;

    @observable
    private mapView: MapView;

    constructor(props) {
        super(props);
    }

    @computed
    public get nls() {
        return this.props.appState.nls
    }

    @action
    private getMapDataCallback = (map: Map, mapView: MapView) => {
        this.map = map;
        this.mapView = mapView;
    }

    public render() {
        let key: number = 1; 
        let PulseComponentNode = this.map && this.mapView ? <PulseComponent key={key} map={this.map} mapView={this.mapView}/> : undefined;
        return (
            <div className="app">
                <MapComponent returnDataCallback={this.getMapDataCallback}/>
                {PulseComponentNode}
                {/* {process.env.NODE_ENV === 'development' ? <DevTools /> : null} */}
            </div>
        )
    }
}

export default hot(App)
