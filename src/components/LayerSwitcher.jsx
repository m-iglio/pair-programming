import React, { useEffect, useRef } from "react";

import { shallowEqual, useSelector, useDispatch } from "react-redux";
import { setBaseLayer } from "../store/actions/mapActions";

import { Popover } from "antd";

import { t } from "../mocks/ttag";

import { URLHashUtils } from "../mocks/urlHashUtils";
import { GISUtils } from "../mocks/gisUtils";
import { getItem, setItem } from "../mocks/localStorageUtils";
import { WEB_MERCATOR, WGS84, SPHERICAL_MERCATOR } from "../mocks/constants";

import * as olLayer from "ol/layer";
import * as olSource from "ol/source";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import TileState from "ol/TileState";
import { get as getProjection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";

// This 3 global variable:
// - shouldn't be global
// - could be merge in one recursive object
let mapBaseLayers = {}; // is just a index of all the layer
let layerGroups = {}; // represent the tree structure of the layer
let translations = {}; // just hold the "label" of the layer

/**
 * Use the following object data structure as a state (that unified the previous 3 object data structure as a global variable mess)
 * Here is the type definition.
 *
 * @typedef {Object} LayerNode
 * @property {string} id 
 * @property {string} title
 * @property {number} orderIndex 
 * @property {any} olLayer 
 * @property {false} [isGroup] 
 *
 * @typedef {Object} LayerGroup
 * @property {string} id 
 * @property {string} title
 * @property {number} orderIndex
 * @property {true} isGroup
 * @property {LayerTree[]} children
 *
 * @typedef {LayerNode | LayerGroup} LayerTree
 */

const customLayersGroupKey = "customLayersGroup";
const noLayerGroupKey = "noLayerGroup";

/**
 * Next three function only make up for the vague datastructure use
 */
const createLayer = (key, olDefinition, translation, layerGroupKey) => {
    translations[key] = translation;
    mapBaseLayers[key] = olDefinition;

    layerGroups[layerGroupKey][key] = olDefinition;
};

const createCustomerLayer = (olDefinition, customLayerDefinition) => {
    const key = `cust-${customLayerDefinition.id}`;

    translations[key] = customLayerDefinition.title;
    mapBaseLayers[key] = olDefinition;
    //customer layers are always displayed in root
    layerGroups[customLayersGroupKey][key] = olDefinition;
};

const createLayerGroup = (key, translation) => {
    translations[key] = translation;
    layerGroups[key] = {};
    return key;
};
/**
 * End
 */

/**
 * Next three function are OpenLayer focused, probably can be refactor but shouldn't be a priority
 */
const initWMSLayer = (customLayer, getMapRequestUrl) => {
    //handle projection system
    let srs = null;

    let layerSrs = customLayer.srs ? customLayer.srs.split(", ") : [];
    if (layerSrs.includes(SPHERICAL_MERCATOR)) {
        srs = SPHERICAL_MERCATOR;
    } else if (layerSrs.includes(WEB_MERCATOR)) {
        srs = WEB_MERCATOR;
    } else if (layerSrs.includes(WGS84)) {
        srs = WGS84;
    } else {
        console.log(`layer srs may not be compatible - ${customLayer.name}`);
        srs = SPHERICAL_MERCATOR;
    }
    let layer = new olLayer.Tile({
        //maxZoom: maxZoomLevel,
        // minZoom: minZoomLevel ? minZoomLevel : 0,
        singleTile: false,
        opacity: 1,
        buffer: 0,
        source: new olSource.TileWMS({
            url: getMapRequestUrl,
            params: { LAYERS: customLayer.name, TILED: true },
            attributions: [customLayer.attribution ? customLayer.attribution : ""],
            projection: srs,
            //crossOrigin: 'use-credentials',
        }),
    });

    if (customLayer.server.credentials /*|| customLayer.server.headers*/) {
        layer.getSource().setTileLoadFunction(function(tile, src) {
            const xhr = new XMLHttpRequest();
            xhr.responseType = "blob";
            xhr.addEventListener("loadend", function(evt) {
                const data = this.response;
                if (data !== undefined && data !== null) {
                    tile.getImage().src = URL.createObjectURL(data);
                } else {
                    tile.setState(TileState.ERROR);
                }
            });
            xhr.addEventListener("error", function() {
                tile.setState(TileState.ERROR);
            });
            xhr.open("GET", src);

            //handle authentication
            if (customLayer.server.credentials) {
                //Authorization:  QWxhZGRpbjpvcGVuIHNlc2FtZQ==
                xhr.setRequestHeader(
                    "Authorization",
                    `Basic ${customLayer.server.credentials}`,
                );
            }

            //set custom headers
            // if (customLayer.server.headers) {
            //     const headerArray = customLayer.server.headers.split(";");
            //     headerArray.forEach((header) => {
            //         if (header.includes(":")) {
            //             const values = header.split(":");
            //             xhr.setRequestHeader(values[0], values[1]);
            //         }
            //     });
            // }
            xhr.send();
        });
    }
    return layer;
};

const initWMTSLayer = (customLayer, getMapRequestUrl) => {
    //todo: handle grids
    const projection = getProjection("EPSG:3857");
    const projectionExtent = projection.getExtent();
    const size = getWidth(projectionExtent) / 256;

    const resolutions = new Array(25);
    const matrixIds = new Array(resolutions.length);
    for (let z = 0; z < resolutions.length; ++z) {
        // generate resolutions and matrixIds arrays for this WMTS
        resolutions[z] = size / Math.pow(2, z);
        matrixIds[z] = z;
    }

    let layer = new olLayer.Tile({
        opacity: 1,
        source: new olSource.WMTS({
            attributions: [customLayer.attribution ? customLayer.attribution : ""],
            url: getMapRequestUrl,
            layer: customLayer.name,
            matrixSet: customLayer.matrixSets
                ? customLayer.matrixSets.split(", ")[0]
                : "GoogleMapsCompatible",
            format: customLayer.formats
                ? customLayer.formats.split(", ")[0]
                : "image/png",
            projection: projection,
            tileGrid: new WMTSTileGrid({
                origin: getTopLeft(projectionExtent),
                resolutions: resolutions,
                matrixIds: matrixIds,
            }),
            style: customLayer.styles ? customLayer.styles.split(", ")[0] : "default",
            wrapX: true,
        }),
    });
    return layer;
};

const initXYZLayer = (customLayer, getMapRequestUrl) => {
    let layer = new olLayer.Tile({
        preload: Infinity,
        maxZoom: 22,
        source: new olSource.XYZ({
            url: getMapRequestUrl,
            interpolate: true,
            opaque: true,
            attributions: [customLayer.attribution ? customLayer.attribution : ""],
            crossOrigin: "anonymous",
        }),
    });
    return layer;
};
/**
 * End
 */

export default () => {
    const { user, baseLayer } = useSelector(
        (state) => ({
            user: state.user.user,
            baseLayer: state.webMap.baseLayer,
        }),
        shallowEqual,
    );

    const dispatch = useDispatch();
    const prevBaseLayer = useRef();
    //create the default layer group
    //createLayerGroup(customLayersGroupKey, null);

    /**
     * This effect fill the three layer global variable
     */
    useEffect(() => {
        let forceLoadFirstCustomLayer = false;
        //custom layers per customer
        if (user.baseLayers) {
            //at first use of custom layers set a cookie/local storage entry, use that to determine if this is the first time when this user loads the page and custom layers are present, if so, whatever it has in the url as base layer must be overridden
            const customBaselayersFlag = getItem(
                "CUSTOMBASELAYERSDISPLAYED",
                user.login,
            );
            if (customBaselayersFlag) {
                forceLoadFirstCustomLayer = false;
            } else {
                forceLoadFirstCustomLayer = true;
                setItem("CUSTOMBASELAYERSDISPLAYED", true);
            }

            //create the default layer group
            createLayerGroup(customLayersGroupKey, null);

            user.baseLayers.forEach((l) => {
                const customLayer = Object.values(l)[0];
                let layer;

                // todo:
                // - use credentials
                // - use min max zoom

                const protocol = customLayer.protocol
                    ? Object.values(customLayer.protocol)[0]
                    : "";

                let getMapRequestUrl =
                    `XYZ` === protocol
                        ? customLayer.server.address
                        : customLayer.server.getMapRequestUrl;
                if (`WMS` === protocol) {
                    layer = initWMSLayer(customLayer, getMapRequestUrl);
                } else if (`WMTS` === protocol) {
                    layer = initWMTSLayer(customLayer, getMapRequestUrl);
                } else if (`XYZ` === protocol) {
                    layer = initXYZLayer(customLayer, getMapRequestUrl);
                } else {
                    console.log(`Unknown layer protocol: ${customLayer.protocol}`);
                    return;
                }

                //extent - imajnet uses, WGS84, we need web mercator
                if (layer.extent) {
                    const webMercatorExtent = GISUtils.doProcessUserExtent(layer.extent);
                    if (webMercatorExtent.length) {
                        layer.setExtent(webMercatorExtent);
                    }
                }

                createCustomerLayer(layer, customLayer);
            });
        }

        if (user.showOSM) {
            const groupKey = createLayerGroup("OSMLayers", t`OSM layers`);

            //get OSM url from env var, if not set, use the detault
            let osmUrl = import.meta.env.VITE_IMAJNET_OSM_TILE_URL;
            if (!osmUrl) {
                osmUrl = "https://{a-c}.openstreetmap.imajing.fr/{z}/{x}/{y}.png";
            }

            const osm = new olLayer.Tile({
                preload: Infinity,
                maxZoom: 22,
                source: new olSource.OSM({
                    url: osmUrl,

                    //crossOrigin: 'use-credentials',
                }),
            });
            createLayer("OSM", osm, t`OpenStreetMap`, groupKey);

            const OpenCycleMap = new olLayer.Tile({
                preload: Infinity,
                maxZoom: 22,
                source: new olSource.OSM({
                    attributions: [
                        'All maps © <a href="https://www.opencyclemap.org/">OpenCycleMap</a>',
                        olSource.OSM.ATTRIBUTION,
                    ],
                    url: "https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=25dd076bbef44fab8c6a8e0b3642c257",
                }),
            });
            createLayer("OpenCycleMap", OpenCycleMap, t`OpenCycleMap`, groupKey);

            const OpenTransportationMap = new olLayer.Tile({
                preload: Infinity,
                maxZoom: 22,

                source: new olSource.OSM({
                    attributions: [
                        'All maps © <a href="http://www.opentransportmap.info//">OpenTransportationMap</a>',
                        olSource.OSM.ATTRIBUTION,
                    ],
                    url: "https://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=25dd076bbef44fab8c6a8e0b3642c257",
                }),
            });
            createLayer(
                "OpenTransportationMap",
                OpenTransportationMap,
                t`OpenTransportationMap`,
                groupKey,
            );
        }

        /**
         * `bingStyles` and `bingTranslations` are constant, not depending on React lifecycle
         * These two arrays are index-linked and must stay in sync: bingStyles[i] maps to bingTranslations[i]
         * Consider merging into a single structure
         */
        //we add bing layers only if the key is present
        //const user = undefined;
        const bingStyles = [
            "RoadOnDemand",
            "Aerial",
            "AerialWithLabelsOnDemand",
            "CanvasDark",
            //'OrdnanceSurvey'
        ];
        if (user.bingKey && mapBaseLayers["RoadOnDemand"] === undefined) {
            const groupKey = createLayerGroup("BingLayers", t`Bing layers`);

            const bingApiKey = user.bingKey;

            const bingTranslations = [
                t`Bing Road`,
                t`Bing Satellite`,
                t`Bing Road/Satellite`,
                t`Bing dark`,
            ];

            // for (let i = 0; i < styles.length; i++) {
            //     translations[styles[i]] = bingTranslations[i];
            // }

            for (let i = 0, ii = bingStyles.length; i < ii; ++i) {
                const bingLayer = new olLayer.Tile({
                    preload: Infinity,

                    maxZoom: 19,
                    source: new olSource.XYZ({
                        url: bingApiKey,
                        imagerySet: bingStyles[i],
                        tileUrlFunction: (tile, src) => {
                            tile.setState(2);
                        },
                        // use maxZoom 19 to see stretched tiles instead of the BingMaps
                        // "no photos at this zoom level" tiles
                        // maxZoom: 19
                    }),
                });
                createLayer(bingStyles[i], bingLayer, bingTranslations[i], groupKey);
            }
        }

        //no base layer
        createLayerGroup(noLayerGroupKey, null);
        const noBaseLayer = new olLayer.Tile({
            source: null,
        });

        createLayer(
            "NoBaseLayer",
            noBaseLayer,
            t`No background map`,
            noLayerGroupKey,
        );

        //handle default layer
        const urlBaseLayer = URLHashUtils.getValue(URLHashUtils.MAP_URL_PARAM_NAME);
        if (
            forceLoadFirstCustomLayer ||
            !urlBaseLayer ||
            !mapBaseLayers.hasOwnProperty(urlBaseLayer) ||
            bingStyles.includes(urlBaseLayer)
        ) {
            //set it to the first available layer

            const firstLayer = Object.keys(mapBaseLayers)[0];
            dispatch(setBaseLayer(firstLayer));
            // dispatch(
            //     mapBaseLayers.hasOwnProperty("OSM")
            //         ? setBaseLayer("OSM")
            //         : setBaseLayer("NoBaseLayer"),
            // );
        } else {
            dispatch(setBaseLayer(urlBaseLayer));
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (baseLayer) {
            prevBaseLayer.current &&
                window.map.getLayers().remove(prevBaseLayer.current);
            const layer = mapBaseLayers[baseLayer];
            window.map.addLayer(layer);
            layer.setZIndex(-1);
            window.map.getView().setMaxZoom(layer.getMaxZoom());
        }
        prevBaseLayer.current = mapBaseLayers[baseLayer];
    }, [baseLayer]);

    const LayerMenuElement = ({ layerKey }) => {
        return (
            <div
                className={`menu-item ${baseLayer === layerKey ? "active" : ""}`}
                key={layerKey}
                onClick={() => dispatch(setBaseLayer(layerKey))}
                title={translations[layerKey]}
            >
                {translations[layerKey]}
            </div>
        );
    };

    const LayerGroupContent = ({ layers, layerGroupKey }) => {
        return (
            <div key={layerGroupKey}>
                {Object.keys(layers).map((layer) => (
                    <LayerMenuElement key={layer} layerKey={layer} />
                ))}
            </div>
        );
    };

    const LayerGroupMenuElement = ({ layerGroupKey }) => {
        const groupLayers = layerGroups[layerGroupKey];
        if (
            layerGroupKey === customLayersGroupKey ||
            layerGroupKey === noLayerGroupKey
        ) {
            return (
                <div key={layerGroupKey}>
                    {Object.keys(groupLayers).map((layer) => (
                        <LayerMenuElement key={layer} layerKey={layer} />
                    ))}
                </div>
            );
        }
        return (
            <Popover
                content={
                    <LayerGroupContent
                        layers={groupLayers}
                        layerGroupKey={layerGroupKey}
                    />
                }
                placement="right"
            >
                <div
                    className={`menu-item sub-switcher ${groupLayers.hasOwnProperty(baseLayer) ? "active" : ""
                        }`}
                    key={layerGroupKey}
                >
                    {translations[layerGroupKey]}
                </div>
            </Popover>
        );
    };

    const BaseLayersContent = () => (
        <div>
            {Object.keys(layerGroups).map((layerGroupKey) => (
                <LayerGroupMenuElement
                    key={layerGroupKey}
                    layerGroupKey={layerGroupKey}
                />
            ))}
        </div>
    );

    return (
        <Popover content={<BaseLayersContent />} placement="right">
            <div className="layer-switcher">Layer</div>
        </Popover>
    );
};
