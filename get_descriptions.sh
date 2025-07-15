#!/bin/bash

# Script to help extract package descriptions for tooltip updates
# Usage: ./get_descriptions.sh package-name

get_description() {
    local pkg="$1"
    
    # Try pacman first (official repos)
    desc=$(pacman -Si "$pkg" 2>/dev/null | grep -E "^Description" | cut -d':' -f2- | sed 's/^[[:space:]]*//')
    
    # If not found, try paru/yay for AUR packages
    if [[ -z "$desc" ]]; then
        desc=$(paru -Si "$pkg" 2>/dev/null | grep -E "^Description" | cut -d':' -f2- | sed 's/^[[:space:]]*//')
    fi
    
    if [[ -z "$desc" ]]; then
        desc=$(yay -Si "$pkg" 2>/dev/null | grep -E "^Description" | cut -d':' -f2- | sed 's/^[[:space:]]*//')
    fi
    
    if [[ -n "$desc" ]]; then
        echo "$pkg: $desc"
    else
        echo "$pkg: Description not found"
    fi
}

# If no argument provided, show usage
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 package-name [package-name2 ...]"
    echo "Example: $0 bottles lutris steam"
    exit 1
fi

# Process all provided package names
for pkg in "$@"; do
    get_description "$pkg"
done
