import React from "react";
import ReactDOM from "react-dom/client";
import {Provider} from "react-redux";
import {BrowserRouter} from "react-router-dom";
import App from "./App";
import CssBaseline from "@mui/material/CssBaseline";

import "./index.scss";
import { ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import store from "./redux/store";

// Подавляем ошибку ResizeObserver (известная проблема Material-UI)
const resizeObserverLoopErrRe = /^[^(]*ResizeObserver[^)]*$/;
const resizeObserverLoopErrRe2 = /ResizeObserver loop completed with undelivered notifications/;
const originalError = window.onerror;
window.onerror = function(msg, ...args) {
    if (
        resizeObserverLoopErrRe.test(msg) ||
        resizeObserverLoopErrRe2.test(msg)
    ) {
        return true;
    }
    return originalError ? originalError(msg, ...args) : false;
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <>
    <CssBaseline />
    <ThemeProvider theme={theme}>
        <BrowserRouter>

            <Provider store={store}>
                <App />
            </Provider>
        </BrowserRouter>

    </ThemeProvider>
  </>
);
