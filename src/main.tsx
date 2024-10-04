import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import App from "./App";
import "virtual:svg-icons-register";
import { BrowserRouter } from "react-router-dom";
import "@/i18n";
import "./styles.css";
import { initTaryEvent } from "./business/TaryEvent";
import "nprogress/nprogress.css";
import { initPlayerListener } from "./business/PlayerEventListener";
import auth from "@/utils/auth";
import { storeData } from "@/utils";
import { initEnv } from "@/utils/env";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);

store.subscribe(() => {
    localStorage.setItem("data", JSON.stringify(store.getState().core.data));
});

initPlayerListener(store);
initTaryEvent();
storeData.store = store;
auth.store = store;

function main() {
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <Provider store={store}>
                    <App />
                </Provider>
            </BrowserRouter>
        </React.StrictMode>
    );
}

initEnv().then(() => {
    main();
})

export { store };
