import React, {useState} from "react";
import {nanoid} from 'nanoid'
import Colorwheel from "./Colorwheel.jsx";
import {
    DEFAULT_CLUSTERNAME_COLOR,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    INACTIVE_BUTTON_COLOR,
    UNKNOWN_CLUSTERNAME,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_SPECIES,
    Species,
    Individual,
    Clustername,
    activateIndividual,
    activateClustername,
    deactivateExistingIndividuals,
    deactivateExistingClusternames,
    checkIfEveryObjectIsInactive
} from './species.js'

function AnnotationLabels ({speciesArray, passSpeciesArrayToApp, passDeletedItemIDToApp}) {

    const [newSpeciesInputFieldText, setNewSpeciesInputFieldText] = useState('')
    const [newIndividualInputFieldTexts, setNewIndividualInputFieldTexts] = useState([])
    const [newClusternameInputFieldTexts, setNewClusternameInputFieldTexts] = useState([])

    /* ++++++++++++++++++++ Species ++++++++++++++++++++ */

    const addNewSpecies = (event) => {
        event.preventDefault()

        setNewSpeciesInputFieldText('')

        const allSpeciesNames = speciesArray.map( speciesObject => speciesObject.name )
        if (checkIfObjectNameAlreadyExists(newSpeciesInputFieldText, allSpeciesNames)){
            alert(`${newSpeciesInputFieldText} already exists. Add a different one.`)
            return
        }

        // Deactivate all Individuals and all Clusternames of all Species
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
            const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

            return new Species(
                speciesObject.id,
                speciesObject.name,
                [...updatedIndividuals],
                [...updatedClusternames]
            )
        })

        // Create new Species
        const newIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL)
        const newClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
        const newSpecies = new Species(nanoid(),newSpeciesInputFieldText, [newIndividual], [newClustername] )

        modifiedSpeciesArray.push(newSpecies)
        passSpeciesArrayToApp( modifiedSpeciesArray )
    }

    const deleteSpecies = (selectedID, index) => {
        if (!confirm('Deleting this Species will remove any annotations associated with it.')) return
        passDeletedItemIDToApp(selectedID)

        // Check if species is active
        const wasDeletedSpeciesInactive = checkIfEveryObjectIsInactive(speciesArray[index].individuals)

        // Delete Species
        let modifiedSpeciesArray = speciesArray.filter(speciesObject => speciesObject.id !== selectedID)

        // Activate Clusternames and Individual of the last species in modifiedSpeciesArray, but only if the deleted Species was active
        modifiedSpeciesArray = modifiedSpeciesArray.map((speciesObject, index) => {
            if (index === modifiedSpeciesArray.length - 1 && !wasDeletedSpeciesInactive) {
                const updatedIndividuals = activateIndividual(speciesObject.individuals, UNKNOWN_INDIVIDUAL)
                const updatedClusternames = activateClustername(speciesObject.clusternames, UNKNOWN_CLUSTERNAME)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const editSpecies = (selectedID) => {
        let editedSpeciesName = prompt('Change species name: ')
        if (!editedSpeciesName) return

        const allSpeciesNames = speciesArray.map(speciesObject => speciesObject.name)
        if (allSpeciesNames.some(name => name === editedSpeciesName)) {
            alert(`${editedSpeciesName} already exists. Add a different one.`)
            return
        }

        const modifiedSpeciesArray = speciesArray.map( speciesObject => {
            if (speciesObject.id === selectedID) {
                return new Species(
                    speciesObject.id,
                    editedSpeciesName,
                    speciesObject.individuals,
                    speciesObject.clusternames
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
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
                const updatedClusternames = checkIfEveryObjectIsInactive(speciesObject.clusternames)
                    ? activateClustername(speciesObject.clusternames, UNKNOWN_CLUSTERNAME)
                    : speciesObject.clusternames

                // If individual already exists, activate that one and alert the user
                const allIndividualNames = speciesObject.individuals.map( individual => individual.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(newIndividualName, allIndividualNames)
                if ( alreadyExistingObjectName ) {
                    const updatedIndividuals = activateClustername(speciesObject.individuals, alreadyExistingObjectName)
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)
                    return new Species(
                        speciesObject.id,
                        speciesObject.name,
                        [...updatedIndividuals],
                        [...updatedClusternames]
                    )
                }

                // Deactivate existing individuals of the current species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals, new Individual(nanoid(),newIndividualName)],
                    [...updatedClusternames]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })
        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const handleIndividualInputChange = (event, index) => {
        const updatedIndividualInputFieldTexts = [...newIndividualInputFieldTexts]
        updatedIndividualInputFieldTexts[index] = event.target.value
        setNewIndividualInputFieldTexts(updatedIndividualInputFieldTexts)
    }

    const deleteIndividual = (event, selectedID, selectedIndividual) => {
        event.preventDefault()

        if (selectedIndividual.name === UNKNOWN_INDIVIDUAL) return

        if (!confirm('Deleting this Individual will remove any annotations associated with it.')) return
        passDeletedItemIDToApp(selectedIndividual.id)

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Delete selected Individual
                let updatedIndividuals = speciesObject.individuals.filter( individual => individual !== selectedIndividual)

                // If the deleted clustername was the active one, activate "Unknown Clustername"
                updatedIndividuals = checkIfEveryObjectIsInactive(updatedIndividuals) && !checkIfEveryObjectIsInactive(speciesObject.clusternames)
                    ? activateClustername(updatedIndividuals, UNKNOWN_INDIVIDUAL)
                    : updatedIndividuals

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    speciesObject.clusternames
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const editIndividual = (selectedID, selectedIndividual) => {
        let editedIndividual = prompt('Change individual: ')
        if (!editedIndividual) return

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allIndividualNames = speciesObject.individuals.map( individual => individual.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(editedIndividual, allIndividualNames)
                if ( alreadyExistingObjectName) {
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)
                    return speciesObject
                }

                const updatedIndividuals = speciesObject.individuals.map( individual => {
                    const updatedIndividual = new Individual( individual.id, editedIndividual)
                    return individual.name === selectedIndividual.name ? updatedIndividual : individual
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    speciesObject.clusternames
                )

            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const handleClickIndividual = (selectedID, selectedIndividual) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate selected individual, deactivate all others
                const updatedIndividuals = activateIndividual(speciesObject.individuals, selectedIndividual.name)

                // Activate Unknown clustername, only if all other clusternames are inactive (this happens when the user switches species)
                const updatedClusternames = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateClustername(speciesObject.clusternames, UNKNOWN_CLUSTERNAME)
                    : speciesObject.clusternames

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
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
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateIndividual(speciesObject.individuals, UNKNOWN_INDIVIDUAL)
                    : speciesObject.individuals

                // If clustername already exists, activate that one and alert the user
                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(newClusternameName, allClusternameNames)
                if ( alreadyExistingObjectName ) {
                    const updatedClusternames = activateClustername(speciesObject.clusternames, alreadyExistingObjectName)
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)

                    return new Species(
                        speciesObject.id,
                        speciesObject.name,
                        [...updatedIndividuals],
                        [...updatedClusternames]
                    )
                }

                // Deactivate existing clusternames of the current species
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames, new Clustername(nanoid(), newClusternameName, DEFAULT_CLUSTERNAME_COLOR)]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })
        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const handleClusternameInputChange = (event, index) => {
        const updatedClusternameInputFieldTexts = [...newClusternameInputFieldTexts]
        updatedClusternameInputFieldTexts[index] = event.target.value
        setNewClusternameInputFieldTexts(updatedClusternameInputFieldTexts)
    }

    const deleteClustername = (event, selectedID, selectedClustername) => {
        event.preventDefault()

        if (selectedClustername.name === UNKNOWN_CLUSTERNAME) return

        if (!confirm('Deleting this Clustername will remove any annotations associated with it.')) return
        passDeletedItemIDToApp(selectedClustername.id)

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Delete selected clustername
                let updatedClusternames = speciesObject.clusternames.filter( clustername => clustername !== selectedClustername)

                // If the deleted clustername was the active one, activate "Unknown Clustername"
                updatedClusternames = checkIfEveryObjectIsInactive(updatedClusternames) && !checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateClustername(updatedClusternames, UNKNOWN_CLUSTERNAME)
                    : updatedClusternames

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames]
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
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
                    const updatedClustername = new Clustername(clustername.id, editedClustername, clustername.color)
                    return clustername.name === selectedClustername.name ? updatedClustername : clustername
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames]
                )

            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const handleClickClustername = (selectedID, selectedClustername) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate selected clustername, deactivate all others
                const updatedClusternames = activateClustername(speciesObject.clusternames, selectedClustername.name)

                // Activate Unknown individual, only if all other Individuals are inactive (this happens when the user switches species)
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateIndividual(speciesObject.individuals, UNKNOWN_INDIVIDUAL)
                    : speciesObject.individuals

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const toggleColorwheel = (selectedID, selectedClustername) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    if (clustername === selectedClustername){
                        const updatedClustername = new Clustername(clustername.id, clustername.name, clustername.color)
                        updatedClustername.isActive = clustername.isActive
                        updatedClustername.showColorwheel = !clustername.showColorwheel
                        return updatedClustername
                    } else {
                        return clustername
                    }
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames]
                )

            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const passChosenColorToAnnotationLabels = (selectedID, selectedClustername, newColor) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    if (clustername === selectedClustername){
                        const updatedClustername = new Clustername(clustername.id, clustername.name, newColor)
                        updatedClustername.isActive = clustername.isActive
                        updatedClustername.showColorwheel = clustername.showColorwheel
                        return updatedClustername
                    } else {
                        return clustername
                    }
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames]
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }


    /* ++++++++++++++++++++ Helper methods ++++++++++++++++++++ */

    const checkIfObjectNameAlreadyExists = ( newObjectName, array ) => {
        for (let objectName of array){
            if (objectName === newObjectName){
                return objectName
            }
        }
    }


    return (
        <div id='annotation-labels-container'>

            <div id='annotation-labels-menu'>
                {
                    speciesArray.map( (species, index) =>
                        <fieldset
                            id={species.id}
                            key={species.id}
                            className='species'
                        >
                            <legend>
                                {species.name}
                                {species.name !== UNKNOWN_SPECIES && <button className='edit-species-btn' onClick={() => editSpecies(species.id)}>✏️</button>}
                                {species.name !== UNKNOWN_SPECIES && <button className='delete-species-btn' onClick={() => deleteSpecies(species.id, index)}>🗑️</button>}
                            </legend>

                            <div className='individual-btn-container'>
                                Individuals:
                                {
                                    species.individuals.map( individual =>
                                        <div
                                            key={individual.id}
                                            className='individual-btn'
                                            isactive={individual.isActive.toString()}>
                                            <div
                                                className='individual-btn-name'
                                                onClick={ () => handleClickIndividual(species.id, individual) }
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
                                            key={clustername.id}
                                            className='clustername-btn'
                                            style={{
                                                borderLeft: `2px solid ${clustername.color}`,
                                                backgroundColor: clustername.isActive? clustername.color : INACTIVE_BUTTON_COLOR
                                            }}
                                            isactive={clustername.isActive.toString()}
                                        >
                                            <div
                                                className='clustername-btn-name'
                                                isactive={clustername.isActive.toString()}
                                                onClick={ () => handleClickClustername(species.id, clustername) }
                                                onContextMenu={ (event) => deleteClustername(event, species.id, clustername)}
                                            >
                                                {clustername.name}
                                            </div>
                                            <button
                                                className='colorwheel-btn'
                                                onClick={ () => toggleColorwheel(species.id, clustername) }
                                                onContextMenu={ (event) => event.preventDefault() }
                                            >
                                                🎨️
                                            </button>
                                            {
                                                clustername.showColorwheel &&
                                                <Colorwheel
                                                    toggleColorwheel={toggleColorwheel}
                                                    passChosenColorToAnnotationLabels={passChosenColorToAnnotationLabels}
                                                    selectedID={species.id}
                                                    selectedClustername={clustername} />}
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

                        </fieldset>
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