# now
Node on Web.

Use Nodejs freely in your browser with Linux infrastructure.

## Status
This project is not very stable. The project uses the alpine linux emulator: https://bellard.org/jslinux/ it takes about ~14 seconds to start the node.

I can get it down to ~10 seconds with a custom linux version in copy/v86, but I can't release it completely because of project issues.

https://github.com/ktock/container2wasm another alternative, but it has a performance problem for about ~16 seconds.

Obviously I am looking for alternatives for performance reasons.

> :warning: The project is currently in the update phase. This version will not be used in next commit.

## Preview

> :warning: About 70 MB will be downloaded. This process may take longer depending on your internet connection.

You can test the version of the library deployed with GitHub Pages here: https://cemalgnlts.github.io/now.

## Features

* It works **completely offline**.
* Play **Node v14.3.0** in your browser.
* Alpine **Linux** environment.

## Problems

* Node project takes a long time to run.
* The Linux build was not built specifically for this project, so there are unnecessary files.
* The project was written with esnext, the build process was not completed to translate the library.

This project works with https://bellard.org/tinyemu - https://bellard.org/jslinux/.
