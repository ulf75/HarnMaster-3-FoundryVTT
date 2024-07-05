# Howto Create the Compendium Files

The compendium source files are located in the `/packs` directory. If you make any changes to them, the database files must be recreated.

Information about this can be found here `https://foundryvtt.com/article/v11-leveldb-packs/` and here `https://github.com/foundryvtt/foundryvtt-cli`.

## Step 1: Install CLI

This you only need to do once:

1. `npm install -g @foundryvtt/foundryvtt-cli`
2. `fvtt configure set installPath "C:\Program Files\Foundry Virtual Tabletop"`
3. `fvtt configure set dataPath "C:\Users\{name}\AppData\Local\FoundryVTT"`
4. `fvtt configure`

## Step 2: Create Packages

### Step 2a: Set `hm3` System

`fvtt package workon "hm3" --type "System"`

### Step 2b: Create the Single Packages

-   `fvtt package pack -c -v -r "character"`
-   `fvtt package pack -c -v -r "esoteric"`
-   `fvtt package pack -c -v -r "possessions"`
-   `fvtt package pack -c -v -r "system-help"`

For more help check: `fvtt package pack --help`
