import { SET_BASE_LAYER } from "../actions/mapActions";

export const webMapReducer = (state = { baseLayer: null }, action) => {
    switch (action.type) {
        case SET_BASE_LAYER:
            return { ...state, baseLayer: action.payload };
        default:
            return state;
    }
};
