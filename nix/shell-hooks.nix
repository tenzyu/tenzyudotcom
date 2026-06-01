{ pkgs }: {
  common = ''
    export BIOME_BIN="${pkgs.biome}/bin/biome"

    if [ -f ./.env ]; then
      set -a
      source ./.env
      set +a
    fi

    if [ -f ./repo-ops/shell/completion.sh ]; then
      source ./repo-ops/shell/completion.sh
    elif [ -f ./repo-ops/scripts/completion.sh ]; then
      source ./repo-ops/scripts/completion.sh
    fi
  '';

  tauri = ''
    export XDG_DATA_DIRS="$GSETTINGS_SCHEMAS_PATH"
    export LD_LIBRARY_PATH=${pkgs.webkitgtk_4_1}/lib:$LD_LIBRARY_PATH
  '';
}
