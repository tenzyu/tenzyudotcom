import { useState } from "react";
import { ProjectHubClient } from "./components/ProjectHubClient";
import { ProjectWorkspaceClient } from "./components/ProjectWorkspaceClient";

type RouteState =
  | { screen: "hub" }
  | { screen: "project"; projectId: string };

export default function App() {
  const [route, setRoute] = useState<RouteState>({ screen: "hub" });

  if (route.screen === "project") {
    return (
      <ProjectWorkspaceClient
        initialProjectId={route.projectId}
        onBackToHub={() => setRoute({ screen: "hub" })}
      />
    );
  }

  return <ProjectHubClient onOpenProject={(projectId) => setRoute({ screen: "project", projectId })} />;
}
