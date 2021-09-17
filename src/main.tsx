import React from "react";
import ReactDOM from "react-dom";
import App from "./app";

import "./styles/index.css";
import { SigmaContainer } from "./sigma-container";

ReactDOM.render(
  <React.StrictMode>
    <SigmaContainer
      graphOptions={{
        edgeKeyGenerator: ({ source, target }) => `${source}->${target}`,
      }}
    >
      <App />
    </SigmaContainer>
  </React.StrictMode>,
  document.getElementById("root")
);
