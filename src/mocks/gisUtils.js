export const GISUtils = {
  doProcessUserExtent: (ewkt) => {
    const wkt = GISUtils.EWKTToWKT(ewkt);
    const feature = GISUtils.WKTToFeature(wkt);
    const featureToBbox = GISUtils.featureToBbox(feature);

    if (GISUtils.isInfinityExtent(featureToBbox)) {
      return [];
    }

    return featureToBbox;
  },
};
