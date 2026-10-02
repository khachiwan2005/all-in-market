class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireAdmin()) return {};
    return Object.assign({}, AIM.adminNav());
  }
}
