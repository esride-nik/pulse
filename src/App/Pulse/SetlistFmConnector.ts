import axios from 'axios';
import esriRequest from "esri/request";

export class SetlistFmConnector {

    private config: any;

    public constructor(config: any) {
        this.config = config;
    }

    public getDataAxios = () => {
        const { apiKey, baseUrl, searchArtist } = this.config;
        let url = baseUrl + searchArtist + "black%20peaks";
        let options = 
            { 
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            };

        axios.get(url, options).then((response: any) => {
            console.log(response.data)
        });
    }

}