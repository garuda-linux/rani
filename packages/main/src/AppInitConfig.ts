export interface AppInitConfig {
  preload: {
    path: string;
  };

  renderer:
    | {
        path: string;
      }
    | URL;
}
