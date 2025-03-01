const Type = (() => {
    const forward = {
        network: 2,
        dst: 3,
        display: 4,
        info: 10,
        brightness: 13,
        restart: 21
    }

    // Create the reverse mapping dynamically
    const reverse = Object.fromEntries(
        Object.entries(forward).map(([key, value]) => [value, key])
    )

    return {
        ...forward,
        reverse,
        getName(value) {
            return this.reverse[value] || "unknown"
        }
    }
})()

let clockAddress = (localStorage.getItem('clock-address') || "").trim()
let simulationMode = false

async function isSimulationMode() {
    if(simulationMode && simulationMode!==undefined) return true
    let result = false
    try {
        const response = await fetch("get?type=" + Type.display)
        result = response.status === 404
    } catch (error) { console.error("Fetch error:", error) }
    simulationMode = result
    console.log("Simulation mode: "+simulationMode)
    return simulationMode
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSettings(type) {
    try {
        let url = "get?type=" + type
        if(isSimulationMode()) {
            if(clockAddress?.trim() === "") return simulatedGetSettings(type)
            url = `http://${clockAddress}/${url}`
        }
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const jsonData = await response.json()
        return jsonData
    } catch (error) {
        console.error("Error during HTTP GET request:", error)
        throw error
    }
}

async function postSettings(type, data) {
    try {
        let url = "set"
        if(isSimulationMode()) {
            if(clockAddress?.trim() === "") return simulatedPostSettings(type, data)
            url = `http://${clockAddress}/${url}`
        }
        const dataClone = JSON.parse(JSON.stringify(data))
        dataClone.type = type
        console.log("POST "+Type.getName(type), dataClone)
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataClone)
        })

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error(`Error during HTTP POST request with type ${type}:`, error)
        throw error
    }
}

async function loadSettings(type) {
    const result = await getSettings(type)
    console.log("Result from GET "+Type.getName(type), result)
    const completedResult = await result
    return completedResult
}

async function updateSettings(type, settingsSelection) {
    let settings = await settingsSelection

    // special workarounds
    function renameAttributes(obj, keyMap) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) =>
                [keyMap[key] || key, value]
            )
        )
    }
    if(type === Type.brightness) { settings.lightMode = 0 }
    else if(type === Type.dst) {
        const keyMap = { timezone: "zone", timezone2: "zone2" };
        settings = renameAttributes(settings, keyMap)
    }
    // end of workarounds

    const result = await postSettings(type, settings)
    console.log("Result from POST "+Type.getName(type), settings, result)
    return result
}
