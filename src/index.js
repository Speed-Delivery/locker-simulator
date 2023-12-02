// src/index.js
import React from "react";
import ReactDOM from "react-dom";
import "./index.css"; // Import your Tailwind CSS file
import App from "./App";
import "./App.css"; // Import your App.css containing Tailwind CSS

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
