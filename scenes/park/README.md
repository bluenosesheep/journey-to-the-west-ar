# Park module v3

Standalone rule:
- uses `../../targets/park.mind`
- because park.mind contains only Park, targetIndex is `0`
- target entity and parkWorld are declared directly in the standalone HTML
- no dynamic creation of the MindAR target

Integrated rule (later):
- uses `./targets/citywithmagic.mind`
- Park targetIndex is `1`
- same park-scene.js is reused

This keeps standalone and integrated target mapping separate and predictable.
