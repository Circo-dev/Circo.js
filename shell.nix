{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.htop
    pkgs.git
    pkgs.nodejs
  ];

  shellHook = ''
    echo "Circo.js dev environment" 
  '';
}
