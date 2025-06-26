import "./App.css";

import { Provider } from "react-redux";
import store from "./store/store";

import LayerSwitcher from "./components/LayerSwitcher";

import "./mocks/map";

function App() {
    return (
        <main>
            <h1>Legacy layer selector</h1>
            <Provider store={store}>
                <LayerSwitcher />
            </Provider>
        </main>
    );
}

export default App;
