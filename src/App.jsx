import React, {useState, useEffect} from 'react'
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import SettingsIcon from '@mui/icons-material/Settings';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ScalableSpec from "./ScalableSpec.jsx";
import GlobalConfig from "./GlobalConfig.jsx";
import AnnotationLabels from "./AnnotationLabels.jsx";
import {
    UNKNOWN_SPECIES,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_CLUSTERNAME,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    ANNOTATED_AREA,
    ANNOTATED_AREA_INDIVIDUAL,
    ANNOTATED_AREA_CLUSTERNAME,
    ANNOTATED_AREA_COLOR,
    Species,
    Individual,
    Clustername
} from './species.js'
import {globalControlsBtn, globalControlsBtnDisabled, icon, iconBtn, iconBtnDisabled} from "./styles.js"
import {nanoid} from "nanoid";
import ZoomInIcon from "@mui/icons-material/ZoomIn.js";
import ZoomOutIcon from "@mui/icons-material/ZoomOut.js";
import DoneAllIcon from '@mui/icons-material/DoneAll';
import axios from "axios";
import Export from "./Export.jsx";
import ImportCSV from "./ImportCSV.jsx";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Global Variables
const SCROLL_STEP_RATIO = 0.1

function App() {
    const [csvImportedLabels, setCsvImportedLabels] = useState(null);

    const [speciesArray, setSpeciesArray] = useState(() => {
        const annotatedAreaIndividual = new Individual(nanoid(), ANNOTATED_AREA_INDIVIDUAL)
        const annotatedAreaClustername = new Clustername(nanoid(), ANNOTATED_AREA_CLUSTERNAME, ANNOTATED_AREA_COLOR)
        annotatedAreaIndividual.isActive = false
        annotatedAreaClustername.isActive = false
        const annotatedAreaLabel = new Species(nanoid(), ANNOTATED_AREA, [annotatedAreaIndividual],  [annotatedAreaClustername])

        const newIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL)
        const newClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
        const newSpecies = new Species(nanoid(),UNKNOWN_SPECIES, [newIndividual], [newClustername] )

        return [newSpecies, annotatedAreaLabel]
    })

    const [deletedItemID, setDeletedItemID] = useState(null)

    const [trackDurations, setTrackDurations] = useState([])
    const [tracks, setTracks] = useState([
        {trackID: 0, visible: true, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 1, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 2, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 3, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 4, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 5, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 6, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 7, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 8, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 9, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 10, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 11, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 12, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 13, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 14, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 15, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 16, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 17, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 18, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
        {trackID: 19, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null},
    ])

    // General
    const [globalAudioDuration, setGlobalAudioDuration] = useState(null)
    const [globalClipDuration, setGlobalClipDuration] = useState(null)
    const [currentStartTime, setCurrentStartTime] = useState(0)
    const [currentEndTime, setCurrentEndTime] = useState(0)
    const [maxScrollTime, setMaxScrollTime] = useState(0)
    const [scrollStep, setScrollStep] = useState(0)

    const [globalHopLength, setGlobalHopLength] = useState('')
    const [globalNumSpecColumns, setGlobalNumSpecColumns] = useState('')
    const [globalSamplingRate, setGlobalSamplingRate] = useState('')
    const [defaultConfig, setDefaultConfig] = useState(null)
    const [showGlobalConfigWindow, setShowGlobalConfigWindow] = useState(false)

    const [audioPayloads, setAudioPayloads] = useState(null)
    const [strictMode, setStrictMode] = useState(false)

    const [activeLabel, setActiveLabel] = useState(null)

    const [allLabels, setAllLabels] = useState({})

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

    function passActiveLabelToApp( newActiveLabel ){
        setActiveLabel( newActiveLabel )
    }

    function passLabelsToApp( labels, trackID ){
        setAllLabels(
            {
                ...allLabels,
                [trackID]: labels
            }
        )
    }

    function passCsvImportedLabelsToApp ( newImportedLabels ){
        setCsvImportedLabels( newImportedLabels )
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
        const firstFalseTrack = tracks.find(track => !track.visible)

        if (!firstFalseTrack) return

        const updatedTracks = tracks.map( track => {
            if (track.trackID === firstFalseTrack.trackID){
                return {...track, visible: true}
            } else {
                return track
            }
        })

        setTracks(updatedTracks)
    }

    function removeTrackInApp( trackID ){
        const updatedTracks = tracks.map( track => {
            if (track.trackID === trackID){
                return {...track, visible: false, audioDuration: null, audioID: null, frequencies: null, spectrogram: null}
            } else {
                return track
            }
        })

        setTracks(updatedTracks)

        setDefaultConfig(null) // This is not great, but it prevents stale Default config from prevailing after a track is deleted. Ideally this would be replaced by the config of another
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

    async function submitAllAnnotations(){
        if (!allLabels) return

        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'post-annotations'

        let allLabelsArray = Object.values(allLabels).flat()

        if (!allLabelsArray.length) {
            alert('There are currently no annotations. Add some and try again.')
            return
        }

        // Remove trackID property for all label objects (it's irrelevant for the database)
        allLabelsArray = allLabelsArray.map(labelObj => {
            return {
                onset: labelObj.onset,
                offset: labelObj.offset,
                species: labelObj.species,
                individual: labelObj.individual,
                clustername: labelObj.clustername,
                filename: labelObj.filename,
                annotation_instance: labelObj.annotation_instance
            }
        })

        const requestParameters = {
            annotations: allLabelsArray
        }

        const headers = {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        }

        try {
            await axios.post(path, requestParameters, { headers } )
            toast.success('Annotations submitted successfully!')
        } catch (error) {
            alert('Something went wrong trying to submit the annotations. Check the console for more information.')
            console.log(error)
        }

    }

    function createSpeciesFromImportedLabels (importedLabels){
        let updatedSpeciesArray = [...speciesArray]
        const allExistingSpeciesNames = speciesArray.map(speciesObj => speciesObj.name)

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
                        const newClustername = new Clustername(nanoid(), label.clustername)
                        newClustername.isActive = false
                        speciesObj.clusternames = [...speciesObj.clusternames, newClustername]
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
                    const newClustername = new Clustername(nanoid(), label.clustername)
                    newClustername.isActive = false
                    newClusternamesArray.push(newClustername)
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

        setSpeciesArray(updatedSpeciesArray)
    }

    /* ++++++++++++++++++ File Upload ++++++++++++++++++ */

    /*
        1. Make a new handleUploadRepsonse function. DONE
        1.1 Clicking the upload button does the following:
            a) for each channel in the audio track, add the response to the reponse state array in App.jsx DONE
        2. Store all responses in a state array in app {trackId: response} DONE
        3. Remove response state in scalable spec DONE
        4. Feed responses to scalable spec DONE
        5. in the existing response use effect, when response changes, to the stuff that handleUploadRepsonse currently does DONE
        6. pass handleUploadResponse to all other instances of Scalable Spec DONE
        6.1 Fix issue: when uploading single file and then uploading multi-channel file, there is a key error in the backend
        6.2
        6.3 Refactor track durations into tracks
        6.3.1 Display filenames as the button name
        6.4 Currently it loads simply the first n tracks. Later I want to detect the n button that was clicked and load the tracks from then on.
        7. Adapt uploadbyURL method

     */

    const handleUploadResponse = (newResponse) => {
        // Update tracks
        const newChannels = newResponse.data.channels

        /*
        setTracks(prevTracks => {
            const updatedTracks = { ...prevTracks }

            let i = 1
            for (const channel of newChannels) {
                const trackKey = `track_${i}`

                updatedTracks[trackKey] = {
                    ...updatedTracks[trackKey],
                    visible: true,
                    audioDuration: channel.audio_duration,
                    audioID: channel.audio_id,
                    frequencies: channel.freqs,
                    spectrogram: channel.spec
                }

                i++
            }

            return updatedTracks
        })*/

        const updatedTracks = tracks.map( (track, i) => {
            if (newChannels[i]){
                return {
                    trackID: i,
                    visible: true,
                    audioDuration: newChannels[i].audio_duration,
                    audioID: newChannels[i].audio_id,
                    frequencies: newChannels[i].freqs,
                    spectrogram: newChannels[i].spec
                }
            } else {
                return track
            }

        })

        setTracks(updatedTracks)

        // Update Global Values
        const newConfigurations = newResponse.data.configurations

        const trackDuration = newChannels[0].audio_duration
        const hopLength = newConfigurations.hop_length
        const numSpecColumns = newConfigurations.num_spec_columns
        const samplingRate = newConfigurations.sampling_rate
        const defaultConfig = {
            hop_length: hopLength,
            num_spec_columns: numSpecColumns,
            sampling_rate: samplingRate
        }

        passTrackDurationToApp( trackDuration )
        setGlobalHopLength( hopLength )
        setGlobalNumSpecColumns( numSpecColumns )
        setGlobalSamplingRate( samplingRate )
        setDefaultConfig( defaultConfig )
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
        const strictMode = queryParams.get('strict-mode') ? queryParams.get('strict-mode') : null

        if (strictMode?.toLowerCase() === 'true'){
            setStrictMode(true)
        }

        if (!decodedData) return

        setAudioPayloads(decodedData)

        // For each audio payload, turn on the track's visibility
        const newtracksObj = {}
        for (let i = 1; i <= 20; i++) {
            newtracksObj[`track_${i}`] = i <= decodedData.length
        }
        setTracks(newtracksObj)

        // Create Species, Individuals and clustername buttons deriving from the imported labels
        const urlImportedLabels = decodedData.flatMap(audioPayload => audioPayload.labels || [])
        createSpeciesFromImportedLabels(urlImportedLabels)

        return () => {
            ignore = true
        }

    }, [location])

    // When labels are imported from a local CSV file
    useEffect( () => {
        if (!csvImportedLabels) return

        const csvImportedLabelsArray = Object.values(csvImportedLabels).flat()
        createSpeciesFromImportedLabels(csvImportedLabelsArray)

    }, [csvImportedLabels])


    return (
        <>
            <ToastContainer />
            <AnnotationLabels
                speciesArray={speciesArray}
                passSpeciesArrayToApp={passSpeciesArrayToApp}
                passDeletedItemIDToApp={passDeletedItemIDToApp}
                strictMode={strictMode}
            />
            <div id='controls-container'>
                <div id='zoom-scroll-buttons-container'>
                    <button
                        id='left-scroll-btn'
                        onClick={leftScroll}
                    />
                    <IconButton style={strictMode ? globalControlsBtnDisabled : globalControlsBtn} disabled={strictMode} onClick={onZoomIn}>
                        <ZoomInIcon style={icon}/>
                    </IconButton>
                    <IconButton style={strictMode ? globalControlsBtnDisabled : globalControlsBtn} disabled={strictMode} onClick={onZoomOut}>
                        <ZoomOutIcon style={icon}/>
                    </IconButton>
                    <button
                        id='right-scroll-btn'
                        onClick={rightScroll}
                    />
                </div>
                <div id={'settings-download-submit-container'}>
                    <ImportCSV
                        passCsvImportedLabelsToApp={passCsvImportedLabelsToApp}
                    />
                    <Export
                        allLabels={allLabels}
                    />
                    <Tooltip title='Submit Annotations'>
                        <IconButton
                            style={{...globalControlsBtn, ...(!strictMode && iconBtnDisabled)}}
                            disabled={!strictMode}
                            onClick={submitAllAnnotations}
                        >
                            <DoneAllIcon style={icon} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='Open Global Configurations'>
                        <IconButton
                            style={globalControlsBtn}
                            onClick={ () => setShowGlobalConfigWindow(true)}>
                            <SettingsIcon style={icon} />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
            <div
                id='blank-space'
            >
            </div>


            <div
                id='all-tracks'
            >
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
                        strictMode={strictMode}
                    />
                }
                {tracks[0].visible &&
                    <ScalableSpec
                        trackID={tracks[0].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[0] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels ? csvImportedLabels['track_1'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[0]}
                    />
                }
                {tracks[1].visible &&
                    <ScalableSpec
                        trackID={tracks[1].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[1] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_2'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[1]}
                    />
                }
                {tracks[2].visible &&
                    <ScalableSpec
                        trackID={tracks[2].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[2] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_3'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[2]}
                    />
                }
                {tracks[3].visible &&
                    <ScalableSpec
                        trackID={tracks[3].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[3] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_4'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[3]}
                    />
                }
                {tracks[4].visible  &&
                    <ScalableSpec
                        trackID={tracks[4].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[4] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_5'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[4]}
                    />
                }
                {tracks[5].visible  &&
                    <ScalableSpec
                        trackID={tracks[5].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[5] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_6'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[5]}
                    />
                }
                {tracks[6].visible  &&
                    <ScalableSpec
                        trackID={tracks[6].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[6] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_7'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[6]}
                    />
                }
                {tracks[7].visible  &&
                    <ScalableSpec
                        trackID={tracks[7].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[7] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_8'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[7]}
                    />
                }
                {tracks[8].visible  &&
                    <ScalableSpec
                        trackID={tracks[8].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[8] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_9'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[8]}
                    />
                }
                {tracks[9].visible  &&
                    <ScalableSpec
                        trackID={tracks[9].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[9] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_10'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[9]}
                    />
                }
                {tracks[10].visible  &&
                    <ScalableSpec
                        trackID={tracks[10].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[10] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_11'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[10]}
                    />
                }
                {tracks[11].visible  &&
                    <ScalableSpec
                        trackID={tracks[11].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[11] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_12'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[11]}
                    />
                }
                {tracks[12].visible  &&
                    <ScalableSpec
                        trackID={tracks[12].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[12] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_13'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[12]}
                    />
                }
                {tracks[13].visible  &&
                    <ScalableSpec
                        trackID={tracks[13].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[13] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_14'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[13]}
                    />
                }
                {tracks[14].visible  &&
                    <ScalableSpec
                        trackID={tracks[14].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[14] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_15'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[14]}
                    />
                }
                {tracks[15].visible  &&
                    <ScalableSpec
                        trackID={tracks[15].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[15] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_16'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[15]}
                    />
                }
                {tracks[16].visible  &&
                    <ScalableSpec
                        trackID={tracks[16].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[16] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_17'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[16]}
                    />
                }
                {tracks[17].visible  &&
                    <ScalableSpec
                        trackID={tracks[17].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[17] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_18'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[17]}
                    />
                }
                {tracks[18].visible  &&
                    <ScalableSpec
                        trackID={tracks[18].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[18] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_19'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[18]}
                    />
                }
                {tracks[19].visible  &&
                    <ScalableSpec
                        trackID={tracks[19].trackID}
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
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        passDefaultConfigToApp={passDefaultConfigToApp}
                        audioPayload={audioPayloads? audioPayloads[19] : null}
                        activeLabel={activeLabel}
                        passActiveLabelToApp={passActiveLabelToApp}
                        strictMode={strictMode}
                        passLabelsToApp={passLabelsToApp}
                        csvImportedLabels={csvImportedLabels? csvImportedLabels['track_20'] : null}
                        handleUploadResponse={handleUploadResponse}
                        trackData={tracks[19]}
                    />
                }
                <Tooltip title="Add New Track">
                    <IconButton style={strictMode ? iconBtnDisabled : iconBtn} disabled={strictMode} onClick={addTrack}>
                        <AddBoxIcon style={icon}/>
                    </IconButton>
                </Tooltip>
            </div>
        </>
    )
}

export default App