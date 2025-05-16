import json

file_to_convert = "welcome.w95"
target_name = file_to_convert.replace(".w95", ".json")
"""
    "t": () => { return new tiles.WallBlock(util.loadTexture("tutorialbob.png")); },

    "W": () => { return new tiles.WallBlock(util.loadTexture("default.png", 4, 4)); },
    "P": () => { return new tiles.WallBlock(util.loadTexture("paintingwall.png")); },
    "M": () => { return new tiles.WallBlock(util.loadTexture("metal.png")); },
    "E": () => { return new tiles.Exit(); },
    "N": () => { return new tiles.NormalWallBlock(); },
    "Y": () => { return new tiles.WallBlock(util.loadTexture("wallpaper.png")); },
    "YP": () => { return new tiles.RandomizedWallBlock([ util.loadTexture("wallpaper_painting.png"),

    "Md": () => { return new tiles.BlockDoor(util.loadTexture("metal.png"), listener); },
    "Pd": () => { return new tiles.BlockDoor(util.loadTexture("paintingwall.png"), listener); },
    "B": () => { return new tiles.Bob(); },
    "m": () => { return new tiles.Martin(player); },

    "d": () => { return new tiles.ItemPedestal(listener, "document") },
    "i": () => { return new tiles.ItemPedestal(listener, "icecream") },

    "p": () => { return new tiles.PlantPot() },
    "*": () => { return new tiles.SecretTrigger(main); },
    "eG": () => { // Gob
    "eS": () => { // Sniffer
}
"""

conversions = {
    ".": "EMPTY",
    "^": "PLAYER_SPAWN",

    "t": "BOB_TUTORIAL_TEXT",

    "W": "PURPLE_TILED_WALL",
    "P": "PURPLE_TILED_WALL_PAINTING",
    "M": "METAL_WALL",
    "E": "EXIT",
    "N": "NORMAL_WALL",
    "Y": "WALLPAPER_WALL",
    "YP": "WALLPAPER_WALL_DECORATED",
    "Md": "METAL_DOOR",
    "Pd": "PURPLE_TILED_WALL_PAINTING_DOOR",
    "p": "PLANT_POT",
    "*": "SECRET_TRIGGER",

    "d": "DOCUMENT_PEDESTAL",
    "i": "ICECREAM_PEDESTAL",

    "B": "BOB_ENTITY",
    "m": "MARTIN_ENTITY",
    "eG": "GOB_ENTITY",
    "eS": "SNIFFER_ENTITY"
}

def convertId(id):
    return conversions[id]

with open(file_to_convert, "r") as file:
    data = file.read()
    skibidi = []
    for i in data.split("\n"):
        row = []
        row_items = i.split()
        for item in row_items:
            if item != "":
                row.append(convertId(item))
        skibidi.append(row)

    data_to_write = {
        "fogColor": 0x000000,
        "fogDensity": 0.05,
        "skyTexturePath": "sky.png",
        "floorTexturePath": "fancy_floor.png",
        "ceilingTexturePath": "fancy_floor.png",
        "ceilingPresent": True,

        "directionalLightColor": 0xfff2b3,
        "directionalLightIntensity": 2.5,
        "ambientLightColor": 0x777ca1,
        "ambientLightIntensity": 2,

        "content": skibidi
    }

    print("Enter level name: ", end="")
    target_name = input()
    with open(f"./levels/{target_name}.json", "w") as target:
        json.dump(data_to_write, target, indent=4)
