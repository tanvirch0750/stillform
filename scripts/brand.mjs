/** Repeatable, content-only rebrand of frozen snapshots and published modules.
 * Preserve route slugs, SVG IDs, component names, motion definitions, and bag IDs.
 */
export const wordmarkPaths = 'M17 8H9C4 8 4 16 9 16H13C18 16 18 24 13 24H5 M23 8H37M30 8V24 M44 8V24 M53 8V24H64 M71 8V24H82 M89 24V8H101M89 16H99 M114 8H111C104 8 104 24 111 24H114C121 24 121 8 114 8Z M125 24V8H132C139 8 139 16 132 16H125M132 16L139 24 M145 24V8L153 18L161 8V24';

export function wordmarkDrawing(color = '#1c1c1c') {
  return `<g transform="translate(0 6.3) scale(.6183)" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter"><path d="${wordmarkPaths}"/></g>`;
}

export const wordmarkSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101.818 32.117" role="img" aria-label="Stillform">${wordmarkDrawing()}</svg>`;

export function brandContent(text) {
  return text
    .replace(/\b(?:DripCase|Dripcase)\b/g, 'Stillform')
    .replace(/\b(?:DRIPCASE|DRPCASE)\b/g, 'STILLFORM')
    .replace(/STILLFORM PRIVATE LIMITED/g, 'STILLFORM')
    .replace(/support@dripcase\.com/g, 'support@stillform.example')
    .replace(/hellodrip@gmail\.com/g, 'hello@stillform.example')
    .replace(/mailto:youremail@gmail\.com/g, 'mailto:support@stillform.example')
    .replace(/Lastest Drip/g, 'Latest arrivals')
    .replace(/LATEST DRIP/g, 'NEW ARRIVALS')
    .replace(/Latest Drip/g, 'New arrivals')
    .replace(/SHOP THE DRIP/g, 'SHOP THE COLLECTION')
    .replace(/DELIVERING DRIP/g, 'DELIVERING STYLE')
    .replace(/FEEL THE DRIP/g, 'FEEL THE DIFFERENCE')
    // CMS records can be fetched as binary after navigation from a non-product
    // page. Brand decoded String values too, without altering offsets, record
    // IDs, slugs, query schemas, or any of the animation code. The character
    // classes keep this transform idempotent when the build hook runs again.
    .replace(/(type:[\w$]+\.String,value:)([\w$]+\.readString\(\))(?=})/g, '$1$2.replace(/\\b[D][rR][iI]?[pP][cC][aA][sS][eE]\\b/g,v=>v===v.toUpperCase()?"STILLFORM":"Stillform")')
    // Repair the earlier decoder hook without matching lowercase product slugs.
    .replaceAll('[dD][rR][iI]?[pP][cC][aA][sS][eE]', '[D][rR][iI]?[pP][cC][aA][sS][eE]')
    .replace(/<svg\b[^>]*viewBox="0 0 101\.818 32\.117"[^>]*>[\s\S]*?<\/svg>/g, (svg) => {
      const opening = svg.slice(0, svg.indexOf('>') + 1);
      const white = /(?:rgb\(255,\s*255,\s*255\)|stroke="#fff")/.test(svg);
      return opening + wordmarkDrawing(white ? '#fff' : '#1c1c1c') + '</svg>';
    });
}
