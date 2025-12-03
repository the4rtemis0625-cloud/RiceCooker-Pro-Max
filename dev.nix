
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  # The build inputs (development dependencies) for the shell
  buildInputs = with pkgs; [
    # Use a specific version of Node.js for consistency
    nodejs-20_x
    
    # You might also want to include yarn or pnpm if your project uses them
    # yarn
    # pnpm
  ];

  # You can set environment variables for the shell here
  # shellHook = ''
  #   export MY_ENV_VAR="some_value"
  # '';
}
