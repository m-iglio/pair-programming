import { combineReducers } from "redux";

import { userReducer } from "./userReducer";
import { webMapReducer } from "./mapReducer";

export const rootReducer = combineReducers({
  user: userReducer,
  webMap: webMapReducer,
});
