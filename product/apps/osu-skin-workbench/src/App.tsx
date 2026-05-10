import { useState } from "react";
import { AppTitlebar } from "./components/AppTitlebar";
import { ProjectHubClient } from "./components/ProjectHubClient";
import { ProjectWorkspaceClient } from "./components/ProjectWorkspaceClient";
import "./styles.css";

type RouteState =
  | { screen: "hub" }
  | { screen: "project"; projectId: string };

export default function App() {
  const [route, setRoute] = useState<RouteState>({ screen: "hub" });

  return (
    <div className="appFrame">
      <AppTitlebar />

      {route.screen === "project" ? (
        <ProjectWorkspaceClient
          initialProjectId={route.projectId}
          onBackToHub={() => setRoute({ screen: "hub" })}
        />
      ) : (
        <ProjectHubClient
          onOpenProject={(projectId) =>
            setRoute({ screen: "project", projectId })
          }
        />
      )}
    </div>
  );
}
