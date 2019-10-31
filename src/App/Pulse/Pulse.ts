import FeatureLayer = require("esri/layers/FeatureLayer");
import { Renderer } from 'esri/renderers';

export class Pulse {
    
// #region STATIC

    public static getDocumentElementById(elementId: string) {
        let element: HTMLInputElement = <HTMLInputElement>document.getElementById(elementId);
        return element;
    }

    public static getDocumentElementValueById(elementId: string) {
        let element: HTMLInputElement = <HTMLInputElement>document.getElementById(elementId);
        return element ? element.value : "";
    }

    public static adjustAndFormatDate(timestamp: number, orgStartNo: number, orgEndNo: number): string {
        let adjustedTimestamp = Math.round(timestamp);
        if (adjustedTimestamp < orgStartNo) {
            adjustedTimestamp = orgStartNo;
        }
        else if (adjustedTimestamp > orgEndNo) {
            adjustedTimestamp = orgEndNo;
        }
        let adjustedDate = new Date(adjustedTimestamp);

        let adjustedAndFormattedDate = Pulse.formatTwoDigits(adjustedDate.getDate()) + "." + Pulse.formatTwoDigits(adjustedDate.getMonth()) + "." + adjustedDate.getFullYear();

        return adjustedAndFormattedDate;
    }

    private static formatTwoDigits(number: number) {
        return number.toString().padStart(2, '0');
    }

    public static symbolSwitcher(geometryType): Symbol {
        let symbol: Symbol;

        if (geometryType === "esriGeometryPoint" || "point") {
            symbol = {
                type: "picture-marker",
                url: "./images/PointIconImages/2.png",
                width: 20,
                height: 20
            } as unknown as Symbol;
        }

        if (geometryType === "esriGeometryPolyline") {
            symbol = {
                type: 'simple-line',
                width: 3,
                color: 'rgb(55, 55, 255)',
                opacity: 1
            } as unknown as Symbol;
        }

        if (geometryType === "esriGeometryPolygon") {
            symbol = {
                type: "simple-fill",
                color: "rgb(55, 55, 255)"
            } as unknown as Symbol;
        }

        return symbol;
    }

    public static createRenderer(value: number, symbol: Symbol, fieldToAnimate: string, stepNumber: number): Renderer {
        let renderer = {
            type: 'simple',
            symbol: symbol,
            visualVariables: [{
                type: 'opacity',
                field: fieldToAnimate,
                //stops control the fade out
                stops: [{
                        value: value - stepNumber * 40,
                        opacity: 0.0
                        //Change this to 0.1 if you always want it on screen during animation
                    },
                    {
                        value: value - stepNumber * 20,
                        opacity: 0.3
                    },
                    {
                        value: value - stepNumber * 1,
                        opacity: 1
                    },
                    {
                        value: value,
                        opacity: 1
                    },
                    {
                        value: value + stepNumber * 2,
                        opacity: 0
                    }

                ]
            }]
        };
        return renderer as unknown as Renderer;
    }
    
// #endregion STATIC

}