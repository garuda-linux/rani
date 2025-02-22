export const BIGGEST_PKGS =
  "LC_ALL=C.UTF-8 pacman -Qi | awk '/^Name/{name=$3} /^Installed Size/{print $4$5, name}' | LC_ALL=C.UTF-8 sort -h";
