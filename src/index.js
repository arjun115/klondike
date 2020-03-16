import EntryPoint from "./entryPoint"

class App {

    constructor() {
        window.onload = this.onLoad()
    }

    onLoad() {
        new EntryPoint(this._getDevelopmentOptions())
    }

    _getDevelopmentOptions() {
        return {
            onHowTo: () => {
                console.log('open how to')
            },
            openGame: (mode) => {
                console.log('open game', mode)
            }
        }
    }
}

new App