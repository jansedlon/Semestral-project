# Installation
To run only the web version

`npm install`

To run the desktop version

If you don't already have Rust installed `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`


# Running the app
## Web version
`npm run dev`

Then go to [http://localhost:3000](http://localhost:3000)

## Desktop version
These two commands need to run simultaneously in two seperated terminal instances. Tauri uses it's own WebView that displays whatever the Javascript server returns.
Tauri is still in beta. Bugs and unexpected behaviour is expected. 

`npm run dev`

`npm run tauri dev`

