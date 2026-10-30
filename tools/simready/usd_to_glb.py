"""Convert one SimReady USD asset to a web GLB with Blender.

Run headless:
    blender -b --python tools/simready/usd_to_glb.py -- <input.usd> <output.glb>

Imports the USD, applies transforms, decimates very heavy meshes so the page
stays light, and exports a plain GLB (materials and textures kept).
"""
import sys

import bpy

MAX_TRIANGLES = 150_000


def main(src, dst):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.usd_import(filepath=src)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise SystemExit(f"No meshes in {src}")
    total = sum(len(o.data.polygons) for o in meshes)
    if total > MAX_TRIANGLES:
        ratio = MAX_TRIANGLES / total
        for o in meshes:
            mod = o.modifiers.new("decimate", "DECIMATE")
            mod.ratio = ratio
    bpy.ops.export_scene.gltf(
        filepath=dst,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=False,  # the page loader has no Draco decoder
        export_yup=True,
    )
    print(f"{src} -> {dst} ({total} faces before decimation)")


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(args) != 2:
        raise SystemExit("usage: blender -b --python usd_to_glb.py -- <input.usd> <output.glb>")
    main(*args)
