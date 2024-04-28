import React, {useState, useEffect} from 'react'
import ScalableSpec from "./ScalableSpec.jsx";
import GlobalConfig from "./GlobalConfig.jsx";
import AnnotationLabels from "./AnnotationLabels.jsx";
import {
    UNKNOWN_SPECIES,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_CLUSTERNAME,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    Species,
    Individual,
    Clustername
} from './species.js'
import {nanoid} from "nanoid";

// Global Variables
const SCROLL_STEP_RATIO = 0.1


function App() {
    const [importedLabels, setImportedLabels] = useState([]);

    const [speciesArray, setSpeciesArray] = useState(() => {
        const newIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL, 0)
        const newClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
        const newSpecies = new Species(nanoid(),UNKNOWN_SPECIES, [newIndividual], [newClustername] )

        return [newSpecies]
    })

    const [deletedItemID, setDeletedItemID] = useState(null)

    const [trackDurations, setTrackDurations] = useState([])
    const [showTracks, setShowTracks] = useState({
        track_1: true,
        track_2: false,
        track_3: false,
        track_4: false,
        track_5: false,
        track_6: false,
        track_7: false,
        track_8: false,
        track_9: false,
        track_10: false,
        track_11: false,
        track_12: false,
        track_13: false,
        track_14: false,
        track_15: false,
        track_16: false,
        track_17: false,
        track_18: false,
        track_19: false,
        track_20: false,
    })

    // General
    const [globalAudioDuration, setGlobalAudioDuration] = useState(null)
    const [globalClipDuration, setGlobalClipDuration] = useState(null)
    const [currentStartTime, setCurrentStartTime] = useState(0)
    const [currentEndTime, setCurrentEndTime] = useState(0)
    const [maxScrollTime, setMaxScrollTime] = useState(0)
    const [scrollStep, setScrollStep] = useState(0)

    const [activeLabel, setActiveLabel] = useState(null)

    const [globalHopLength, setGlobalHopLength] = useState('')
    const [globalNumSpecColumns, setGlobalNumSpecColumns] = useState('')
    const [globalSamplingRate, setGlobalSamplingRate] = useState('')
    const [defaultConfig, setDefaultConfig] = useState(null)
    const [showGlobalConfigWindow, setShowGlobalConfigWindow] = useState(false)

    const [audioPayloads, setAudioPayloads] = useState(null)

    /* ++++++++++++++++++ Pass methods ++++++++++++++++++ */

    function passTrackDurationToApp( newTrackDuration ) {
        setTrackDurations(prevState => [...prevState, newTrackDuration])
    }

    function passClipDurationToApp( newClipDuration ){
        setGlobalClipDuration( newClipDuration )
    }

    function passCurrentStartTimeToApp( newCurrentStartTime ){
        setCurrentStartTime( newCurrentStartTime )
    }

    function passCurrentEndTimeToApp( newCurrentEndTime ){
        setCurrentEndTime( newCurrentEndTime )
    }

    function passMaxScrollTimeToApp( newMaxScrollTime ){
        setMaxScrollTime( newMaxScrollTime )
    }

    function passScrollStepToApp( newScrollStep ){
        setScrollStep( newScrollStep )
    }

    function passSpeciesArrayToApp ( newSpeciesArray ){
        setSpeciesArray( newSpeciesArray )
    }

    function passActiveLabelToApp( newActiveLabel ){
        setActiveLabel( newActiveLabel )
    }

    function passGlobalHopLengthToApp( newHopLength ){
        setGlobalHopLength( newHopLength )
    }

    function passGlobalNumSpecColumnsToApp( newNumSpecColumns ){
        setGlobalNumSpecColumns( newNumSpecColumns )
    }

    function passGlobalSamplingRateToApp( newSamplingRate ){
        setGlobalSamplingRate( newSamplingRate )
    }

    function passDefaultConfigToApp( newDefaultConfig ){
        setDefaultConfig( newDefaultConfig )
    }

    function passShowGlobalConfigWindowToApp ( boolean ){
        setShowGlobalConfigWindow( boolean )
    }

    function passDeletedItemIDToApp( newDeletedItemID ){
        setDeletedItemID( newDeletedItemID )
    }

    /* ++++++++++++++++++ Audio Tracks ++++++++++++++++++ */

    function deletePreviousTrackDurationInApp( previousTrackDuration ) {
        const indexToRemove = trackDurations.indexOf(previousTrackDuration)

        if (indexToRemove === -1) return

        const newTrackDurations = [...trackDurations]
        newTrackDurations.splice(indexToRemove, 1)
        setTrackDurations(newTrackDurations)
    }

    function addTrack(){
        const firstFalseTrack = Object.keys(showTracks).find(
            trackKey => !showTracks[trackKey]
        )

        if (!firstFalseTrack) return

        setShowTracks({
            ...showTracks,
            [firstFalseTrack]: true
        })
    }

    function removeTrackInApp( trackID ){
        setShowTracks({
            ...showTracks,
            [trackID]: false
        })
        setDefaultConfig(null) // This is not great, but it prevents stale Default config from prevailing after a track is deleted. Ideally this would replaced by the config of another
    }


    /* ++++++++++++++++++ Controls ++++++++++++++++++ */

    function onZoomIn(){
        const newHopLength =  Math.max( Math.floor(globalHopLength / 2), 1)
        const newDuration = newHopLength / globalSamplingRate * globalNumSpecColumns
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
        const newStartTime = Math.min( newMaxScrollTime, currentStartTime)
        const newEndTime = newStartTime + newDuration
        updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime)
    }

    function onZoomOut(){
        const currentMaxHopLength = Math.floor( (globalAudioDuration * globalSamplingRate) / globalNumSpecColumns )
        const newHopLength = globalHopLength * 2 / globalSamplingRate * globalNumSpecColumns > globalAudioDuration? currentMaxHopLength : globalHopLength * 2
        const newDuration = newHopLength / globalSamplingRate * globalNumSpecColumns
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
        const newStartTime = Math.min( newMaxScrollTime, currentStartTime)
        const newEndTime = newStartTime + newDuration
        updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime , newEndTime)
    }

    function leftScroll() {
        setCurrentStartTime(
            prevStartTime => Math.max(prevStartTime - scrollStep, 0)
        )
        setCurrentEndTime(
            prevEndTime => Math.max(prevEndTime - scrollStep, globalClipDuration)
        )
    }

    function rightScroll() {
        setCurrentStartTime(
            prevStartTime => Math.min(prevStartTime + scrollStep, maxScrollTime)
        )
        setCurrentEndTime(
            prevEndTime => Math.min(prevEndTime + scrollStep, globalAudioDuration)
        )
    }

    function updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime){
        setGlobalHopLength(newHopLength)
        setGlobalClipDuration(newDuration)
        setMaxScrollTime(newMaxScrollTime)
        setCurrentStartTime( newStartTime )
        setCurrentEndTime(newEndTime)
        setScrollStep( newDuration * SCROLL_STEP_RATIO )
    }

    /* ++++++++++++++++++ useEffect Hooks ++++++++++++++++++ */

    useEffect( () => {
        if (trackDurations.length === 0) return

        const newGlobalDuration = Math.max(...trackDurations) === -Infinity ? 0 : Math.max(...trackDurations)
        //const newHopLength = Math.floor( (newGlobalDuration * globalSamplingRate) / globalNumSpecColumns )

        setGlobalAudioDuration(newGlobalDuration)
        //setGlobalHopLength(newHopLength)

    }, [trackDurations])

    // When the site was accessed with a URL data parameter
    useEffect( () => {
        let ignore = false

        const queryParams = new URLSearchParams(location.search)
        const decodedData = queryParams.get('data') ? JSON.parse(atob(decodeURIComponent(queryParams.get('data') ))) : null

        if (!decodedData) return

        setAudioPayloads(decodedData)

        // For each audio payload, turn on the track's visibility
        const newShowTracksObj = {}
        for (let i = 1; i <= 20; i++) {
            newShowTracksObj[`track_${i}`] = i <= decodedData.length
        }
        setShowTracks(newShowTracksObj)


        // Update Annotation Label buttons
        let updatedSpeciesArray = [...speciesArray]
        const allExistingSpeciesNames = speciesArray.map(speciesObj => speciesObj.name)
        const allImportedLabels = decodedData.flatMap(audioPayload => audioPayload.labels || [])

        for (let label of allImportedLabels){

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
                        const newClustername = new Clustername(nanoid(), label.clustername)
                        newClustername.isActive = false
                        speciesObj.clusternames = [...speciesObj.clusternames, newClustername]
                    }
                }
            }

            // If imported species does not exist already, create a new one
            if (!allExistingSpeciesNames.includes(label.species)){
                const newUnknownIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL, 0)
                const newUnknownClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
                const newIndividual = new Individual(nanoid(), label.individual)
                const newClustername = new Clustername(nanoid(), label.clustername)
                newIndividual.isActive = false
                newClustername.isActive = false
                newUnknownIndividual.isActive = false
                newUnknownClustername.isActive = false

                const newSpecies = new Species(
                    nanoid(),
                    label.species,
                    [newUnknownIndividual, newIndividual],
                    [newUnknownClustername, newClustername],
                )
                allExistingSpeciesNames.push(label.species)
                updatedSpeciesArray.push(newSpecies)
            }
        }

        setSpeciesArray(updatedSpeciesArray)

        return () => {
            ignore = true
        }

    }, [location])

    return (
        <>
            <AnnotationLabels
                speciesArray={speciesArray}
                passSpeciesArrayToApp={passSpeciesArrayToApp}
                passDeletedItemIDToApp={passDeletedItemIDToApp}
            />
            <div className='controls-container'>
                <button
                    id='left-scroll-btn'
                    onClick={leftScroll}
                />
                <button
                    onClick={onZoomIn}
                >
                    +🔍
                </button>
                <button
                    onClick={onZoomOut}
                >
                    -🔍
                </button>
                <button
                    id='right-scroll-btn'
                    onClick={rightScroll}
                />
            </div>
            <div
                id='blank-space'
            >
            </div>
            <div
                id='all-tracks'
                onMouseLeave={ () => setActiveLabel(null)}
            >
                <button id='open-global-config-btn' onClick={ () => setShowGlobalConfigWindow(true)}>⚙️</button>
            {showGlobalConfigWindow &&

                <GlobalConfig
                    globalAudioDuration={globalAudioDuration}
                    currentStartTime={currentStartTime}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    defaultConfig={defaultConfig}
                    passShowGlobalConfigWindowToApp={passShowGlobalConfigWindowToApp}
                />
            }
            {showTracks.track_1 &&
                <ScalableSpec
                    id='track_1'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={true}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[0] : null}
                />
            }
            {showTracks.track_2 &&
                <ScalableSpec
                    id='track_2'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[1] : null}
                />
            }
            {showTracks.track_3 &&
                <ScalableSpec
                    id='track_3'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[2] : null}
                />
            }
            {showTracks.track_4 &&
                <ScalableSpec
                    id='track_4'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[3] : null}
                />
            }
            {showTracks.track_5 &&
                <ScalableSpec
                    id='track_5'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[4] : null}
                />
            }
            {showTracks.track_6 &&
                <ScalableSpec
                    id='track_6'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[5] : null}
                />
            }
            {showTracks.track_7 &&
                <ScalableSpec
                    id='track_7'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[6] : null}
                />
            }
            {showTracks.track_8 &&
                <ScalableSpec
                    id='track_8'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[7] : null}
                />
            }
            {showTracks.track_9 &&
                <ScalableSpec
                    id='track_9'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[8] : null}
                />
            }
            {showTracks.track_10 &&
                <ScalableSpec
                    id='track_10'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[9] : null}
                />
            }
            {showTracks.track_11 &&
                <ScalableSpec
                    id='track_11'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[10] : null}
                />
            }
            {showTracks.track_12 &&
                <ScalableSpec
                    id='track_12'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[11] : null}
                />
            }
            {showTracks.track_13 &&
                <ScalableSpec
                    id='track_13'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[12] : null}
                />
            }
            {showTracks.track_14 &&
                <ScalableSpec
                    id='track_14'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[13] : null}
                />
            }
            {showTracks.track_15 &&
                <ScalableSpec
                    id='track_15'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[14] : null}
                />
            }
            {showTracks.track_16 &&
                <ScalableSpec
                    id='track_16'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[15] : null}
                />
            }
            {showTracks.track_17 &&
                <ScalableSpec
                    id='track_17'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[16] : null}
                />
            }
            {showTracks.track_18 &&
                <ScalableSpec
                    id='track_18'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[17] : null}
                />
            }
            {showTracks.track_19 &&
                <ScalableSpec
                    id='track_19'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[18] : null}
                />
            }
            {showTracks.track_20 &&
                <ScalableSpec
                    id='track_20'
                    trackDurations={trackDurations}
                    speciesArray={speciesArray}
                    deletedItemID={deletedItemID}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                    passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                    audioPayload={audioPayloads? audioPayloads[19] : null}
                />
            }
            <button
                onClick={addTrack}
            >
                Add Track
            </button>
            </div>
        </>
    )
}

export default App