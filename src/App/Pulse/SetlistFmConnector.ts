import axios from 'axios';
import { SetlistFmQuery } from './Interfaces';

export class SetlistFmConnector {

    private config: any;

    public constructor(config: any) {
        this.config = config;
    }

    public querySetlistFmData = (query: SetlistFmQuery) => {
        const { apiKey, baseUrl, searchArtist } = this.config;
        console.log("querySetlistFmData", query);

        let url = baseUrl + searchArtist + query.artist;
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