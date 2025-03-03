let
  pkgs = import <nixpkgs> {};
in
  pkgs.mkShell {
    nativeBuildInputs = with pkgs; [
      pkg-config
      cargo
      cargo-tauri
      rustc
      nodejs
      pnpm
    ];

    buildInputs = with pkgs; [
      openssl
      glib
      pango
      libsoup_3
      gdk-pixbuf
      atk
      webkitgtk_4_1
    ];
  }
