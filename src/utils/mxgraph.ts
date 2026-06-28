import factory from 'mxgraph';

// Disable dynamic resource loading so mxgraph works as a bundled library.
// The mxgraph factory writes options to `this`, so bind it to the global object.
const mx = factory.call(globalThis, {
  mxBasePath: '',
  mxImageBasePath: '',
  mxLoadResources: false,
  mxLoadStylesheets: false,
  mxForceIncludes: false,
  mxResourceExtension: '.txt',
});

export default mx;
