import { URLHashUtils } from "../../mocks/urlHashUtils";

export const SET_BASE_LAYER = "SET_BASE_LAYER";

export const setBaseLayer = (layerId) => {
    URLHashUtils.setValue(URLHashUtils.MAP_URL_PARAM_NAME, layerId);
    return {
        type: SET_BASE_LAYER,
        payload: layerId,
    };
};
