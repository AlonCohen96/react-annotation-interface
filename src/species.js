import {nanoid} from "nanoid";

const UNKNOWN_SPECIES = 'Unknown'
const UNKNOWN_INDIVIDUAL = 'Unknown'
const UNKNOWN_CLUSTERNAME = 'Unknown'
const DEFAULT_CLUSTERNAME_COLOR = '#36ff00'
const DEFAULT_UNKNOWN_CLUSTERNAME_COLOR = '#00EEFF'
const CLUSTERNAME_COLOR_ARRAY = [
    "#ff3333", // Tomato
    "#33FF57", // Light Green
    "#3357FF", // Blue
    "#FF33A1", // Pink
    "#FFB533", // Orange
    "#33FFF5", // Cyan
    "#8D33FF", // Purple
    "#F0FF33", // Yellow
    "#f3c455", // Beige
    "#33FFD7", // Aqua
    "#FF8C33", // Coral
    "#fff", // White
    "#33A1FF", // Sky Blue
    "#cc77c1", // Pale Pink
    "#114b6e", // Dark Blue
    "#B8E986", // Grasshoper
    "#33FF8C", // Spring Green
    "#8B572A", // Brown
    "#FA8072", // Salmon
    "#9B9B9B", // Gray
]
const INACTIVE_BUTTON_COLOR = '#626262'
const ANNOTATED_AREA = 'Annotated Area'
const ANNOTATED_AREA_INDIVIDUAL = '🔒'
const ANNOTATED_AREA_CLUSTERNAME = 'Annotated Area'
const ANNOTATED_AREA_COLOR = '#296c16'

class Species {
    constructor(id, name, individuals, clusternames, minFreq=null, maxFreq=null ) {
        this.id = id
        this.name = name
        this.individuals = individuals
        this.clusternames = clusternames
        this.minFreq = minFreq
        this.maxFreq = maxFreq
        this.showIndividualInputWindow = false
        this.showClusternameInputWindow = false
    }
}

class Individual {
    constructor(id, name) {
        this.id = id
        this.name = name
        this.isActive = true
    }
}

class Clustername {
    constructor(id, name, color=DEFAULT_CLUSTERNAME_COLOR) {
        this.id = id
        this.name = name
        this.isActive = true
        this.color = color
        this.showColorwheel = false
    }
}

const activateIndividual = (individuals, selectedIndividualName) => {
    return individuals.map( individual => {
        if (individual.name === selectedIndividualName){
            const activatedIndividual = new Individual(individual.id, individual.name)
            activatedIndividual.isActive = true
            return activatedIndividual
        } else {
            const deactivatedIndividual = new Individual(individual.id, individual.name)
            deactivatedIndividual.isActive = false
            return deactivatedIndividual
        }
    })
}

const activateClustername = (clusternames, selectedClusternameName) => {
    return clusternames.map( clustername => {
        if (clustername.name === selectedClusternameName){
            const activatedClustername = new Clustername (clustername.id, clustername.name, clustername.color)
            activatedClustername.isActive = true
            return activatedClustername
        } else {
            const deActivatedClustername = new Clustername (clustername.id, clustername.name, clustername.color)
            deActivatedClustername.isActive = false
            return deActivatedClustername
        }
    })
}

const deactivateExistingIndividuals = (individuals) => {
    return individuals.map(individual => {
        const deactivatedIndividual = new Individual(individual.id, individual.name)
        deactivatedIndividual.isActive = false
        return deactivatedIndividual
    })
}

const deactivateExistingClusternames = (clusternames) => {
    return clusternames.map(clustername => {
        const deactivatedClustername = new Clustername (clustername.id, clustername.name, clustername.color)
        deactivatedClustername.isActive = false
        return deactivatedClustername
    })
}

const checkIfEveryObjectIsInactive = (objects) => {
    return objects.every(object => !object.isActive)
}

const goToNextColor = (currentIndex) => {
    return currentIndex === CLUSTERNAME_COLOR_ARRAY.length -1 ? 0 : currentIndex + 1
}

const createSpeciesFromImportedLabels = (importedLabels, currentSpeciesArray) => {
    let updatedSpeciesArray = [...currentSpeciesArray]
    const allExistingSpeciesNames = currentSpeciesArray.map(speciesObj => speciesObj.name)
    let clusternameColorIndex = 0

    for (let label of importedLabels){

        for (let speciesObj of updatedSpeciesArray){

            // For Existing species, update Individuals and Clusternames
            if (speciesObj.name === label.species){
                const allIndividualNames = speciesObj.individuals.map(individual => individual.name)
                if ( !allIndividualNames.includes(label.individual) ){
                    const newIndividual = new Individual(nanoid(), label.individual)
                    newIndividual.isActive = false
                    speciesObj.individuals = [...speciesObj.individuals, newIndividual]
                }

                const allClusternamesNames = speciesObj.clusternames.map(clustername => clustername.name)
                if ( !allClusternamesNames.includes(label.clustername) ){
                    const newClustername = new Clustername(nanoid(), label.clustername, CLUSTERNAME_COLOR_ARRAY[clusternameColorIndex])
                    newClustername.isActive = false
                    speciesObj.clusternames = [...speciesObj.clusternames, newClustername]
                    clusternameColorIndex = goToNextColor(clusternameColorIndex)
                }
            }
        }

        // If imported species does not exist already, create a new one
        if (!allExistingSpeciesNames.includes(label.species)){

            const newIndividualsArray = []
            // Create Unknown Individual
            const newUnknownIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL, 0)
            newUnknownIndividual.isActive = false
            newIndividualsArray.unshift(newUnknownIndividual)

            // If that label's individual is not Unknown, create that individual for this species
            if (label.individual !== UNKNOWN_INDIVIDUAL){
                const newIndividual = new Individual(nanoid(), label.individual)
                newIndividual.isActive = false
                newIndividualsArray.push(newIndividual)
            }


            const newClusternamesArray = []
            // Create Unknown Clustername
            const newUnknownClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
            newUnknownClustername.isActive = false
            newClusternamesArray.push(newUnknownClustername)

            // If that label's clustername is not Unknown, create that clustername for this species
            if (label.clustername !== UNKNOWN_CLUSTERNAME) {
                const newClustername = new Clustername(nanoid(), label.clustername, CLUSTERNAME_COLOR_ARRAY[clusternameColorIndex])
                newClustername.isActive = false
                newClusternamesArray.push(newClustername)
                clusternameColorIndex = goToNextColor(clusternameColorIndex)
            }

            const newSpecies = new Species(
                nanoid(),
                label.species,
                newIndividualsArray,
                newClusternamesArray,
            )

            const insertionIndex = updatedSpeciesArray.length - 1
            allExistingSpeciesNames.splice(insertionIndex,0,label.species)
            updatedSpeciesArray.splice(insertionIndex,0,newSpecies)
        }
    }

    return updatedSpeciesArray
}

const dummyData = {
    "response": [
        {
            "url": "https://www2.iis.fraunhofer.de/AAC/ChID-BLITS-EBU-Narration441-16b.wav",
            "id": "64bec7e26642cadf5dc0eb01",
            "filename": "6 channel test.wav",
            "annotation_instance": "XC785219_fd453602-a4a9-4f57-95f2-fd9084e9a161",
            "time": "2024-03-27 20:01:43",
            "hop_length": 500,
            "num_spec_columns": 900,
            "sampling_rate": 44200,
            "nfft": 40,
            "f_high": 8000,
            "f_low": 6000,
            "spec_cal_method": "constant-q",
            "labels": {
                "channels": {
                    "0": [
                        {
                            "onset": 1.2,
                            "offset": 1.7,
                            "species": "Unknown",
                            "individual": "Unknown",
                            "clustername": "Unknown"
                        },
                        {
                            "onset": 2.4,
                            "offset": 2.6,
                            "species": "Unknown",
                            "individual": "Ind4",
                            "clustername": "call 3"
                        }
                    ],
                    "1": [
                        {
                            "onset": 1.5,
                            "offset": 1.8,
                            "species": "Unknown",
                            "individual": "Unknown",
                            "clustername": "Unknown"
                        },
                        {
                            "onset": 2.7,
                            "offset": 2.9,
                            "species": "Unknown",
                            "individual": "Ind4",
                            "clustername": "call 3"
                        }
                    ],
                    "2": [
                        {
                            "onset": 1.9,
                            "offset": 2,
                            "species": "Unknown",
                            "individual": "Unknown",
                            "clustername": "Unknown"
                        },
                        {
                            "onset": 3,
                            "offset": 3.2,
                            "species": "Unknown",
                            "individual": "Ind4",
                            "clustername": "call 3"
                        }
                    ]
                }
            }
        },
        {
            "url": "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
            "id": "64bec7e26642cadf5dc0eb01",
            "filename": "BabyElephantWalk60.wav",
            "annotation_instance": "XC785219_fd453602-a4a9-4f57-95f2-fd9084e9a161",
            "time": "2024-03-27 20:01:43",
            "hop_length": 900,
            "nfft": 500,
            "f_high": 8000,
            "f_low": 0,
            "spec_cal_method": "log-mel",
            "labels": {
                "channels": {
                    "0": [
                        {
                            "onset": 1.2,
                            "offset": 1.7,
                            "species": "Unknown",
                            "individual": "Unknown",
                            "clustername": "Unknown"
                        },
                        {
                            "onset": 2.4,
                            "offset": 2.6,
                            "species": "Unknown",
                            "individual": "Ind4",
                            "clustername": "call 3"
                        },
                        {
                            "onset": 4.4,
                            "offset": 4.9,
                            "species": "Hamster",
                            "individual": "Bobby",
                            "clustername": "i am hungry"
                        }
                    ]
                }
            }
        },
    ]
}

export {
    UNKNOWN_SPECIES,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_CLUSTERNAME,
    DEFAULT_CLUSTERNAME_COLOR,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    INACTIVE_BUTTON_COLOR,
    ANNOTATED_AREA,
    ANNOTATED_AREA_INDIVIDUAL,
    ANNOTATED_AREA_CLUSTERNAME,
    ANNOTATED_AREA_COLOR,
    Species,
    Individual,
    Clustername,
    activateIndividual,
    activateClustername,
    deactivateExistingIndividuals,
    deactivateExistingClusternames,
    checkIfEveryObjectIsInactive,
    createSpeciesFromImportedLabels,
    dummyData
}