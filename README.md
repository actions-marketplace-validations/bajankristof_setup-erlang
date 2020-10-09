# GitHub Action - Setup Erlang/OTP

![Test](https://github.com/bajankristof/setup-erlang/workflows/Test/badge.svg?branch=master)

This sets up an Erlang/OTP environment along with rebar3 for use in actions and should work in all 3 (ubuntu, macos, windows) virtual environments.

- On ubuntu it adds the erlang-solutions debian repository to the system and installs the latest available version of the specified major version.
- On macos it uses homebrew to download and install the latest available version of the specified major version.
- On windows it downloads the latest available installer for the specified major version and installs it on the system and in the PATH.

_(rebar3 will always be installed with the latest available version.)_

_(The action is tested in a workflow using Erlang/OTP 22, 23 on all operating systems [ubuntu-latest, macos-latest, windows-latest] with content caching both on and off.)_

## Inputs

- **otp-version** (required) - The **major** Erlang/OTP version to install (eg.: 23).
- **allow-cache** - Whether to cache downloaded content between runs (currently only affects actions running on windows). Default `true`.

**IMPORTANT**: Content caching is optional but **it uses the repository cache which is limited at the moment (check out [@actions/cache](https://github.com/actions/toolkit/tree/main/packages/cache))!** Caching between runs currently only affects windows and it improves execution time by ~ 2 mins.

## Examples

@context
```yml
on:
  push:
    branches: [ master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: bajankristof/setup-erlang@master
    - uses: actions/checkout@v2
    - run: rebar3 eunit
```
