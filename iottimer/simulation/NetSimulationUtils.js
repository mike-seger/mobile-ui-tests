function loadSimulatedSettings() {
    return JSON.parse(localStorage.getItem('simulatedSettings') || "{}")
}

function saveSimulatedSettings(simulatedSettings) {
    localStorage.setItem('simulatedSettings', JSON.stringify(simulatedSettings))
}

const simulatedResponseTimeMs = 3

async function simulatedGetSettings(type) {
    try {
        await delay(simulatedResponseTimeMs)
        const simulatedSettingsEntry = loadSimulatedSettings()[type]
        if(simulatedSettingsEntry) {
            console.log("GET (simulated/modified) "+Type.getName(type), simulatedSettingsEntry)
            return simulatedSettingsEntry
        }
        const response = await fetch("simulation/json/"+type+".json")
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const jsonData = await response.json()
        return jsonData
    } catch (error) {
        console.error("Error during HTTP GET request:", error)
        throw error
    }
}

async function simulatedPostSettings(type, data) {
    await delay(simulatedResponseTimeMs)
    const dataClone = JSON.parse(JSON.stringify(data))
    dataClone.type = type
    console.log("POST (simulated) "+Type.getName(type), dataClone)
    const simulatedSettings = loadSimulatedSettings()
    simulatedSettings[type] = data
    saveSimulatedSettings(simulatedSettings)
    return { "status": 0, "msg": "succ" }
}
