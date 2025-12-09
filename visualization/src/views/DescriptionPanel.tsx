import { FC } from "react";
import { BsInfoCircle } from "react-icons/bs";

import Panel from "./Panel";

const DescriptionPanel: FC = () => {
  return (
    <Panel
      initiallyDeployed
      title={
        <>
          <BsInfoCircle className="text-muted" /> Description
        </>
      }
    >
      <p>
        This map represents a <i>network</i> of Ph. D. students, Ph. D. advisors and jury members from the DRM research lab.{" "}
        Each <i>node</i> represents a researcher and each edge represents <b>a thesis supervision</b> (directed from the{" "}
        advisor to the student), <b>a thesis examination</b> (directed from the jury member to the student), or <b>a{" "}
        co-occurrence in a jury</b> (undirected). Jury members are included even if they have not done their Ph. D. with DRM{" "}
        or supervized a DRM thesis, but only if they took part in at least 2 DRM-related juries.
      </p>
      <p>
        The data was enriched using open data from{" "}
        <a target="_blank" rel="noreferrer" href="https://theses.fr/">
          Theses.fr
        </a>
        .
      </p>
      <p>
        This web application has been developed by{" "}
        <a target="_blank" rel="noreferrer" href="https://acss-dig.psl.eu">
          the ACSS-PSL institute
        </a>{" "}
        based on{" "}
        <a target="_blank" rel="noreferrer" href="https://github.com/jacomyal/sigma.js/tree/main/packages/demo">
          a template app from OuestWare
        </a>
        , using{" "}
        <a target="_blank" rel="noreferrer" href="https://reactjs.org/">
          React
        </a>{" "}
        and{" "}
        <a target="_blank" rel="noreferrer" href="https://www.sigmajs.org">
          sigma.js
        </a>
        . You can read the source code{" "}
        <a target="_blank" rel="noreferrer" href="https://github.com/ACSS-PSL/DRMViz">
          on GitHub
        </a>
        .
      </p>
      <p>
        Nodes sizes are related to their{" "}
        <a target="_blank" rel="noreferrer" href="https://en.wikipedia.org/wiki/Betweenness_centrality">
          betweenness centrality
        </a>
        . More central nodes (ie. bigger nodes) are important crossing points in the network.
      </p>
    </Panel>
  );
};

export default DescriptionPanel;
