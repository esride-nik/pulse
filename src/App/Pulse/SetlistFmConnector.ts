import axios from 'axios';
import esriRequest from "esri/request";

export class SetlistFmConnector {

    private config: any;

    public constructor(config: any) {

        this.config = config;

        // let headers = {
        //     headers: {
        //         'X-My-Custom-Header': 'Header-Value',
        //         "x-api-key": apiKey 
        //     }
        // };

        // axios.get(baseUrl + searchArtist + "black%20peaks", headers).then((flResponse: any) => {
        //     console.log("response", flResponse);
        // });
    }

    async getDataAxios() {
        const { apiKey, baseUrl, searchArtist } = {
            "baseUrl": "https://api.setlist.fm/rest/1.0",
            "apiKey": "7_Q_PB-S4jb5GoJjH2a71IPw9CtiZLi1GM0-",
            "searchArtist": "/search/artists?artistName="
        };
        let url = baseUrl + searchArtist + "black%20peaks";
        let options = 
            { 
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            };

        const response = await axios.get(url, options);
        console.log(response.data)
    }

    public get = () => {
        const { apiKey, baseUrl, searchArtist } = this.config.setlistFm;


        axios({ 
            method: 'get', 
            url: baseUrl + searchArtist + "black%20peaks", 
            headers: { "x-api-key": apiKey } 
        });


    //     const instance = axios.create({
    //         baseURL: baseUrl,
    //         timeout: 1000,
    //         headers: {
    //             "x-api-key": apiKey,
    //             "Accept": "application/json"
    //         }
    //     });

    //     instance.get(searchArtist + "black%20peaks").then((flResponse: any) => {
    //         console.log("instance response", flResponse);
    //     });
    }

}