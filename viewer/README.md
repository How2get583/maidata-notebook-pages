# Viewer host

This directory is the static host used by the blog iframe. The compiled
Unity WebGL files are produced by the separate `work/MajdataView_web` source
project and should be copied into `viewer/Build/` for a same-repository local
preview. In the eventual split-repository deployment, set
`MAIDATA_CONFIG.viewerUrl` in `notes.js` to the public Viewer Pages URL.
