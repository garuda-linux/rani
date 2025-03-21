# Changelog

All notable changes to this project will be documented in this file.

## [2.3.0] - 2025-03-21

### 🚀 Features

- _(packages)_ Use searchable table instead for display
- _(system-tools)_ Only load components when tab has been selected
- _(kernels)_ Add kernels component
- _(kernels)_ Add dkms module check and loading indicator
- _(gaming)_ Add more WINE versions
- _(language-packs)_ New component
- _(settings)_ Move to dedicated page
- _(maintenance)_ Allow merging pacdiff files interactively
- _(system-status)_ Warn about pending reboot
- _(system-settings)_ Add bpftune

### 🐛 Bug Fixes

- _(system-components)_ Scanning-support never being enabled
- _(os-interact)_ Check for systemd sockets as well, fixing non-recognized sockets
- _(pnpm-lock.yaml)_ Sync with package.json
- _(config-service)_ Apply Loglevel on settings change
- _(notifications)_ Unbreak not-sending notifications

### 🚜 Refactor

- Massively improve performance by caching and using services
- Use pacman regex for prefiltering, print commands used

### ⚙️ Miscellaneous Tasks

- Drop ununsed code

## [2.2.0] - 2025-03-18

### 🚀 Features

- _(system-settings)_ Add packages section
- _(translation)_ Use inbuilt Tauri resources to load translations
- Version 2.2.0

### 🐛 Bug Fixes

- _(system-components)_ Virtualbox checking for group rather than pkg
- _(packages)_ Invalid pkgnames, fixed parser as well
- _(language)_ Only update language once on startup
- _(translations)_ Safeguard for failing to load translation files

## [2.1.0] - 2025-03-18

### 🚀 Features

- _(garuda-update)_ Set GARUDA_UPDATE_RANI=1 to notify garuda-update of usage via rani

### 🐛 Bug Fixes

- _(vmware,virtualbox)_ Disable DMABUF renderer
- _(lib.rs)_ Attempt fixing detection by making strings lowercase
- _(dynamic-checkboxes)_ Allow disabled entries to be properly managed.

### 📚 Documentation

- _(changelog)_ Add changelog

### ⚙️ Miscellaneous Tasks

- _(flake.lock)_ Update

## [2.0.0] - 2025-03-17

### 🚀 Features

- _(window)_ Responsive window button states
- _(loadingservice)_ Use refcount on loading indicator
- _(font)_ Use system-ui
- _(init)_ Resize window to reasonable size when monitor is too small
- Move parseArchWiki script to Typescript
- _(system-status)_ Report AUR updates too
- _(system-status)_ Support schedule AUR updates, update on task updates
- Strip AUR functionality, we decided to not support it
- _(system-components)_ Expand with containers section
- Menu bar "terminal" button glows actively when tasks are pending
- _(terminal)_ Only show buttons when needed/reasonable

### 🐛 Bug Fixes

- _(os-interact)_ Fix setting dns to default
- _(diagnostics)_ Disable logging symbol after loading full diagnostics
- _(system-status)_ Invalid update versions
- _(angular)_ Zoneless change detection complaining
- _(gamer)_ Some icons being improperly sized
- _(gaming)_ Missing pacakges, add script to check for missing ones
- _(theme)_ Light theme not working, wrong window buttons on the right
- _(window)_ Set reasonable menu breakpoint, set logicalSize dynamically
- _(dynamic-checkboxes)_ Ensure already enabled/installed packages are not disabled
- Duplicated updates, duplicated logic
- _(systemd-services)_ Event reporting failure due to no output
- Menu bar "terminal" button size changing when glow effect is active

### 🎨 Styling

- Declare types as types

### ⚙️ Miscellaneous Tasks

- Cleanup unused
- Add package list check
- Also check AUR packages
- Fix missing pnpm, less verbose script

## [1.3.1] - 2025-03-12

### 🐛 Bug Fixes

- Set WEBKIT_DISABLE_COMPOSITING_MODE for NVIDIA GPUs

## [1.3.0] - 2025-03-06

### 🐛 Bug Fixes

- _(package.json,cargo.toml)_ Cleanup required packages
- _(translation)_ Load translations before the application loads
- _(home)_ Utilize launch-terminal garuda-libs script for chroot

## [1.2.0] - 2025-03-05

### 🚀 Features

- Allow confirmation-less app exit when there are no pending tasks.
- _(operation-manager)_ Do not store/restore pending operations when exiting app
- _(logs)_ Allow setting loglevel

### 🐛 Bug Fixes

- _(shell.nix)_ Fix nix build env
- _(style)_ Disable any kind of text selection
- _(diagnostics)_ Do not use garuda-inxi funstuff
- _(config,home)_ Fix excessive redraws, live system detection, angular change detection
- More efficient file existence checks via plugin-fs
- _(status)_ Logs reporting update check failure when none are availble
- _(theme-handler)_ Use updateConfig method to set new setting
- _(xterm)_ Use computed signal to prevent wrong theme

### 🚜 Refactor

- _(first-boot)_ Revamp first boot checks
- _(darkmode)_ Redo darkmode to be more consistent
- _(language-switcher)_ Redo language-switcher to be more consistent
- _(app)_ Pre-init config before rendering application
- _(app)_ More reliable menu/label setup, more reliable transloco

## [1.1.0] - 2025-03-02

### 🚀 Features

- Run setup-assistant on first boot, relaunch after update
- _(gaming)_ Import new icons from gamer, placeholders update

## [1.0.2] - 2025-03-02

### 🚀 Features

- _(welcome)_ Don't show status on live system

### 🐛 Bug Fixes

- No max size, inform about errors, calamares not starting

## [1.0.1] - 2025-03-02

### 🐛 Bug Fixes

- User set to null, loglevel to info, skip mirrorlist by default

## [1.0.0] - 2025-03-02

### 🚀 Features

- Safeguards app shutdown/remove action, only safe undone
- _(operations)_ Allow aborting running, and running directly
- _(system-status)_ Warn on >2w no update
- Add autostart config, remove problematic vboxkvm

### 🐛 Bug Fixes

- _(nvidia)_ Attempt disabling dmabuf renderer
- _(gaming)_ Invalid parsed entries
- _(operation-manager)_ Passed signal instead of value
- _(diagnostics)_ Make buttons not rounded, comply with rest of app

### ⚙️ Miscellaneous Tasks

- Extend Arch wiki list parsing

## [0.2.0] - 2025-03-01

### 🚀 Features

- _(privilege-manager)_ Keep one-time use creds between a run of multiple
- Make settings menu entries dynamic, use fontawesome icons
- Improve visuals on home and other places
- Set reasonable min window size, report progress, misc fixes
- _(gaming)_ Derive list of games from AUR, check whether available
- _(operations)_ Sort pending list after order, cleanup subscriptions
- Use cdr onpush for better performance, support installing AUR games
- Support reporting pacdiff/update status on home, allow ensuring package is installed

### 🐛 Bug Fixes

- Save state on shutdown
- _(system-settings)_ Toggling hblock now works as expected
- Singleton ConfigService, shell not initializing
- _(privilege-manager)_ Handle aborted input gracefully
- _(checkboxes)_ Fix unexpected toggle behaviour
- _(diagnostics)_ Page not loading due to privatebinclient constructor missing
- _(deps)_ Add missing dep, remove obsolete
- _(window)_ Add missing permission
- Hblock enable action, don't try translating game titles
- Use better icons for status

### 🚜 Refactor

- _(configService)_ Move user determination to configService
- _(configService)_ Source darkMode from configService

### 📚 Documentation

- Add deps, run funstuff

### ⚙️ Miscellaneous Tasks

- Add linting
- _(types)_ Declare a handful interfaces as types
- Version 0.2.0

## [0.1.1] - 2025-02-27

### 🚀 Features

- _(terminal)_ Use WebGlAddon

### 🐛 Bug Fixes

- _(gamer)_ No more broken icons
- _(privilege-manager)_ Don't dump password into logs

## [0.1.0] - 2025-02-27

### 🚀 Features

- _(logger)_ Introduce custom logger class for loglevels
- _(translations)_ Add trashy auto-translated languages
- _(shortcuts)_ Prevent default browser shortcuts in prod

### 🐛 Bug Fixes

- _(translations)_ Disable script optimisations in prod mode

### ⚙️ Miscellaneous Tasks

- Version 0.1.0

## [0.0.1] - 2025-02-27

### 🚀 Features

- Initial commit
- _(gamer)_ Finished queue logic, much more entries
- Systemd services actions/comp, reset configs, many improvements
- Integrate btrfs-assistant and apps in need of sudo
- Correct icons, provide some services globally
- Fake window buttons
- Start porting sys components, misc improvements
- A boat load of improvements, too many to specify
- Saving progress, loading indicator, tons of improvements
- Heavy refactoring to make use of privilege/operation services, add loading indicator
- Make more use of loadingService, diagnostics refactor
- Tabbed maintenance, skip done, support live/installed actions in welcome, theme fixes
- Adjust package name, reformat

### 🐛 Bug Fixes

- _(privilege-manager)_ Wrong authenticated status
- Operation management, show disabled services
- Direct run should open terminal
- Await store being ready, make initial window higher, readme link

### 🚜 Refactor

- Migrate to configService

### 📚 Documentation

- _(readme)_ Add

### ⚙️ Miscellaneous Tasks

- Drop some unused code, update cargo deps
- Cleanup unused code
- Add some ci
- Use non-alpine container, add missing libsoup
- Update mirrorlist before installation
- Limit to bundle directories
- Add the regular checks, try bullseye
- Flake.nix setup
- Add .desktop file
- Only upload the needed files

<!-- generated by git-cliff -->
