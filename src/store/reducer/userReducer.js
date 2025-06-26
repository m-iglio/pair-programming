import TileLayer from "ol/layer/Tile";
import { TileWMS } from "ol/source";

const initialUser = {
    bingKey: "demo-api-key",
    showOSM: true,
    baseLayers: [
        {
            WMSLayer: {
                title: "IGN Ortho (20cm)",
                name: "HR.ORTHOIMAGERY.ORTHOPHOTOS",
                id: "10",
                orderIndex: 3,
                protocol: { ImageryProtocol: "WMS" },
                extent:
                    "SRID=4326;POLYGON ((-63.16070698 -21.401263115, -63.16070698 51.112418912, 55.846431162 51.112418912, 55.846431162 -21.401263115, -63.16070698 -21.401263115))",
                srs: "CRS:84, EPSG:2154, EPSG:3857, EPSG:4326",
                attribution: "",
                type: "Imagery",
                server: {
                    id: "8",
                    name: "IGN imajing",
                    address: "https://data.geopf.fr/wms-r/wms",
                    getMapRequestUrl: "https://data.geopf.fr/wms-r/wms",
                    credentials: null,
                    headers: "",
                    type: "Imagery",
                    version: "1.3.0",
                    formats: "image/jpeg, image/png, image/tiff",
                    reverseAxis: false,
                },
            },
        },
        {
            WMSLayer: {
                title: "HR.ORTHOIMAGERY.ORTHOPHOTOS",
                name: "HR.ORTHOIMAGERY.ORTHOPHOTOS",
                id: "15",
                orderIndex: 4,
                protocol: { ImageryProtocol: "WMS" },
                extent:
                    "SRID=4326;POLYGON ((-180 -80, -180 80, 180 80, 180 -80, -180 -80))",
                srs: "CRS:84, EPSG:3857, EPSG:4326",
                attribution: "IGN",
                type: "Imagery",
                server: {
                    id: "8",
                    name: "IGN imajing",
                    address: "https://data.geopf.fr/wms-r/wms",
                    getMapRequestUrl: "https://data.geopf.fr/wms-r/wms",
                    credentials: null,
                    headers: "",
                    type: "Imagery",
                    version: "1.3.0",
                    formats: "image/jpeg, image/png, image/tiff",
                    reverseAxis: false,
                },
            },
        },
        {
            WMSLayer: {
                title: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS",
                name: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS",
                id: "16",
                orderIndex: 5,
                protocol: { ImageryProtocol: "WMS" },
                extent:
                    "SRID=4326;POLYGON ((-63.3725 -21.4756, -63.3725 51.3121, 55.9259 51.3121, 55.9259 -21.4756, -63.3725 -21.4756))",
                srs: "CRS:84, EPSG:3857, EPSG:4326",
                attribution: "IGN",
                type: "Imagery",
                server: {
                    id: "12",
                    name: "IGN Cadastre",
                    address: "https://data.geopf.fr/wms-r/wms",
                    getMapRequestUrl: "https://data.geopf.fr/wms-r/wms",
                    credentials: null,
                    headers: "",
                    type: "Imagery",
                    version: "1.3.0",
                    formats: "image/jpeg, image/png, image/tiff",
                    reverseAxis: false,
                },
            },
        },
        {
            WMSLayer: {
                title: "PCRS.LAMB93",
                name: "PCRS.LAMB93",
                id: "20",
                orderIndex: 6,
                protocol: { ImageryProtocol: "WMS" },
                extent: "SRID=4326;POLYGON ((-5 40, -5 52, 10 52, 10 40, -5 40))",
                srs: "CRS:84, EPSG:2154, EPSG:3857, EPSG:4326",
                attribution: "IGN",
                type: "Imagery",
                server: {
                    id: "16",
                    name: "IGN",
                    address: "https://data.geopf.fr/wms-r/wms",

                    getMapRequestUrl: "https://data.geopf.fr/wms-r/wms?SERVICE=WMS&",
                    credentials: null,
                    headers: "",
                    type: "Imagery",
                    version: "1.3.0",
                    formats: "image/jpeg, image/png, image/tiff",
                    reverseAxis: false,
                },
            },
        },
    ],
};

export const userReducer = (state = { user: initialUser }, action) => state;

function createWMSLayer({ id, title, name, url, attribution }) {
    return {
        WMSLayer: {
            id: `cust-${id}`,
            title,
            name,
            orderIndex: parseInt(id, 10),
            olLayer: new TileLayer({
                preload: Infinity,
                source: new TileWMS({
                    url,
                    params: {
                        LAYERS: name,
                        TILED: true,
                        VERSION: "1.3.0",
                    },
                    attributions: attribution ? [attribution] : [],
                }),
            }),
        },
    };
}
