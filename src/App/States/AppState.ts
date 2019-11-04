import { observable, computed } from 'mobx'
import Map from 'esri/Map';
import FeatureLayer from 'esri/layers/FeatureLayer';
import SceneView from 'esri/views/SceneView';

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
    public appLevelLoading = false;

    @observable
    public map: Map;

    @observable
    public view: SceneView;

    @observable
    public displayNow: string;

    @observable
    public fieldToAnimate: string;

    @observable
    public currentFrame: number;

    @observable
    public orgStartNo: number;

    @observable
    public orgEndNo: number;

    @observable
    public startNo: number;

    @observable
    public endNo: number;

    @observable
    public stepNumber: number;

    @observable
    public automaticZoom: boolean;

    @observable
    public pulseSourceLoaded: boolean;

    @observable
    public pulseFeatureLayer: FeatureLayer;

    @observable
    public pulseFeatureLayerSymbol: Symbol;

    @observable
    public pulseFeatureLayerChanged: boolean;

    @observable
    public setlists: any[];

    @observable
    public displaySetlists: any[];

    @observable
    public recentSetlist: any;

    @observable
    public nextSetlist: any;

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