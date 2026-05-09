_docs_rename_completions() {
    local -a words
    local cur
    local -i cword

    if [[ -n "$ZSH_VERSION" ]]; then
        words=(${(z)LBUFFER})
        cword=${#words}
        cur="${words[cword]}"
    else
        words=("${COMP_WORDS[@]}")
        cword="$COMP_CWORD"
        cur="${COMP_WORDS[COMP_CWORD]}"
    fi

    # Find the position of 'docs-rename'
    local -i cmd_pos=-1
    for ((i=1; i<=${#words[@]}; i++)); do
        if [[ "${words[i]}" == "docs-rename" ]]; then
            cmd_pos=$i
            break
        fi
    done

    if (( cmd_pos == -1 )); then
        return
    fi

    local -i arg_idx=$((cword - cmd_pos))

    if (( arg_idx == 1 )); then
        # Completing the <old> path
        local completions
        completions=$(bun scripts/docs-rename.ts --list-completions "$cur" 2>/dev/null)
        if [[ -n "$ZSH_VERSION" ]]; then
            compadd -S '' -- ${(f)completions}
        else
            COMPREPLY=($(compgen -W "$completions" -- "$cur"))
        fi
    elif (( arg_idx == 2 )); then
        # Completing the <new> path
        local old_path="${words[cmd_pos+1]}"
        local completions
        completions=$(bun scripts/docs-rename.ts --list-directories 2>/dev/null)
        
        # Suggest the same directory as <old>
        local parent_dir
        parent_dir=$(dirname "$old_path")
        completions="$parent_dir"$'\n'"$completions"

        if [[ -n "$ZSH_VERSION" ]]; then
            compadd -S '' -- ${(f)completions}
        else
            COMPREPLY=($(compgen -W "$completions" -- "$cur"))
        fi
    fi
}

if [[ -n "$ZSH_VERSION" ]]; then
    # Zsh: register for both bun and nix (for nix develop -c)
    compdef _docs_rename_completions bun
    compdef _docs_rename_completions nix
elif [[ -n "$BASH_VERSION" ]]; then
    complete -F _docs_rename_completions bun
    complete -F _docs_rename_completions nix
fi
