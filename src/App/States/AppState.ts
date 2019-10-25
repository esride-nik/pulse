import { observable, computed } from 'mobx'
import MapView from 'esri/views/MapView';
import Map from 'esri/Map';
import Graphic from 'esri/Graphic';

export class AppState {

    private _nls: any
    private _nlsCache: { [lang: string]: any } = {}

    public defaultLanguage = 'de'

    @observable
    public activeLanguage = navigator.language.split(`-`).shift()

    @computed
    public get nls() {
        return this._nlsCache[this.activeLanguage]
    }

    @observable
    public appLevelLoading = false

    @observable
    public map: Map;

    @observable
    public mapView: MapView;

    @observable
    public venueFeatures: Graphic[];

    public config: any;

    constructor(lang: any, config: any) {
        this._nls = lang
        this.config = config

        this.buildNlsCache(lang)
    }

    private buildNlsCache(lang) {
        let detectedLangs = []
        for (let prop in lang) {
            if (!lang[prop]) continue
            for (let langKey in lang[prop]) {
                if (!lang[prop][langKey]) continue;
                detectedLangs.Add(langKey)
            }
        }

        detectedLangs = detectedLangs.Distinct()

        for (let langKey of detectedLangs) {
            this._nlsCache[langKey] = {}
        }

        for (let prop in lang) {
            if (!lang[prop]) continue

            for (let langKey of detectedLangs) {
                this._nlsCache[langKey][prop] = lang[prop][langKey] || lang[prop][this.defaultLanguage]
            }
        }
    }
}