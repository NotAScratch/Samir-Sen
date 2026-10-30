# SimReady specimens

The homepage has a **Specimens** section (`#specimens`) that shows 3D objects
from NVIDIA's SimReady collection on Hugging Face. It stays hidden until
`assets/simready/manifest.json` lists at least one specimen. Don't add made-up
entries.

## 1. Download

Find the exact repo on https://huggingface.co/nvidia (search "SimReady"). If
the page has an "Agree and access" gate, accept the licence there, then:

```bash
pip install -U huggingface_hub
hf auth login
hf download nvidia/<repo-id> --repo-type dataset --local-dir ~/simready \
  --include "<folder-of-the-objects-you-want>/*"
```

Pick a handful (3–6) of objects that a perception system would have to read:
tools, containers, carts, pallets, and so on. Keep each GLB under about 5 MB.

## 2. Convert USD → GLB

SimReady assets are USD. Convert each one with Blender (4.x, headless):

```bash
blender -b --python tools/simready/usd_to_glb.py -- ~/simready/path/to/object.usd assets/simready/object.glb
```

The script keeps the asset's materials and textures, decimates very heavy
meshes, and writes a plain (non-Draco) GLB that the site's loader can read.

## 3. List them

Add each file to `assets/simready/manifest.json`:

```json
{
  "source": "https://huggingface.co/datasets/nvidia/<repo-id>",
  "specimens": [
    {
      "name": "Hand truck",
      "category": "Logistics",
      "model": "assets/simready/hand-truck.glb",
      "credit": "NVIDIA SimReady · <licence from the dataset card>"
    }
  ]
}
```

`model` must be a `.glb` directly inside `assets/simready/`. Copy `credit`
from the dataset card's licence; the page shows it in the figure caption.
Entries missing any field are ignored (`lib/specimens.js`). An optional
`"poster": "assets/simready/<name>.webp"` (a transparent still of the object)
is shown to visitors who don't get live 3D.

## How it renders

`lib/specimens.js` builds the list and sets `data-model` on the one
`data-robot="specimen"` stage. `robots/registry.js` builds it with
`buildSpecimen`, which keeps the asset's own materials and turns it slowly. It
shares the robots' lifecycle, so there is still only one live canvas per
viewport, and reduced motion, data saver and no-WebGL visitors are respected.
