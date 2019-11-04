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
import { Pulse } from './Pulse';
import { array } from 'prop-types';
import TimeExtent from 'esri/TimeExtent';

const venueFeaturesLayerId = "venueFeatures";

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
        let randomArtists = this.props.appState.config.setlistFmConnector.randomArtists;
        this.artist.current.value = randomArtists[Math.floor((Math.random() * randomArtists.length))];
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
        if (this.props.appState.config.setlistFmConnector.demoMode) {
            url = this.props.appState.config.setlistFmConnector.demoUrl;
        }
        axios.get(url, options).then((response: any) => {
            this.props.appState.setlists = [];
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
                    let eventDate = Date.parse(this.reformatSetlistFmDate(setlist.eventDate));
                    let attributes = {
                        "url": setlist.url,
                        "OBJECTID": objectId,
                        "eventDate": eventDate,
                        "id": setlist.id,
                        "info": attInfo,
                    };
                    this.props.appState.setlists.push({
                        "OBJECTID": objectId,
                        "id": setlist.id,
                        "eventDate": eventDate,
                        "info": attInfo,
                        "artist": setlist.artist,
                        "sets": setlist.sets,
                        "url": setlist.url,
                        "venue": setlist.venue
                    });

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

    private setlistSets(setlist: any) {
        let setlistString: string = "";
        let songBaseUrl = setlist.artist.url.replace("setlists", "stats/songs") + "?song=";
        if (setlist.sets.set.length>0) {
            let set = setlist.sets.set.map((set: any) => {
                let songs = set.song.filter((song: any) => song.name.length > 0);
                return songs.map((song: any) => {
                    let songString = '<li>';
                    songString += !song.tape ? '<a href="' + songBaseUrl + song.name.replace(" ", "+") + '" target="_blank">' : '';
                    songString += song.name;
                    songString += !song.tape ? '</a>' : '';
                    songString += song.info ? '<small>' + song.info + '</small>' : '';
                    songString += '</li>';
                    return songString;
                });
            });
            const reducer = (accumulator, currentValue) => accumulator + currentValue;
            setlistString = '<a href="' + setlist.url + '" target="_blank">Set</a>: <ul>' + set[0].reduce(reducer) + '</ul><br/>';
        }
        return setlistString;
    }

    private setlistContent = (setlistFeature: any) => {
        let setlistGraphic: Graphic = setlistFeature.graphic;
        let objectId = setlistGraphic.attributes.OBJECTID;
        let setlist = this.props.appState.setlists.filter((setlist: any) => setlist.OBJECTID==objectId)[0];
        return ('<div>'
        + 'Disambiguation: ' + setlist.artist.disambiguation + '<br/>'
        + 'Venue: <a href="' + setlist.venue.url + '" target="_blank">' + setlist.venue.name + ', ' + setlist.venue.city.name + ', ' + setlist.venue.city.country.code + '</a><br/>'
        + this.setlistSets(setlist)
        + '</div>');
    }

    private setlistTitle = (setlistFeature: any) => {
        let setlistGraphic: Graphic = setlistFeature.graphic;
        let objectId = setlistGraphic.attributes.OBJECTID;
        let setlist = this.props.appState.setlists.filter((setlist: any) => setlist.OBJECTID==objectId)[0];
        return ('<h2>' + Pulse.formatDate(new Date(setlist.eventDate)) + ' | <a href="' + setlist.artist.url + '" target="_blank">' + setlist.artist.name + '</a></h2>');
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
                title: this.setlistTitle,
                content: this.setlistContent
            },
            objectIdField: "OBJECTID",
            geometryType: "point",
            spatialReference: { wkid: 4326 },
            source: graphicsCollection,
            id: venueFeaturesLayerId,
            title: "Venues",
            fullExtent: fullExtent,
            timeInfo: {
                startField: "eventDate"
            }
        });

        let eventDates: number[] = venueGraphics.map((graphic: Graphic) => graphic.attributes.eventDate);
        this.props.appState.startNo = Math.min(...eventDates);
        this.props.appState.endNo = Math.max(...eventDates);
        
        venuesFeatureLayer.timeInfo.fullTimeExtent = new TimeExtent({
            start: new Date(this.props.appState.startNo),
            end: new Date(this.props.appState.endNo)
          });

        this.props.appState.fieldToAnimate = "eventDate";
        this.props.appState.pulseFeatureLayer = venuesFeatureLayer;
        
        this.props.setFeatureLayer(this.props.appState.pulseFeatureLayer, this.props.appState.fieldToAnimate, this.props.appState.startNo, this.props.appState.endNo);
    }

    public render() {
        return (
            <Container>
                <Row className="setlistFmForm">
                    <Form.Control type="text" id="artist" placeholder="Enter an artist name" className="artist" onKeyDown={this.handleKeyDown} onBlur={this.querySetlists} ref={this.artist}/>
                    <Button variant="outline-secondary" id="setlist" onClick={this.querySetlists}>&#9636;</Button>
                </Row>
            </Container>
        );
    }

}