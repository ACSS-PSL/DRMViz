import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";
import Root from "./views/Root";

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
