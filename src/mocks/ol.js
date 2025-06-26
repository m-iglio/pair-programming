export const ol = {
  layer: {
    Tile: class {
      constructor(config) {
        this.config = config;
        this._visible = true;
      }
      setVisible(val) {
        this._visible = val;
      }
      getVisible() {
        return this._visible;
      }
    },
  },
  source: {
    OSM: class {
      constructor(config) {
        this.config = config;
      }
    },
    XYZ: class {
      constructor(config) {
        this.config = config;
      }
    },
    BingMaps: class {
      constructor(config) {
        this.config = config;
      }
    },
  },
};
