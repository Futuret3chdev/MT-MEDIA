/** Shared currency formatting for casino floor games. */

export function floorSymbol(mode) {
  return mode?.currency === 'mt' ? 'MT' : '₵';
}

export function formatFloorAmt(mode, n) {
  const v = Number(n);
  if (mode?.currency === 'mt') {
    const dec = v < 1 || v % 1 !== 0 ? 2 : 0;
    return `${v.toFixed(dec)} MT`;
  }
  return `₵${v.toLocaleString()}`;
}

export function formatFloorChipLabel(mode, v) {
  if (mode?.currency === 'mt') {
    const dec = v < 1 ? 2 : v % 1 !== 0 ? 2 : 0;
    return `${v.toFixed(dec)}`;
  }
  return `₵${v}`;
}