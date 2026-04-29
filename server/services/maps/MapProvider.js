class MapProvider {
  // eslint-disable-next-line class-methods-use-this
  async getRoute() {
    throw new Error('MapProvider.getRoute not implemented');
  }
}

module.exports = MapProvider;
