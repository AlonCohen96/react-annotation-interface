import React, {useState} from "react";
import { nanoid } from 'nanoid'

class Species {
    constructor(id, name, individuals, clusternames, isActive=false) {
        this.id = id
        this.name = name
        this.individuals = individuals
        this.clusternames = clusternames
        this.isActive = isActive
    }
}

class Individual {
    constructor(name) {
        this.name = name
        this.isActive = true
    }
}

class Clustername {
    constructor(name) {
        this.name = name
        this.isActive = true
    }
}

// Global variables
const UNKNOWN_SPECIES = 'Unknown Species'
const UNKNOWN_INDIVIDUAL = 'Unknown'
const UNKNOWN_CLUSTERNAME = 'Unknown'

function AnnotationLabels () {

    const [newSpeciesInputFieldText, setNewSpeciesInputFieldText] = useState('')
    const [newIndividualInputFieldTexts, setNewIndividualInputFieldTexts] = useState([])
    const [newClusternameInputFieldTexts, setNewClusternameInputFieldTexts] = useState([])

    const [speciesArray, setSpeciesArray] = useState([
        new Species(nanoid(),UNKNOWN_SPECIES, [ new Individual(UNKNOWN_INDIVIDUAL) ], [ new Clustername(UNKNOWN_CLUSTERNAME)], true )
    ])


    /* ++++++++++++++++++++ Species ++++++++++++++++++++ */

    const addNewSpecies = (event) => {
        event.preventDefault()

        setNewSpeciesInputFieldText('')

        const allSpeciesNames = speciesArray.map( speciesObject => speciesObject.name )
        if (checkIfObjectNameAlreadyExists(newSpeciesInputFieldText, allSpeciesNames)){
            alert(`${newSpeciesInputFieldText} already exists. Add a different one.`)
            return
        }

        const newSpeciesObject = new Species(nanoid(), newSpeciesInputFieldText,[ new Individual(UNKNOWN_INDIVIDUAL) ], [ new Clustername(UNKNOWN_CLUSTERNAME) ])
        setSpeciesArray( prevState => [...prevState, newSpeciesObject] )
    }

    const deleteSpecies = (selectedID) => {
        const modifiedSpeciesArray = speciesArray.filter(speciesObject => speciesObject.id !== selectedID)
        setSpeciesArray(modifiedSpeciesArray)
    }


    /* ++++++++++++++++++++ Individuals ++++++++++++++++++++ */
    const addNewIndividual = (event, selectedID, index) => {
        event.preventDefault()

        const newIndividualName = newIndividualInputFieldTexts[index]

        // Update the correct input field
        const updatedIndividualInputFieldTexts = [...newIndividualInputFieldTexts]
        updatedIndividualInputFieldTexts[index] = ''
        setNewIndividualInputFieldTexts(updatedIndividualInputFieldTexts)

        // Update species Array
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate "Unknown" Clustername, only if all other clusternames are inactive (this happens when the user switches species)
                const updatedClusternames = checkIfEveryObjectIsInactive(speciesObject.clusternames) ? activateClustername(speciesObject.clusternames, UNKNOWN_CLUSTERNAME) : speciesObject.clusternames

                // If individual already exists, activate that one and alert the user
                const allIndividualNames = speciesObject.individuals.map( individual => individual.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(newIndividualName, allIndividualNames)
                if ( alreadyExistingObjectName ) {
                    const updatedIndividuals = activateClustername(speciesObject.individuals, alreadyExistingObjectName)
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)
                    return {
                        ...speciesObject,
                        individuals: [...updatedIndividuals],
                        clusternames: [...updatedClusternames]
                    }
                }

                // Deactivate existing individuals of the current species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)

                return {
                    ...speciesObject,
                    individuals: [...updatedIndividuals, new Individual(newIndividualName)],
                    clusternames: [...updatedClusternames]
                }
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return {
                    ...speciesObject,
                    individuals: [...updatedIndividuals],
                    clusternames: [...updatedClusternames]
                }
            }
        })
        setSpeciesArray(modifiedSpeciesArray)
    }

    const handleIndividualInputChange = (event, index) => {
        const updatedIndividualInputFieldTexts = [...newIndividualInputFieldTexts]
        updatedIndividualInputFieldTexts[index] = event.target.value
        setNewIndividualInputFieldTexts(updatedIndividualInputFieldTexts)
    }

    const deleteIndividual = (event, selectedID, selectedIndividual) => {
        event.preventDefault()

        if (selectedIndividual.name === UNKNOWN_INDIVIDUAL) return

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                const updatedIndividuals = speciesObject.individuals.filter( individual => individual !== selectedIndividual)
                return {
                    ...speciesObject,
                    individuals: updatedIndividuals
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const editIndividual = (selectedID, selectedIndividual) => {
        let editedIndividual = prompt('Change individual: ')
        if (!editedIndividual) return

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allIndividualNames = speciesObject.individuals.map( individual => individual.name)
                if ( checkIfObjectNameAlreadyExists(editedIndividual, allIndividualNames) ) {
                    return speciesObject
                }

                const updatedIndividuals = speciesObject.individuals.map( individual => {
                    return individual.name === selectedIndividual.name ? {...individual, name: editedIndividual} : individual
                })

                return {
                    ...speciesObject,
                    individuals: updatedIndividuals
                }

            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const activateIndividual = (selectedID, selectedIndividual) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                const updatedIndividuals = speciesObject.individuals.map( individual => {
                    if (individual === selectedIndividual){
                        return {...individual, isActive: true}
                    } else {
                        return {...individual, isActive: false}
                    }
                })
                return {
                    ...speciesObject,
                    individuals: updatedIndividuals
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    
    const activateUnknownIndividual = (individuals) => {
        return individuals.map( individual => {
            if (individual.name === UNKNOWN_INDIVIDUAL){
                return {...individual, isActive: true}
            } else {
                return {...individual, isActive: false}
            }
        })
    }

    const deactivateExistingIndividuals = (individuals) => {
        return individuals.map(individual => ({
            ...individual,
            isActive: false
        }))
    }


    /* ++++++++++++++++++++ Clusternames ++++++++++++++++++++ */

    const addNewClustername = (event, selectedID, index) => {
        event.preventDefault()

        const newClusternameName = newClusternameInputFieldTexts[index]

        // Update the correct input field
        const updatedClusternameInputFieldTexts = [...newClusternameInputFieldTexts]
        updatedClusternameInputFieldTexts[index] = ''
        setNewClusternameInputFieldTexts(updatedClusternameInputFieldTexts)

        // Update species Array
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate "Unknown" Individual, only if all other Individuals are inactive (this happens when the user switches species)
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObject.individuals) ? activateUnknownIndividual(speciesObject.individuals) : speciesObject.individuals

                // If clustername already exists, activate that one and alert the user
                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(newClusternameName, allClusternameNames)
                if ( alreadyExistingObjectName ) {
                    const updatedClusternames = activateClustername(speciesObject.clusternames, alreadyExistingObjectName)
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)
                    return {
                        ...speciesObject,
                        individuals: [...updatedIndividuals],
                        clusternames: [...updatedClusternames]
                    }
                }

                // Deactivate existing clusternames of the current species
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

                return {
                    ...speciesObject,
                    individuals: [...updatedIndividuals],
                    clusternames: [...updatedClusternames, new Clustername(newClusternameName)]
                }
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return {
                    ...speciesObject,
                    individuals: [...updatedIndividuals],
                    clusternames: [...updatedClusternames]
                }
            }
        })
        setSpeciesArray(modifiedSpeciesArray)
    }

    const handleClusternameInputChange = (event, index) => {
        const updatedClusternameInputFieldTexts = [...newClusternameInputFieldTexts]
        updatedClusternameInputFieldTexts[index] = event.target.value
        setNewClusternameInputFieldTexts(updatedClusternameInputFieldTexts)
    }

    const deleteClustername = (event, selectedID, selectedClustername) => {
        event.preventDefault()

        if (selectedClustername.name === UNKNOWN_CLUSTERNAME) return

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Delete selected clustername
                let updatedClusternames = speciesObject.clusternames.filter( clustername => clustername !== selectedClustername)
                // If the deleted clustername was the active one, activate "Unknown Clustername"
                updatedClusternames = checkIfEveryObjectIsInactive(updatedClusternames) && !checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateClustername(updatedClusternames, UNKNOWN_CLUSTERNAME)
                    : updatedClusternames
                return {
                    ...speciesObject,
                    clusternames: updatedClusternames
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const editClustername = (selectedID, selectedClustername) => {
        let editedClustername = prompt('Change clustername: ')
        if (!editedClustername) return

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(editedClustername, allClusternameNames)
                if ( alreadyExistingObjectName) {
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)
                    return speciesObject
                }

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    return clustername.name === selectedClustername.name ? {...clustername, name: editedClustername} : clustername
                })

                return {
                    ...speciesObject,
                    clusternames: updatedClusternames
                }

            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const activateClustername = (clusternames, selectedClusternameName) => {
        return clusternames.map( clustername => {
            if (clustername.name === selectedClusternameName){
                return {...clustername, isActive: true}
            } else {
                return {...clustername, isActive: false}
            }
        })
    }

    const handleClickClustername = (selectedID, selectedClustername) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate selected clustername, deactivate all others
                const updatedClusternames = activateClustername(speciesObject.clusternames, selectedClustername.name)

                // Activate Unknown Individual, only if all other Individuals are inactive (this happens when the user switches species)
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObject.individuals) ? activateUnknownIndividual(speciesObject.individuals) : speciesObject.individuals

                return {
                    ...speciesObject,
                    individuals: updatedIndividuals,
                    clusternames: updatedClusternames
                }
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return {
                    ...speciesObject,
                    individuals: [...updatedIndividuals],
                    clusternames: [...updatedClusternames]
                }
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const activateUnknownClustername = (clusternames) => {
        return clusternames.map( clustername => {
            if (clustername.name === UNKNOWN_CLUSTERNAME){
                return {...clustername, isActive: true}
            } else {
                return {...clustername, isActive: false}
            }
        })
    }

    const deactivateExistingClusternames = (clusternames) => {
        return clusternames.map(clustername => ({
            ...clustername,
            isActive: false
        }))
    }


    /* ++++++++++++++++++++ Helper methods ++++++++++++++++++++ */

    const checkIfObjectNameAlreadyExists = ( newObjectName, array ) => {
        for (let objectName of array){
            if (objectName === newObjectName){
                return objectName
            }
        }
    }

    const checkIfEveryObjectIsInactive = (objects) => {
        return objects.every(object => !object.isActive)
    }


    return(
        <div id='annotation-labels-container'>

            <div id='annotation-labels-menu'>

                {
                    speciesArray.map( (species, index) =>
                        <div
                            id={species.id}
                            key={species.id}
                            className='species'
                            isactive={species.isActive.toString()}
                        >
                            {species.name}
                            {species.name !== UNKNOWN_SPECIES && <button className='delete-species-btn' onClick={() => deleteSpecies(species.id)}>🗑️</button>}

                            <div className='individual-btn-container'>
                                Individuals:
                                {
                                    species.individuals.map( individual =>
                                        <div
                                            key={`${species.id}-${individual.name}`}
                                            className='individual-btn'
                                            isactive={individual.isActive.toString()}>
                                            <div
                                                className='individual-btn-name'
                                                onClick={ () => activateIndividual(species.id, individual) }
                                                onContextMenu={ (event) => deleteIndividual(event, species.id, individual)}
                                            >
                                                {individual.name}
                                            </div>
                                            {
                                                individual.name !== UNKNOWN_INDIVIDUAL &&
                                                <button
                                                className='edit-name-btn'
                                                onClick={ () => editIndividual(species.id, individual) }
                                                onContextMenu={ (event) => event.preventDefault() }
                                                >
                                                ✏️
                                                </button>
                                            }
                                        </div>
                                    )
                                }
                                <form className='individual-form' onSubmit={ (event) => addNewIndividual(event,species.id, index) }>
                                    <input
                                        className='individual-input-field'
                                        type='text'
                                        required='required'
                                        pattern='^[^,]{1,30}$'
                                        title='No commas allowed. Max length 30 characters'
                                        value={newIndividualInputFieldTexts[index] || ''}
                                        placeholder='Add a new Individual'
                                        onChange={ (event) => handleIndividualInputChange(event, index) }
                                    />
                                    <button className='add-individual-btn'>➕</button>
                                </form>
                            </div>

                            <div className='clustername-btn-container'>
                                Clusternames:
                                {
                                    species.clusternames.map( clustername =>
                                        <div
                                            key={`${species.id}-${clustername.name}`}
                                            className='clustername-btn'
                                            isactive={clustername.isActive.toString()}
                                        >
                                            <div
                                                className='clustername-btn-name'
                                                onClick={ () => handleClickClustername(species.id, clustername) }
                                                onContextMenu={ (event) => deleteClustername(event, species.id, clustername)}
                                            >
                                                {clustername.name}
                                            </div>
                                            <button
                                                className='colorwheel-btn'
                                                onContextMenu={ (event) => event.preventDefault() }
                                            >
                                                🎨️
                                            </button>
                                            {
                                                clustername.name !== UNKNOWN_CLUSTERNAME &&
                                                <button
                                                    className='edit-name-btn'
                                                    onClick={ () => editClustername(species.id, clustername) }
                                                    onContextMenu={ (event) => event.preventDefault() }
                                                >
                                                    ✏️
                                                </button>
                                            }
                                        </div>
                                    )
                                }
                                <form className='clustername-form' onSubmit={ (event) => addNewClustername(event,species.id, index) }>
                                    <input
                                        className='clustername-input-field'
                                        type='text'
                                        required='required'
                                        pattern='^[^,]{1,30}$'
                                        title='No commas allowed. Max length 30 characters'
                                        value={newClusternameInputFieldTexts[index] || ''}
                                        placeholder='Add a new Clustername'
                                        onChange={ (event) => handleClusternameInputChange(event, index) }
                                    />
                                    <button className='add-clustername-btn'>➕</button>
                                </form>
                            </div>

                        </div>
                    )
                }

            </div>

            <form onSubmit={addNewSpecies}>
                <input
                    className='species-input-field'
                    type='text'
                    required='required'
                    pattern='^[^,]{1,30}$'
                    title='No commas allowed. Max length 30 characters'
                    value={newSpeciesInputFieldText}
                    placeholder='Add a new Species'
                    onChange={ (event) => setNewSpeciesInputFieldText(event.target.value) }
                />
                <button className='add-species-btn'>➕</button>
            </form>

        </div>
    )
}

export default AnnotationLabels